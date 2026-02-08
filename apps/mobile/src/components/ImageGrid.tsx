/**
 * ImageGrid component for displaying and managing images in a grid
 * Simple reorder using tap to select and tap to place
 */

import { useState } from "react"

import { colors, Icon, Text } from "@the/ui/expo"
import { getDisplayImageUrl } from "@the/utils/expo"

import { ActivityIndicator, Image, LayoutAnimation, TouchableOpacity, View } from "react-native"

interface ImageGridProps {
	images: string[] // Array of imageIds or file:// URLs
	onImagesChange: (images: string[]) => void
	maxImages: number
	onPickImage: () => void
	onRemoveImage: (index: number) => void
	isPicking: boolean
	isSaving?: boolean
	isImageUploading?: (imageUrl: string) => boolean
	isImageUploaded?: (imageUrl: string) => boolean
	displaySize?: "thumbnail" | "medium" | "large" | "original"
}

export const ImageGrid = ({
	images,
	onImagesChange,
	maxImages,
	onPickImage,
	onRemoveImage,
	isPicking,
	isSaving,
	isImageUploading,
	isImageUploaded,
	displaySize = "large",
}: ImageGridProps) => {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

	const handleSelectImage = (index: number) => {
		setSelectedIndex(index)
	}

	const handlePlaceImage = (fromIndex: number, toIndex: number) => {
		if (fromIndex !== toIndex && toIndex >= 0 && toIndex < images.length) {
			// Animate the layout change
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

			// Reorder the images
			const newImages = [...images]
			const selectedItem = newImages.splice(fromIndex, 1)[0]
			newImages.splice(toIndex, 0, selectedItem)
			onImagesChange(newImages)
		}
		setSelectedIndex(null)
	}

	return (
		<View className="flex-row flex-wrap gap-4">
			{images.map((imageId, index) => {
				// Get display URL for this image
				const displayUrl = getDisplayImageUrl(imageId, displaySize)

				return (
					<View key={imageId} className="relative">
						<TouchableOpacity
							activeOpacity={selectedIndex === index ? 1 : 0.5}
							onPress={() => {
								// If we're in select mode, handle the placement
								if (selectedIndex !== null && selectedIndex !== index) {
									handlePlaceImage(selectedIndex, index)
								} else if (selectedIndex === index) {
									// If tapping the same selected image, deselect it
									setSelectedIndex(null)
								} else {
									// If not in select mode, start select mode
									handleSelectImage(index)
								}
							}}
						>
							<Image
								source={{ uri: displayUrl }}
								className="h-20 w-20 rounded-lg"
								resizeMode="cover"
							/>

							{/* Upload status overlays */}
							{isImageUploading?.(imageId) && (
								<View className="absolute inset-0 items-center justify-center rounded-lg bg-black/50">
									<ActivityIndicator size="large" color="white" />
								</View>
							)}

							{isImageUploaded?.(imageId) && (
								<View className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
									<Icon name="checkmark" size={16} color="white" />
								</View>
							)}

							{selectedIndex === index && (
								<View className="absolute inset-0 items-center justify-center rounded-lg bg-black/50 p-1">
									<Text className="text-center text-xs font-semibold text-white">
										Tap on an image
									</Text>
								</View>
							)}
						</TouchableOpacity>
						{selectedIndex === index &&
							!isSaving &&
							!isImageUploading?.(imageId) &&
							!isImageUploaded?.(imageId) && (
								<TouchableOpacity
									onPress={() => {
										onRemoveImage(index)
										setSelectedIndex(null)
									}}
									className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-600 dark:bg-red-500"
								>
									<Icon name="close" size={16} color="white" />
								</TouchableOpacity>
							)}
					</View>
				)
			})}

			{/* Add Image Button */}
			{images.length < maxImages && (
				<TouchableOpacity
					onPress={onPickImage}
					disabled={isPicking}
					className="h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-400 dark:border-gray-500"
					style={{ opacity: isPicking ? 0.5 : 1 }}
				>
					{isPicking ? (
						<ActivityIndicator size="large" />
					) : (
						<>
							<Icon
								name="add"
								size={24}
								lightColor={colors.slate[600]}
								darkColor={colors.slate[400]}
							/>
							<Text variant="secondary" className="text-sm font-medium">
								Add
							</Text>
						</>
					)}
				</TouchableOpacity>
			)}
		</View>
	)
}
