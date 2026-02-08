/**
 * Image URL utilities for ID-based image system
 * Handles construction of URLs for different image sizes
 */

export type ImageSize = "thumbnail" | "medium" | "large" | "original"

export interface ImageUrlOptions {
	size?: ImageSize
	baseUrl?: string
}

/**
 * Constructs image URL from ID and size
 * @param imageId - The unique image ID (e.g., "eorqmprrw8f4wy347splaw74")
 * @param options - Configuration options
 * @returns Complete image URL
 */
export const getImageUrl = (imageId: string, options: ImageUrlOptions = {}): string => {
	const { size = "large", baseUrl } = options

	// Use environment variable or provided base URL
	const mediaBaseUrl = baseUrl || process.env.EXPO_PUBLIC_MEDIA_URL

	if (!mediaBaseUrl) {
		throw new Error("EXPO_PUBLIC_MEDIA_URL is not configured")
	}

	// Map size to suffix
	const sizeSuffix = {
		thumbnail: "_t",
		medium: "_m",
		large: "_l",
		original: "",
	}[size]

	return `${mediaBaseUrl}/${imageId}${sizeSuffix}.jpg`
}

/**
 * Gets multiple image URLs for different sizes
 * @param imageId - The unique image ID
 * @param sizes - Array of sizes to generate
 * @param baseUrl - Optional base URL override
 * @returns Object with size as key and URL as value
 */
export const getImageUrls = (
	imageId: string,
	sizes: ImageSize[] = ["thumbnail", "medium", "large", "original"],
	baseUrl?: string,
): Record<ImageSize, string> => {
	const urls: Record<ImageSize, string> = {} as Record<ImageSize, string>

	sizes.forEach((size) => {
		urls[size] = getImageUrl(imageId, { size, baseUrl })
	})

	return urls
}

/**
 * Extracts image ID from a full URL
 * @param url - Full image URL
 * @returns Image ID or null if not a valid image URL
 */
export const extractImageId = (url: string): string | null => {
	try {
		const urlObj = new URL(url)
		const pathname = urlObj.pathname

		// Extract ID from path like "/eorqmprrw8f4wy347splaw74_l.jpg"
		const match = pathname.match(/\/([^_]+)(?:_[tml])?\.jpg$/)
		return match ? match[1] : null
	} catch {
		return null
	}
}

/**
 * Checks if a string is a file:// URL (preview image)
 * @param url - URL to check
 * @returns True if it's a file:// URL
 */
export const isPreviewImage = (url: string): boolean => {
	return url.startsWith("file://")
}

/**
 * Checks if a string is an uploaded image ID
 * @param url - String to check
 * @returns True if it's an image ID (not a file:// URL)
 */
export const isUploadedImage = (url: string): boolean => {
	return !isPreviewImage(url)
}

/**
 * Gets the appropriate image URL for display
 * @param imageId - Image ID or file:// URL
 * @param size - Desired size
 * @returns URL for display
 */
export const getDisplayImageUrl = (imageId: string, size: ImageSize = "large"): string => {
	// If it's a file:// URL, return as-is (preview)
	if (isPreviewImage(imageId)) {
		return imageId
	}

	// Otherwise, construct URL from ID
	return getImageUrl(imageId, { size })
}
