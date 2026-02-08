import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useState } from "react"

import { cn } from "@the/utils/expo"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
	Animated,
	Dimensions,
	Easing,
	FlatList,
	Modal,
	TouchableOpacity,
	type TouchableOpacityProps,
	View,
} from "react-native"

import { colors } from "../colors"
import { pickerBase, pickerModal, type PickerVariant, pickerVariants } from "../theme"

import { Icon } from "./icon"
import { Text } from "./text"

export interface PickerItem {
	label: string
	value: string | number
	disabled?: boolean
}

export interface PickerProps extends Omit<TouchableOpacityProps, "style" | "onPress"> {
	/** Array of items to display in the picker */
	items: PickerItem[]
	/** Currently selected value */
	selectedValue?: string | number
	/** Callback when selection changes */
	onValueChange?: (value: string | number, index: number) => void
	/** Placeholder text when no item is selected */
	placeholder?: string
	/** Visual variant of the picker */
	variant?: PickerVariant
	/** Whether the picker is disabled */
	disabled?: boolean
	/** Custom className for styling */
	className?: string
	/** Title for the modal header */
	modalTitle?: string
	/** Horizontal alignment of list items */
	itemAlignment?: "left" | "center"
}

export interface PickerRef {
	/** Open the picker modal */
	open: () => void
	/** Close the picker modal */
	close: () => void
}

export const Picker = memo(
	forwardRef<PickerRef, PickerProps>(
		(
			{
				items = [],
				selectedValue,
				onValueChange,
				placeholder = "Select an option",
				variant = "default",
				disabled = false,
				className = "",
				modalTitle = "Select Option",
				itemAlignment = "left",
				...props
			},
			ref,
		) => {
			const [isModalOpen, setIsModalOpen] = useState(false)
			const insets = useSafeAreaInsets()

			// Animation values
			const overlayOpacity = useState(() => new Animated.Value(0))[0]
			const modalTranslateY = useState(() => new Animated.Value(300))[0]

			// Find selected item
			const selectedItem = useMemo(() => {
				return items.find((item) => item.value === selectedValue)
			}, [items, selectedValue])

			// Calculate adaptive height based on number of items
			const adaptiveHeight = (() => {
				const screenHeight = Dimensions.get("screen").height
				const itemHeight = 49
				const headerHeight = 61
				const calculatedHeight = headerHeight + items.length * itemHeight + insets.bottom
				return Math.min(screenHeight * 0.5, calculatedHeight)
			})()

			// Simple open animation
			useEffect(() => {
				if (isModalOpen) {
					Animated.parallel([
						Animated.timing(overlayOpacity, {
							toValue: 1,
							duration: 300,
							easing: Easing.out(Easing.cubic),
							useNativeDriver: true,
						}),
						Animated.timing(modalTranslateY, {
							toValue: 0,
							duration: 300,
							easing: Easing.out(Easing.cubic),
							useNativeDriver: true,
						}),
					]).start()
				} else {
					// Reset values when modal closes
					overlayOpacity.setValue(0)
					modalTranslateY.setValue(300)
				}
			}, [isModalOpen, overlayOpacity, modalTranslateY])

			// Imperative handle for ref methods
			useImperativeHandle(ref, () => ({
				open: () => !disabled && setIsModalOpen(true),
				close: () => setIsModalOpen(false),
			}))

			// Handle item selection
			const handleItemSelect = (item: PickerItem, index: number) => {
				if (item.disabled) return
				onValueChange?.(item.value, index)
				setIsModalOpen(false)
			}

			// Close modal handler
			const closeModal = () => setIsModalOpen(false)

			// Render picker
			const containerClasses = useMemo(
				() =>
					cn(pickerBase.container, pickerVariants[variant], disabled && "opacity-50", className),
				[variant, disabled, className],
			)

			const textClasses = useMemo(
				() =>
					cn(pickerBase.text, !selectedItem && pickerBase.placeholder, disabled && "opacity-50"),
				[selectedItem, disabled],
			)

			return (
				<>
					<TouchableOpacity
						className={containerClasses}
						onPress={() => !disabled && setIsModalOpen(true)}
						disabled={disabled}
						activeOpacity={disabled ? 1 : 0.8}
						{...props}
					>
						<Text className={textClasses}>{selectedItem?.label || placeholder}</Text>
						<Icon
							name="chevron-down"
							size={20}
							lightColor={colors.slate[400]}
							darkColor={colors.slate[500]}
						/>
					</TouchableOpacity>

					<Modal
						visible={isModalOpen}
						animationType="none"
						transparent
						statusBarTranslucent
						onRequestClose={closeModal}
					>
						<Animated.View className="flex-1 bg-black/70" style={{ opacity: overlayOpacity }}>
							<TouchableOpacity className="flex-1" activeOpacity={1} onPress={closeModal} />
							<Animated.View
								className={pickerModal.container}
								style={{
									height: adaptiveHeight,
									paddingBottom: insets.bottom,
									transform: [{ translateY: modalTranslateY }],
								}}
							>
								{/* Modal Header */}
								<View className={pickerModal.header}>
									<Text className={pickerModal.title}>{modalTitle}</Text>
									<TouchableOpacity className="-m-3 p-3" onPress={closeModal} activeOpacity={0.8}>
										<Icon
											name="close"
											size={24}
											lightColor={colors.slate[600]}
											darkColor={colors.slate[400]}
										/>
									</TouchableOpacity>
								</View>

								{/* Options List */}
								<FlatList
									className="flex-1"
									data={items}
									keyExtractor={(item) => String(item.value)}
									showsVerticalScrollIndicator={false}
									renderItem={({ item, index }) => {
										const isSelected = item.value === selectedValue
										const itemClasses = cn(
											pickerModal.item,
											isSelected && pickerModal.itemSelected,
											itemAlignment === "center" && "justify-center",
										)
										const textClasses = cn(
											pickerModal.itemText,
											isSelected && "font-medium",
											item.disabled && "opacity-50",
											itemAlignment === "center" && "text-center",
										)

										return (
											<TouchableOpacity
												className={itemClasses}
												onPress={() => handleItemSelect(item, index)}
												disabled={item.disabled}
												activeOpacity={item.disabled ? 1 : 0.8}
											>
												<View className="flex-1">
													<Text className={textClasses}>{item.label}</Text>
												</View>
												{isSelected && (
													<View
														className={`items-center justify-center ${
															itemAlignment === "center" ? "absolute right-4" : ""
														}`}
													>
														<Icon
															name="checkmark"
															size={20}
															lightColor={colors.indigo[800]}
															darkColor={colors.indigo[200]}
														/>
													</View>
												)}
											</TouchableOpacity>
										)
									}}
								/>
							</Animated.View>
						</Animated.View>
					</Modal>
				</>
			)
		},
	),
)

Picker.displayName = "Picker"
