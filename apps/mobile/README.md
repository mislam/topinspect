# Mobile App

Mobile app built with Expo, React Native, TypeScript, and NativeWind.

> **Part of Monorepo** - This mobile app connects to the [Hono API](../api) for all backend operations.

## Quick Start

### Prerequisites

- **Node.js**: Latest LTS version
- **PNPM**: Workspace package manager
- **React Native Development Tools**: Xcode (iOS), Android Studio (Android)
- **Device/Simulator**: iOS and Android devices and simulators for testing
- **Docker Desktop**: For local API services

### Development

```sh
# Run from monorepo root
pnpm install

# Create .env file in mobile directory
cp .env.example .env

# Start API server (from monorepo root)
pnpm dev:api

# Start Expo dev server (new terminal)
pnpm dev:mobile
```

### Dev Client Setup (One-time)

This project uses a **custom Expo Dev Client** to support secure storage and native modules. Expo Go will **not work**.

```bash
# Build and install Dev Client (development build) on a physical device
pnpm dev:install:ios
pnpm dev:install:android
```

**When to rebuild Dev Client:**

- After installing/removing native packages
- After modifying `app.json` config
- After upgrading Expo SDK

## Application Stack

- **Frontend:** React Native, Expo, TypeScript
- **Styling:** NativeWind v4 (Tailwind for React Native)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand with secure storage persistence
- **Backend:** Connects to [Hono API](../api)
- **Authentication:** SMS-based OTP with access and refresh tokens

## Project Architecture

### File Structure

```
├── src/
│   ├── app/          # Expo Router pages (file-based routing)
│   │   ├── (auth)/   # Authentication routes (login, signup, OTP)
│   │   └── (tabs)/   # Protected app routes
│   │
│   ├── config/       # App configuration
│   │   ├── app.css   # Global styles
│   │   └── svg.ts    # SVG configuration
│   │
│   └── types/        # TypeScript declarations
│       ├── env.d.ts  # Environment types
│       └── svg.d.ts  # SVG types
│
├── assets/
│   ├── expo/         # Expo build assets (icons, splash, etc.)
│   ├── svg/          # Runtime SVG icons and illustrations
│   ├── fonts/        # Custom fonts (if any)
│   └── data/         # JSON files, mock data
│
├── docs/             # Documentation (see below)
├── app.json          # Expo configuration
└── package.json      # Dependencies
```

**Note:** Authentication functionality is provided by the `@prism/auth/expo` package, which includes:

- Auth store and state management
- API client with automatic token handling
- OTP and authentication services
- Device information collection
- Secure storage integration

### Architecture Patterns

**1. Module-Based Organization:**

- Features organized into modules
- Each module contains related functionality
- Clear separation of concerns

**2. State Management:**

- Zustand for global state
- Secure storage for persistence
- React state for component-specific state

**3. API Integration:**

- Centralized API client
- Automatic authentication handling
- Type-safe API calls

**4. Route Protection:**

- File-based routing with Expo Router
- Authentication guards
- Nested layouts

## Development Patterns

### 1. Authentication Patterns

**Store Usage:**

```typescript
import { useAuthStore } from "@prism/auth/expo"

function MyComponent() {
  const { isAuthenticated, isLoading, error } = useAuthStore()

  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <LoginPrompt />

  return <AuthenticatedContent />
}
```

**Service Functions:**

```typescript
import { sendOtp, signInWithPhone } from "@prism/auth/expo"

async function handleLogin() {
	try {
		await sendOtp({ phone: "9876543210", purpose: "login" })
		// Handle success
	} catch (error) {
		// Error handled by store
	}
}
```

### 2. Component Patterns

**Functional Components:**

```typescript
import React from "react"
import { View, Text } from "react-native"

interface Props {
  title: string
  onPress?: () => void
}

export function MyComponent({ title, onPress }: Props) {
  return (
    <View className="p-4 bg-white rounded-lg">
      <Text className="text-lg font-semibold">{title}</Text>
    </View>
  )
}
```

**Custom Hooks:**

```typescript
import { useState, useEffect } from "react"
import { useAuthStore } from "@prism/auth/expo"

export function useAuthStatus() {
	const { isAuthenticated, isAuthLoading } = useAuthStore()

	return {
		isAuthenticated,
		isAuthLoading,
		isReady: !isAuthLoading,
	}
}
```

### 3. Styling Patterns

**NativeWind Usage:**

```typescript
// Use Tailwind classes for styling
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-semibold text-slate-900 mb-2">
    {title}
  </Text>
  <Text className="text-base">
    {description}
  </Text>
</View>
```

**Conditional Styling:**

```typescript
<View className={`p-4 rounded-lg ${isActive ? 'bg-indigo-100 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
  <Text className={isActive ? 'text-indigo-700' : ''}>
    {label}
  </Text>
</View>
```

## Type Safety

### TypeScript Configuration

**Strict Mode:**

```json
{
	"compilerOptions": {
		"strict": true,
		"noImplicitAny": true,
		"noImplicitReturns": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true
	}
}
```

**Path Aliases:**

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"]
		}
	}
}
```

### Type Definitions

**Shared Types:**

```typescript
import { type OtpRequest, type TokenResponse } from "@prism/types"

// Use shared types for API calls
const request: OtpRequest = {
	phone: "9876543210",
	purpose: "login",
}
```

**Component Props:**

```typescript
interface ButtonProps {
	variant?: "default" | "outline" | "danger"
	disabled?: boolean
	children: React.ReactNode
	className?: string
	// ... all TouchableOpacity props (except style)
}
```

## Debugging and Development Tools

### 1. Development Menu

**Built-in Dev Tools:**

```typescript
// Available in development builds
{
  name: "Get Device Info",
  callback: () => {
    const deviceInfo = getDeviceInfo()
    logger.debug("Device Info " + JSON.stringify(deviceInfo, null, 2))
  },
}
```

### 2. Logging

**Structured Logging:**

```typescript
import { logger } from "@/utils/logger"

logger.debug("Component mounted", { props })
logger.warn("Deprecated API usage", { method })
logger.error("API call failed", { error, url })
```

## Code Quality

### 1. ESLint Configuration

**Strict Rules:**

```javascript
module.exports = {
	extends: ["expo", "prettier"],
	rules: {
		"@typescript-eslint/no-unused-vars": "error",
		"@typescript-eslint/explicit-function-return-type": "warn",
		"prefer-const": "error",
	},
}
```

### 2. Prettier Configuration

**Consistent Formatting:**

```json
{
	"semi": true,
	"trailingComma": "es5",
	"singleQuote": false,
	"printWidth": 80,
	"tabWidth": 2
}
```

## Security Best Practices

### 1. Authentication Security

**Token Management:**

- Never store tokens in plain text
- Use secure storage for persistence
- Implement proper token refresh
- Clear tokens on logout

**Input Validation:**

```typescript
// Validate all user inputs
const phoneRegex = /^01[3-9]\d{8}$/
if (!phoneRegex.test(phone)) {
	throw new Error("Invalid phone number")
}
```

### 2. Network Security

**HTTPS Only:**

```typescript
// All API calls use HTTPS
const api = axios.create({
	baseURL: "https://api.topinspect.app",
})
```

## Deployment and Build

### 1. Environment Configuration

**Build-time Environment:**

```typescript
// Environment variables are embedded at build time
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

### 2. Build Process

**Development Build:**

```sh
# Build for development
expo run:ios
expo run:android
```

**Production Build:**

```sh
# Build for production
eas build --platform ios
eas build --platform android
```

## Authentication Configuration

Configure which authentication methods are enabled in your mobile app.

### Quick Start

Edit `apps/mobile/src/config/auth.ts`:

```typescript
export const AUTH_CONFIG: AuthConfig = {
	phone: true, // Phone/OTP authentication
	google: true, // Google Sign-In
	apple: true, // Apple Sign-In
}
```

### OAuth Provider Setup

For detailed OAuth setup instructions (Google/Apple), see the [OAuth Setup Guide](../../packages/auth/expo/docs/oauth.md) in the auth package documentation.

**Quick Reference - Environment Variables:**

- **Google**:
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (Web OAuth client ID for Android)
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (iOS OAuth client ID)
  - `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` (iOS URL scheme for OAuth)
- **Apple**: No additional env vars needed
- **Phone**: No additional env vars needed (uses existing SMS configuration)

## Documentation

- **[TODO](TODO.md)** - Future improvements and features

### Package Documentation

This app uses several packages:

- **[UI Component Library](../../packages/ui/expo/README.md)** - Complete UI component documentation and usage
- **[Auth Package Guide](../../packages/auth/expo/docs/auth.md)** - Complete authentication system documentation
- **[OAuth Setup Guide](../../packages/auth/expo/docs/oauth.md)** - Google and Apple Sign-In setup instructions
- **[API Client Guide](../../packages/auth/expo/docs/api.md)** - API client configuration and usage
- **[Error Handling Guide](../../packages/utils/expo/docs/error.md)** - Error handling patterns and best practices

## Path Aliases

Use `@/*` for `./src/*` imports:

```typescript
import { useAuthStore, api } from "@prism/auth/expo"
```

## Troubleshooting

### Common Issues

**API Connection Issues:**

- Ensure Hono API is running (`pnpm dev:api`)
- Check network connectivity between device and development machine
- Verify `EXPO_PUBLIC_API_URL` environment variable

**Dev Client Issues:**

- Ensure device is on same network as development machine
- Use `pnpm clean` to reset native build cache
- Rebuild Dev Client after native package changes

**Metro Bundler Issues:**

```sh
# Clear cache
npx expo start --clear

# Reset cache
rm -rf node_modules && pnpm install
```

**Native Build Issues:**

```sh
# Clean native build
expo prebuild --clean

# Rebuild native code
expo run:ios --no-build-cache
```

### Debugging Tools

**React Native Debugger:**

- Network inspection
- Component inspection
- Performance profiling

**Flipper:**

- Network inspection
- Database inspection
- Plugin ecosystem

## Best Practices Summary

### 1. Code Organization

- Use module-based architecture
- Keep components small and focused
- Implement proper separation of concerns

### 2. State Management

- Use Zustand for global state
- Implement proper persistence
- Handle loading and error states

### 3. API Integration

- Use centralized API client
- Implement proper error handling
- Follow authentication patterns

### 4. Security

- Validate all inputs
- Use secure storage
- Implement proper authentication

### 5. Code Quality

- Use TypeScript strictly
- Follow ESLint rules
- Maintain consistent formatting

## Related Apps

- **[Hono API](../api)** - Hono-based backend API
