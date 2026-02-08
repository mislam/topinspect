import { useCallback, useEffect, useMemo, useState } from "react"

import * as ImageManipulator from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

import { logger } from "../logger"
import {
	getDisplayImageUrl,
	type ImageSize,
	isPreviewImage,
	isUploadedImage,
} from "../utils/image-url"

// Import auth store dynamically to avoid module loading issues
const getAuthStore = () => {
	try {
		const { useAuthStore } = require("@the/auth/expo")
		return useAuthStore
	} catch (error) {
		console.warn("Failed to load auth store:", error)
		return null
	}
}

export interface ImageItem {
	url: string
	status: "preview" | "uploaded"
}

// Image size configurations
export const IMAGE_SIZES = {
	thumbnail: { width: 150, height: 150, quality: 0.8 },
	medium: { width: 400, height: 400, quality: 0.85 },
	large: { width: 1200, height: 1200, quality: 0.9 },
	original: { width: 0, height: 0, quality: 0.95 },
} as const

export interface UseImageUploadOptions {
	images: string[] // Array of imageIds or file:// URLs
	onImagesChange: (images: string[]) => void
	maxImages?: number
	onError?: (message: string) => void
	api: {
		post: (
			url: string,
			data: unknown,
		) => Promise<{ data: { imageId: string; fields: { key: string; contentType: string } } }>
	}
	// New options for resizing
	enableResizing?: boolean
	requiredSizes?: ImageSize[]
	maxFileSize?: number // in MB
	displaySize?: ImageSize // Size to use for display
}

export const useImageUpload = ({
	images,
	onImagesChange,
	maxImages = 5,
	onError,
	api,
	enableResizing = true,
	requiredSizes = ["thumbnail", "medium", "large"],
	maxFileSize = 5, // 5MB default
	displaySize = "large",
}: UseImageUploadOptions) => {
	const [isPicking, setIsPicking] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [initialImages, setInitialImages] = useState<string[]>([])
	const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())
	const [uploadedImages, setUploadedImages] = useState<Set<string>>(new Set())

	// Convert string array to ImageItem array, detecting status from URL
	const imageItems: ImageItem[] = useMemo(
		() =>
			images.map((url) => ({
				url,
				status: isPreviewImage(url) ? "preview" : "uploaded",
			})),
		[images],
	)

	// Helper to get only saved imageIds (for saving to database)
	const getSavedImageIds = () => {
		// Read directly from images prop to ensure we get the latest data
		return images.filter((url) => isUploadedImage(url))
	}

	// Helper to check if there are pending images to upload
	const hasPendingImages = () => imageItems.some((item) => item.status === "preview")

	// Helper to detect if images have changed (added, removed, or reordered)
	const hasUnsavedChanges = () => {
		if (initialImages.length === 0) return false

		// Check if arrays are different lengths
		if (initialImages.length !== images.length) return true

		// Check if arrays have different content
		const initialSet = new Set(initialImages)
		const currentSet = new Set(images)

		// Check if any images were added or removed
		if (initialSet.size !== currentSet.size) return true

		// Check if any initial images are missing
		for (const initialImage of initialImages) {
			if (!currentSet.has(initialImage)) return true
		}

		// Check if order has changed
		for (let i = 0; i < initialImages.length; i++) {
			if (initialImages[i] !== images[i]) return true
		}

		return false
	}

	// Process image into multiple sizes
	const processImage = useCallback(
		async (
			imageUri: string,
		): Promise<
			{ uri: string; size: ImageSize; width: number; height: number; fileSize: number }[]
		> => {
			if (!enableResizing) {
				return [
					{
						uri: imageUri,
						size: "original",
						width: 0,
						height: 0,
						fileSize: 0,
					},
				]
			}

			const processedImages: {
				uri: string
				size: ImageSize
				width: number
				height: number
				fileSize: number
			}[] = []

			try {
				// Check file size
				const response = await fetch(imageUri)
				const blob = await response.blob()
				const fileSizeMB = blob.size / (1024 * 1024)

				if (fileSizeMB > maxFileSize) {
					throw new Error(`Image too large. Maximum size is ${maxFileSize}MB`)
				}

				// Process each required size
				for (const sizeKey of requiredSizes) {
					const sizeConfig = IMAGE_SIZES[sizeKey]

					// Skip original size as it doesn't have width/height
					if (sizeKey === "original") {
						processedImages.push({
							uri: imageUri,
							size: sizeKey,
							width: 0,
							height: 0,
							fileSize: 0,
						})
						continue
					}

					const result = await ImageManipulator.manipulateAsync(
						imageUri,
						[
							{
								resize: {
									width: sizeConfig.width,
									height: sizeConfig.height,
								},
							},
						],
						{
							compress: sizeConfig.quality,
							format: ImageManipulator.SaveFormat.JPEG,
						},
					)

					// Get processed image info
					const processedResponse = await fetch(result.uri)
					const processedBlob = await processedResponse.blob()

					processedImages.push({
						uri: result.uri,
						size: sizeKey,
						width: result.width,
						height: result.height,
						fileSize: processedBlob.size,
					})
				}

				return processedImages
			} catch (error) {
				console.error("Image processing failed:", error)
				throw error
			}
		},
		[enableResizing, requiredSizes, maxFileSize],
	)

	// Upload a single processed image
	const uploadProcessedImage = useCallback(
		async (processedImage: { uri: string; size: ImageSize }, baseImageId: string) => {
			try {
				// Map size to suffix
				const sizeSuffix = {
					thumbnail: "t",
					medium: "m",
					large: "l",
					original: "",
				}[processedImage.size]

				// Get file info with consistent naming
				const fileName = sizeSuffix ? `${baseImageId}_${sizeSuffix}.jpg` : `${baseImageId}.jpg`
				const contentType = "image/jpeg"

				// Get presigned URL
				const presignedResponse = await api.post("~/upload/presigned-url", {
					contentType,
					fileName,
				})

				const { fields } = presignedResponse.data

				// Convert file to blob
				const fileResponse = await fetch(processedImage.uri)
				const fileBlob = await fileResponse.blob()

				// Upload to direct endpoint
				const baseUrl = process.env.EXPO_PUBLIC_API_URL
				const uploadUrl = `${baseUrl}/upload/direct?key=${encodeURIComponent(fields.key)}&contentType=${encodeURIComponent(fields.contentType)}`

				// Get auth token
				const authStore = getAuthStore()
				if (!authStore) throw new Error("Auth store not available")
				const { accessToken } = authStore.getState()

				const uploadResponse = await fetch(uploadUrl, {
					method: "POST",
					body: fileBlob,
					headers: {
						"Content-Type": "application/octet-stream",
						Authorization: `Bearer ${accessToken || ""}`,
					},
				})

				if (!uploadResponse.ok) {
					throw new Error(`Upload failed: ${uploadResponse.status}`)
				}

				// Return the base image ID (all sizes use the same base ID)
				return baseImageId
			} catch (error) {
				console.error(`Upload failed for ${processedImage.size}:`, error)
				throw error
			}
		},
		[api],
	)

	// Upload a single image (all sizes)
	const uploadImage = useCallback(
		async (imageUrl: string) => {
			if (!isPreviewImage(imageUrl)) {
				// Already uploaded
				return imageUrl
			}

			logger.debug(`Starting upload for: ${imageUrl}`)

			// Mark as uploading
			setUploadingImages((prev) => new Set(prev).add(imageUrl))

			try {
				// Generate a single base image ID for all sizes (CUID format)
				const baseImageId = Math.random().toString(36).substr(2, 9)
				logger.debug(`Generated base imageId: ${baseImageId}`)

				// Process image into multiple sizes
				const processedImages = await processImage(imageUrl)
				logger.debug(`Processed images: ${processedImages.length}`)

				// Upload each size using the same base image ID
				const uploadPromises = processedImages.map((processedImage) =>
					uploadProcessedImage(processedImage, baseImageId),
				)

				await Promise.all(uploadPromises)
				logger.debug(`All uploads completed for base imageId: ${baseImageId}`)

				// Mark as uploaded
				setUploadedImages((prev) => new Set(prev).add(imageUrl))
				setUploadingImages((prev) => {
					const newSet = new Set(prev)
					newSet.delete(imageUrl)
					return newSet
				})

				// Return the base image ID
				return baseImageId
			} catch (error) {
				console.error("Upload failed for:", imageUrl, error)
				// Remove from uploading on error
				setUploadingImages((prev) => {
					const newSet = new Set(prev)
					newSet.delete(imageUrl)
					return newSet
				})
				onError?.("Failed to upload image")
				throw error
			}
		},
		[processImage, uploadProcessedImage, onError],
	)

	// Upload all pending images
	const uploadPending = useCallback(async () => {
		const pendingImages = imageItems.filter((item) => item.status === "preview")
		logger.debug(`Pending images to upload: ${pendingImages.length}`)

		if (pendingImages.length === 0) {
			return []
		}

		setIsUploading(true)

		try {
			// Upload each pending image sequentially
			const uploadResults: Array<{ oldUrl: string; newImageId: string }> = []
			for (const item of pendingImages) {
				logger.debug(`Uploading image: ${item.url}`)
				const uploadedImageId = await uploadImage(item.url)
				logger.debug(`Uploaded imageId: ${uploadedImageId}`)
				uploadResults.push({ oldUrl: item.url, newImageId: uploadedImageId })
			}

			// Update images array with uploaded imageIds
			const newImages = images.map((url) => {
				const result = uploadResults.find((r) => r.oldUrl === url)
				return result ? result.newImageId : url
			})

			logger.debug(`Updated images array: ${newImages}`)
			onImagesChange(newImages)

			// Return the uploaded imageIds directly
			return uploadResults.map((r) => r.newImageId)
		} catch (error) {
			console.error("Upload pending failed:", error)
			onError?.("Failed to upload images")
			throw error
		} finally {
			setIsUploading(false)
		}
	}, [imageItems, images, onImagesChange, uploadImage, onError])

	// Upload pending images and return all imageIds (existing + newly uploaded)
	const uploadAndGetImageIds = useCallback(async () => {
		if (hasPendingImages()) {
			// Upload new images and get their imageIds
			const newUploadedImageIds = await uploadPending()

			// Create a mapping of old URLs to new imageIds
			const urlMapping = new Map<string, string>()
			const pendingImages = imageItems.filter((item) => item.status === "preview")

			// Map each pending image to its uploaded imageId
			pendingImages.forEach((item, index) => {
				urlMapping.set(item.url, newUploadedImageIds[index])
			})

			// Replace file:// URLs with uploaded imageIds while preserving the exact order
			const updatedImages = images.map((url) => {
				if (isPreviewImage(url)) {
					return urlMapping.get(url) || url
				}
				return url
			})

			// Update the form with the new imageIds
			onImagesChange(updatedImages)

			// Return only the uploaded imageIds (no file:// URLs)
			return updatedImages.filter((url) => isUploadedImage(url))
		} else {
			// If no pending uploads, get existing saved imageIds
			return getSavedImageIds()
		}
	}, [uploadPending, images, imageItems, onImagesChange])

	// Track initial images for change detection
	useEffect(() => {
		if (initialImages.length === 0 && images.length > 0) {
			setInitialImages([...images])
		}
	}, [images, initialImages.length])

	// Pre-request permissions on component mount for better UX
	useEffect(() => {
		ImagePicker.requestMediaLibraryPermissionsAsync()
	}, [])

	const pickImage = useCallback(async () => {
		if (isPicking) return

		// Check if we've reached the maximum number of images
		if (images.length >= maxImages) {
			onError?.(`Maximum ${maxImages} images allowed`)
			return
		}

		setIsPicking(true)
		try {
			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
				allowsMultipleSelection: false,
			})

			if (!result.canceled && result.assets[0]) {
				const asset = result.assets[0]
				// Add the image URI as preview (file:// URL)
				onImagesChange([...images, asset.uri])
			}
		} catch {
			onError?.("Failed to pick image")
		} finally {
			setIsPicking(false)
		}
	}, [images, onImagesChange, isPicking, maxImages, onError])

	const removeImage = useCallback(
		(index: number) => {
			const newImages = images.filter((_, i) => i !== index)
			onImagesChange(newImages)
		},
		[images, onImagesChange],
	)

	// Helper functions for UI status indicators
	const isImageUploading = useCallback(
		(imageUrl: string) => {
			return uploadingImages.has(imageUrl)
		},
		[uploadingImages],
	)

	const isImageUploaded = useCallback(
		(imageUrl: string) => {
			return uploadedImages.has(imageUrl)
		},
		[uploadedImages],
	)

	// Get display URLs for images
	const getDisplayUrls = useCallback(() => {
		return images.map((imageId) => getDisplayImageUrl(imageId, displaySize))
	}, [images, displaySize])

	return {
		images, // Array of imageIds or file:// URLs
		displayUrls: getDisplayUrls(), // Array of display URLs
		isPicking,
		isUploading,
		pickImage,
		removeImage,
		maxImages,
		// Upload management helpers
		uploadAndGetImageIds,
		// Change detection
		hasUnsavedChanges,
		// Upload status helpers
		isImageUploading,
		isImageUploaded,
		// New helpers
		IMAGE_SIZES,
		enableResizing,
		// Utility functions
		getDisplayImageUrl,
	}
}
