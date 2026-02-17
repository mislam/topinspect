# @prism/ui/expo

A reusable UI component library for React Native Expo apps, featuring theme-aware components with advanced memoization and optimization strategies.

## Features

- **🎨 Theme System**: Centralized theme configuration with light/dark mode support
- **🎯 Performance Optimized**: Memoized components with optimized re-rendering
- **📱 Expo Ready**: Built specifically for React Native Expo applications
- **🔧 TypeScript**: Full TypeScript support with comprehensive type definitions
- **🎨 SVG Support**: Flexible SVG component with app-specific asset registration

## Installation

```bash
pnpm add @prism/ui/expo
```

## Quick Start

### 1. Register SVG Assets (App-Specific)

Each app needs to register its own SVG assets:

```tsx
// src/config/svg.ts
import { registerSvgAssets } from "@prism/ui/expo"

// Import SVG assets
import female from "../../assets/icons/female.svg"
import male from "../../assets/icons/male.svg"
import logo from "../../assets/images/logo.svg"

// Register SVG assets with the UI library
registerSvgAssets({
	logo,
	male,
	female,
})
```

### 2. Import in App Entry Point

```tsx
// src/app/_layout.tsx
import "@/config/app.css"
import "@/config/svg" // Register SVG assets
import { Alert, Toast } from "@prism/ui/expo"

export default function RootLayout() {
	return <Stack>{/* Your app screens */}</Stack>
}
```

### 3. Use SVG asset in the app

```tsx
// src/app/(auth)/login.tsx
import { Alert, Button, Svg, Text, TextInput } from "@prism/ui/expo"
import { View } from "react-native"

export default function LoginScreen() {
	return (
		<View>
			<Svg name="logo" width={64} height={64} />
			<Text>Welcome Back</Text>
		</View>
	)
}
```

## Components

### Svg

A flexible SVG component that works with app-specific assets.

```tsx
import { Svg } from "@prism/ui/expo"

// Basic usage
<Svg name="logo" width={64} height={64} />

// With custom colors
<Svg
  name="icon"
  width={24}
  height={24}
  lightColor="#000000"
  darkColor="#ffffff"
/>

// With theme variant
<Svg
  name="icon"
  width={24}
  height={24}
  variant="default"
/>
```

### Other Components

```tsx
import {
  Button,
  Text,
  TextInput,
  Alert,
  Icon,
  Picker,
  OtpInput,
  colors
} from "@prism/ui/expo"

// Use components with theme support
// Button automatically wraps string children in Text
<Button variant="default" onPress={() => {}}>
  Click me
</Button>

// Or use custom Text for advanced styling
<Button variant="default" onPress={() => {}}>
  <Text variant="secondary">Custom styled</Text>
</Button>

<TextInput
  placeholder="Enter text"
  variant="default"
/>

<Alert
  variant="success"
  message="Operation completed successfully"
/>
```

## Multi-App Architecture

This library is designed to work across multiple Expo apps in a monorepo:

### App 1

```tsx
// apps/mobile-app1/src/config/svg.ts
import { registerSvgAssets } from "@prism/ui/expo"

// Import SVG assets
import female from "../../assets/icons/female.svg"
import male from "../../assets/icons/male.svg"
import logo from "../../assets/images/logo.svg"

// Register SVG assets with the UI library
registerSvgAssets({
	logo,
	male,
	female,
})
```

### App 2

```tsx
// apps/mobile-app2/src/config/svg.ts
import { registerSvgAssets } from "@prism/ui/expo"

// Import SVG assets
import cart from "../../assets/icons/cart.svg"
import heart from "../../assets/icons/heart.svg"
import logo from "../../assets/images/logo.svg"

// Register SVG assets with the UI library
registerSvgAssets({
	logo,
	cart,
	heart,
})
```

Both apps can use the same `<Svg>` component but with their own assets!

## API Reference

### `registerSvgAssets(assets)`

Register SVG assets for the current app.

**Parameters:**

- `assets`: Object mapping SVG names to their React components

**Example:**

```tsx
registerSvgAssets({
	logo: LogoComponent,
	icon: IconComponent,
})
```

### `getRegisteredSvgNames()`

Get all registered SVG names (useful for debugging).

**Returns:** Array of registered SVG names

**Example:**

```tsx
import { getRegisteredSvgNames } from "@prism/ui/expo"

// Get all registered SVG names
const registeredSvgs = getRegisteredSvgNames()
console.log("Available SVGs:", registeredSvgs) // ["logo", "male", "female"]
```

### `Svg` Component Props

| Prop         | Type         | Default     | Description                          |
| ------------ | ------------ | ----------- | ------------------------------------ |
| `name`       | `string`     | -           | Name of the SVG (must be registered) |
| `width`      | `number`     | `24`        | Width of the SVG                     |
| `height`     | `number`     | `24`        | Height of the SVG                    |
| `variant`    | `SvgVariant` | `"default"` | Theme variant for colors             |
| `color`      | `string`     | -           | Override color for all modes         |
| `lightColor` | `string`     | -           | Light mode color                     |
| `darkColor`  | `string`     | -           | Dark mode color                      |

## Performance Architecture

### **memo + Named Imports Strategy**

All components use optimized imports and memoization:

- **memo**: Prevents unnecessary re-renders when props haven't changed
- **Named imports**: Only import what's needed for optimal bundle size
- **Tree shaking**: Unused code is eliminated from production builds

### **Dependency Array Optimization**

Components use stable primitive values in dependency arrays:

```tsx
// ✅ Optimal - stable dependencies
const allClasses = useMemo(
	() => cn(buttonBase.container, buttonVariants[variant].container, className),
	[variant, className], // Primitive values, stable references
)
```

### **Performance Characteristics**

- **Static components**: Render only once, never re-render unnecessarily
- **Dynamic components**: Re-render only when relevant props change
- **Class computation**: Memoized for optimal string processing
- **Theme switching**: Efficient color resolution without re-renders

## Theme System

### **Base + Variants Pattern**

Each component follows a consistent theme structure:

```tsx
// packages/ui/expo/src/theme.ts

export const button = {
	base: {
		container: "flex-row items-center justify-center px-4 py-3.5 rounded-lg border",
		text: "text-center text-lg font-semibold",
	},
	variants: {
		default: { container: "bg-indigo-600...", text: "text-white..." },
		outline: { container: "bg-transparent...", text: "text-slate-800..." },
		danger: { container: "bg-red-600...", text: "text-white..." },
	},
}
```

### **3-Layer Theming Architecture**

Each component is composed of three layers: Base + Variant + Custom

```
┌─────────────────────────────────────────────────────────┐
│                  LAYER 1: BASE STYLES                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ button.base.container: "flex-row items-center..." │  │
│  │ button.base.text:      "text-center text-lg..."   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 LAYER 2: VARIANT STYLES                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ button.variants[variant].container                │  │
│  │ ├─ default: "bg-indigo-600 dark:bg-indigo-500..." │  │
│  │ ├─ outline: "bg-transparent border-slate-400..."  │  │
│  │ └─ danger:  "bg-red-600 dark:bg-red-500..."       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 LAYER 3: CUSTOM STYLES                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ className: "w-full mb-4" (developer override)     │  │
│  │                                                   │  │
│  │ Final Result: Base + Variant + Custom             │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **Dark Mode Support**

- **Automatic adaptation**: Uses React Native's `useColorScheme`
- **Consistent theming**: All components support light/dark variants
- **No manual switching**: Components automatically adapt to system theme

## Detailed Component Documentation

### **Button**

A high-performance button component with multiple variants and optimal memoization.

#### **Props**

```tsx
interface ButtonProps {
	variant?: "default" | "outline" | "danger"
	disabled?: boolean
	children: React.ReactNode
	className?: string
	// ... all TouchableOpacity props (except style)
}
```

#### **Variants**

- **default**: Primary action button with indigo background
- **outline**: Secondary action with transparent background and border
- **danger**: Destructive action with red background

#### **Performance Features**

- **React.memo**: Prevents re-renders when props are stable
- **useMemo**: Optimizes class string computation
- **Stable dependencies**: Uses primitive values for optimal memoization

#### **Children Handling**

The Button component automatically wraps string and number children in a `<Text>` component with appropriate button styling. This provides a simple API for most use cases:

- **String/number children**: Automatically wrapped in Text with button text styles
- **Custom children**: Pass through as-is, allowing for icons, custom Text components, or complex layouts

#### **Usage**

```tsx
import { Button, Text } from "@prism/ui/expo"

// Basic usage - strings are automatically wrapped in Text
<Button onPress={handlePress}>Click me</Button>

// With variants
<Button variant="outline" onPress={handleCancel}>
  Cancel
</Button>

// With custom styling
<Button variant="danger" className="w-full" onPress={handleDelete}>
  Delete Account
</Button>

// With custom Text component (for custom styling or variants)
<Button variant="default" onPress={handlePress}>
  <Text variant="secondary">Custom styled text</Text>
</Button>

// With icons and text (flexible composition)
<Button variant="outline" onPress={handlePress}>
  <Icon name="add" size={20} />
  <Text className="ml-2">Add Item</Text>
</Button>
```

### **Text**

A lightweight text component with theme support and optimal performance.

#### **Props**

```tsx
interface TextProps {
	variant?: "default" | "secondary" | "link" | "error"
	className?: string
	children: React.ReactNode
	// ... all Text props (except style)
}
```

#### **Variants**

- **default**: Primary text color (slate-800/200)
- **secondary**: Secondary text color (slate-600/400)
- **link**: Link text color (indigo-600/500) - use with onPress for clickable links
- **error**: Error text color (red-600/500) - for validation messages and error states

#### **Performance Features**

- **React.memo**: Prevents unnecessary re-renders
- **useMemo**: Optimizes class string computation
- **Minimal overhead**: Lightweight for text-heavy applications

#### **Usage**

```tsx
import { Text } from "@prism/ui/expo"

// Basic usage
<Text>Enter your phone number</Text>

// With variants
<Text variant="secondary">Helper text</Text>
<Text variant="primary" onPress={() => openURL('https://example.com')}>
  Clickable link
</Text>
<Text variant="error">Validation error message</Text>

// With custom styling
<Text className="text-2xl font-bold mb-4">Page Title</Text>
```

### **TextInput**

A flexible text input component with multiple variants and theme support.

#### **Props**

```tsx
interface TextInputProps {
	variant?: "default" | "error" | "success" | "warning"
	className?: string
	// ... all TextInput props (except style)
}
```

#### **Variants**

- **default**: Standard input with neutral styling
- **error**: Red border for error states
- **success**: Green border for success states
- **warning**: Yellow border for warning states

#### **Usage**

```tsx
import { TextInput } from "@prism/ui/expo"

// Basic usage
<TextInput placeholder="Enter your email" className="mb-4" />

// With variants
<TextInput
  placeholder="Invalid input"
  variant="error"
  className="mb-4"
/>

// With custom styling
<TextInput
  placeholder="Success state"
  variant="success"
  className="w-full p-3"
/>
```

### **OtpInput**

A high-performance, self-contained OTP input component with automatic focus management, theme support, and internal state management.

#### **Props**

```tsx
interface OtpInputProps {
	length?: number // Number of OTP digits (default: 6)
	className?: string // Custom container classes
	disabled?: boolean // Whether input is disabled
	autoFocus?: boolean // Auto-focus first input on mount
	onComplete?: (otp: string) => Promise<boolean> | boolean // Callback when OTP is complete
}
```

#### **Ref Interface**

```tsx
interface OtpInputRef {
	reset: () => void // Reset OTP input and clear state
}
```

#### **Key Features**

- **Self-contained**: Manages its own OTP value and variant state
- **Automatic error handling**: Clears input and refocuses on error
- **Smart completion callback**: Returns boolean for success/error styling
- **Programmatic reset**: Reset function exposed via ref
- **Theme integration**: Automatic light/dark mode support
- **Accessibility**: Proper keyboard navigation and focus management

#### **Usage**

```tsx
import { OtpInput, type OtpInputRef, Text, Button } from "@prism/ui/expo"
import { useRef, useState } from "react"
import { View } from "react-native"

function OtpScreen() {
	const [isLoading, setIsLoading] = useState(false)
	const otpInputRef = useRef<OtpInputRef>(null)

	const handleOtpComplete = async (otp: string) => {
		setIsLoading(true)
		try {
			// Verify OTP with your API
			const result = await verifyOtp(otp)
			return result // Return true for success, false for error
		} catch (error) {
			return false // Return false for error
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<View className="p-6">
			<Text className="mb-4 text-2xl font-bold">Enter OTP</Text>
			<Text className="mb-6 text-slate-600">We've sent a 6-digit code to your phone</Text>

			<OtpInput
				ref={otpInputRef}
				onComplete={handleOtpComplete}
				disabled={isLoading}
				autoFocus
				className="mb-6"
			/>

			<Button onPress={() => otpInputRef.current?.reset()} variant="outline" disabled={isLoading}>
				Clear OTP
			</Button>
		</View>
	)
}
```

### **Icon**

A high-performance Ionicons component with advanced color resolution and theme integration.

#### **Props**

```tsx
interface IconProps {
	name: IconName
	size?: number
	variant?: "default"
	color?: string
	lightColor?: string
	darkColor?: string
}
```

#### **Color Resolution Priority**

1. **Explicit color**: Highest priority, overrides all others
2. **Custom light/dark**: Automatic theme switching
3. **Theme variant**: Fallback to design system colors

#### **Usage**

```tsx
import { Icon } from "@prism/ui/expo"

// Basic usage (automatic theming)
<Icon name="person" />

// With custom size
<Icon name="checkmark" size={32} />

// With explicit color
<Icon name="home" color="#10b981" />

// With custom light/dark colors
<Icon
  name="settings"
  lightColor="#1e293b"
  darkColor="#e2e8f0"
/>
```

### **Alert**

A flexible alert component with both inline and toast modes, featuring smooth animations and theme support.

#### **Props**

```tsx
interface AlertProps {
	variant?: "success" | "error" | "warning" | "info"
	mode?: "inline" | "toast"
	title?: string
	message: string
	showIcon?: boolean
	dismiss?: "manual" | "auto" | string | number
	className?: string
	// ... all View props (except style)
}
```

#### **Variants**

- **success**: Green styling for success messages
- **error**: Red styling for error messages
- **warning**: Yellow styling for warning messages
- **info**: Blue styling for informational messages

#### **Modes**

- **inline**: Static alerts that remain visible (not closable)
- **toast**: Animated alerts with close button and optional auto-dismiss

#### **Usage**

```tsx
import { Alert, Toast } from "@prism/ui/expo"

// Inline Alert (static, persistent)
<Alert
	variant="success"
	mode="inline"
	title="Success!"
	message="Your data has been saved successfully."
	showIcon={true}
	className="mb-4"
/>

// Toast Alert (animated, closable) - Recommended API
Alert.toast({
	variant: "error",
	title: "Connection Failed",
	message: "Unable to connect to the server. Please check your internet connection.",
	showIcon: true,
	dismiss: "5s", // Auto-dismiss after 5 seconds
})

// Hide current toast
Alert.hide()

// Toast Container (add to root layout)
<Toast />
```

### **Picker**

A high-performance, cross-platform picker component with custom animations, adaptive height, and theme support.

#### **Props**

```tsx
interface PickerProps extends Omit<TouchableOpacityProps, "style" | "onPress"> {
	items: PickerItem[]
	selectedValue?: string | number
	onValueChange?: (value: string | number, index: number) => void
	placeholder?: string
	variant?: PickerVariant
	disabled?: boolean
	className?: string
	modalTitle?: string
	itemAlignment?: "left" | "center"
}

interface PickerItem {
	label: string
	value: string | number
	disabled?: boolean
}
```

#### **Ref Interface**

```tsx
interface PickerRef {
	open: () => void
	close: () => void
}
```

#### **Key Features**

- **Cross-platform consistency**: Identical appearance on iOS and Android
- **Custom animations**: Smooth slide-up with natural easing
- **Adaptive sizing**: Modal height adjusts to content (max 50% screen height)
- **Safe area support**: Proper handling of device notches and home indicators
- **Accessibility**: Proper touch targets and disabled state handling
- **Theme integration**: Automatic light/dark mode support

#### **Usage**

```tsx
import { Picker, type PickerRef, type PickerItem, Button } from "@prism/ui/expo"
import { useRef, useState } from "react"
import { View } from "react-native"

function PickerExample() {
	const [selectedValue, setSelectedValue] = useState<string | number>()
	const pickerRef = useRef<PickerRef>(null)

	const items: PickerItem[] = [
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Cherry", value: "cherry" },
	]

	const handleValueChange = (value: string | number, index: number) => {
		setSelectedValue(value)
	}

	return (
		<View className="p-4">
			<Picker
				ref={pickerRef}
				items={items}
				selectedValue={selectedValue}
				onValueChange={handleValueChange}
				placeholder="Choose a fruit"
				modalTitle="Select Your Fruit"
				itemAlignment="left"
				className="mb-4"
			/>

			<Button onPress={() => pickerRef.current?.open()} variant="outline">
				Open Picker Programmatically
			</Button>
		</View>
	)
}
```

## Performance Best Practices

### **Stable Props**

Use stable references to prevent unnecessary re-renders:

```tsx
import { useCallback } from "react"

// ✅ Good - stable function reference
const handlePress = useCallback(() => {
  // handle press logic
}, [])

<Button onPress={handlePress}>Click me</Button>

// ❌ Avoid - inline function creates new reference each render
<Button onPress={() => handlePress()}>Click me</Button>
```

### **Stable Children**

Use stable text references for optimal performance:

```tsx
// ✅ Good - stable text reference
const buttonTexts = {
  submit: "Submit",
  cancel: "Cancel",
}

<Button>{buttonTexts.submit}</Button>

// ❌ Avoid - string literal recreated each render
<Button>Submit</Button>
```

### **Efficient Styling**

Leverage the theme system for consistent styling:

```tsx
// ✅ Good - use theme variants
<Button variant="outline">Secondary Action</Button>

// ✅ Good - extend with custom classes
<Button variant="default" className="w-full mb-4">
  Full Width Button
</Button>
```
