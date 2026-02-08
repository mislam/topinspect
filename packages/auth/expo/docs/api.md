# API Client Guide

## Overview

The `@the/auth/expo` package includes a sophisticated API client built on Axios that provides automatic authentication, token management, error handling, and device information injection. The client fully integrates with the [Hono API](../../../apps/api) and implements all the security and error handling patterns.

## API Client Configuration

### Base Configuration

The API client is configured with environment-based URLs and mobile-optimized settings:

```typescript
const api = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL,
	headers: { "Content-Type": "application/json" },
	timeout: 5000, // 5 seconds for mobile networks and serverless cold starts
})
```

**Key Features:**

- **Environment-based URL**: Uses `EXPO_PUBLIC_API_URL` environment variable
- **JSON Content Type**: All requests use JSON format
- **Timeout Handling**: 5-second timeout for mobile network and serverless cold starts
- **Type Safety**: Full TypeScript integration with shared types

### Environment Configuration

**Type Declaration:**

```typescript
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			EXPO_PUBLIC_API_URL: string
		}
	}
}
```

**Usage:**

```typescript
const baseURL = process.env.EXPO_PUBLIC_API_URL
```

## Request Interceptors

### Authentication Interceptor

The request interceptor automatically handles authentication for protected endpoints:

```typescript
api.interceptors.request.use(async (config) => {
	const { accessToken } = useAuthStore.getState()

	// If the requested endpoint is private (starts with ~)
	if (config.url?.startsWith("~")) {
		config.url = config.url.slice(1) // Remove the leading ~

		if (accessToken) {
			if (needsTokenRefresh(accessToken)) {
				// Proactive token refresh
				await refreshTokens()
				config.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`
			} else {
				// Token is valid, attach to request
				config.headers.Authorization = `Bearer ${accessToken}`
			}
		} else {
			// Force logout if not authenticated
			setTimeout(logOut, 1)
		}
	}

	return config
})
```

**Key Features:**

- **Route Protection**: Uses `~` prefix to mark private endpoints
- **Proactive Refresh**: Refreshes tokens before they expire
- **Automatic Logout**: Logs out users without valid tokens
- **Request Logging**: Logs all API requests for debugging

### Token Refresh Strategy

The API client implements a **dual-layer token refresh strategy** to ensure robust authentication:

**Layer 1: Proactive Refresh (Request Interceptor)**

- **Pre-emptive Check**: Before each request, the client checks if the access token needs refresh
- **10% Lifespan Threshold**: Tokens are refreshed when they're within 10% of their total lifespan
- **Expired Token Handling**: If a token is already expired, it's immediately refreshed
- **Singleton Pattern**: Prevents multiple concurrent refresh attempts using a promise-based lock

**Layer 2: Reactive Refresh (Response Interceptor)**

- **401 Safety Net**: If a request fails with a 401 EXPIRED_TOKEN error, the client automatically attempts token refresh
- **Retry Mechanism**: After successful refresh, the original request is retried with the new token
- **Single Retry**: Each request is retried only once to prevent infinite loops
- **Graceful Degradation**: If refresh fails, the user is automatically logged out

This dual-layer approach ensures that:

- **User Experience**: Most token refreshes happen proactively, preventing user-facing authentication failures
- **Robustness**: The reactive layer catches edge cases where proactive refresh might fail
- **Security**: Invalid or expired refresh tokens result in immediate logout
- **Performance**: Concurrent refresh attempts are prevented, reducing unnecessary API calls

## Response Interceptors

### Error Handling Interceptor

The response interceptor provides comprehensive error handling:

```typescript
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const response = await handleError(error)
		if (response.code) return Promise.reject(response) // failed
		return response // success
	},
)
```

**Error Handling Logic:**

- **Network Errors**: Handles connectivity and timeout issues
- **401 Errors**: Automatic token refresh and retry
- **Invalid Tokens**: Automatic logout on security issues
- **Structured Errors**: Consistent error response format

## Authentication API Integration

### OTP Request

**Service Function:**

```typescript
export const sendOtp = async (req: OtpRequest) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		const { data } = await api.post<OtpResponse>("/auth/phone/otp", req)
		useAuthStore.setState({ isLoading: false })
		return { userExists: data.userExists }
	} catch (error) {
		throw setErrorState(error)
	}
}
```

**Usage:**

```typescript
const { userExists } = await sendOtp({
	phone: "9876543210",
	purpose: "login",
})
```

### Login/Signup

**Service Functions:**

```typescript
export const signUpWithPhone = async (req: PhoneSignupRequest) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		injectDeviceInfo(req)
		const { data } = await api.post<TokenResponse>("/auth/phone/signup", req)
		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			isAuthenticated: true,
		})
		useAuthStore.getState().clearUI()
	} catch (error) {
		throw setErrorState(error)
	}
}
```

### Device Information Injection

**Automatic Device Info Collection:**

```typescript
export function getDeviceInfo() {
	return {
		os: Platform.OS,
		osVersion: Platform.Version.toString(),
		model: Device.modelName || Device.modelId || "unknown",
		brand: Device.brand || "unknown",
		deviceYearClass: Device.deviceYearClass || null,
		appVersion: Constants.expoConfig?.version || "unknown",
		buildNumber:
			Platform.OS === "ios"
				? Constants.expoConfig?.ios?.buildNumber || "unknown"
				: Constants.expoConfig?.android?.versionCode?.toString() || "unknown",
	}
}
```

**Automatic Injection:**

```typescript
const injectDeviceInfo = (req: PhoneSignupRequest | PhoneSignInRequest) => {
	req.deviceInfo = getDeviceInfo()
}
```

## Token Management

### Token Refresh

**Refresh Function:**

```typescript
export const refreshTokens = async () => {
	const refreshToken = useAuthStore.getState().refreshToken
	try {
		if (!refreshToken) {
			setTimeout(logOut, 1)
			throw new Error("No refresh token found, logging out")
		}
		useAuthStore.setState({ isLoading: true, error: null })
		const { data } = await api.post<TokenResponse>("/auth/token/refresh", {
			refreshToken,
		} as RefreshTokensRequest)
		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
		})
	} catch (error) {
		throw setErrorState(error)
	}
}
```

### Logout

**Logout Function:**

```typescript
export const logOut = async () => {
	const refreshToken = useAuthStore.getState().refreshToken
	try {
		if (!refreshToken) throw new Error("No refresh token found")
		useAuthStore.setState({ isLoading: true, error: null })
		await api.post("/auth/logout", { refreshToken } as LogoutRequest)
	} catch {
		// Do nothing (intentional for logout)
	} finally {
		useAuthStore.getState().clearAll()
	}
}
```

## API Usage Patterns

### 1. Public Endpoints

**Direct API Calls:**

```typescript
// No authentication required
const response = await api.get("/health")
```

### 2. Protected Endpoints

**Using ~ Prefix:**

```typescript
// Automatically handles authentication
const profile = await api.get("~/user/profile")
const updatedProfile = await api.put("~/user/profile", { name: "John Doe" })
```

### 3. Error Handling

**Try-Catch Pattern:**

```typescript
try {
	const response = await api.get("~/user/profile")
	// Handle success
} catch (error) {
	// Error is already handled by interceptors
	// UI will display error message automatically
}
```

### 4. Loading States

**Store Integration:**

```typescript
const { isLoading, error } = useAuthStore()

// Loading state is automatically managed
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
```

## Type Safety

### Shared Types Integration

**Import from Shared Package:**

```typescript
import {
	type OtpRequest,
	type OtpResponse,
	type PhoneSignupRequest,
	type PhoneSignInRequest,
	type TokenResponse,
	type ErrorResponse,
} from "@the/types"
```

**Type-Safe API Calls:**

```typescript
// Full type safety with shared types
const { data } = await api.post<TokenResponse>("/auth/phone/login", loginData)
const { data } = await api.get<UserProfile>("~/user/profile")
```

## Security Features

### 1. Token Security

- **Secure Storage**: Tokens stored in device secure storage
- **Automatic Rotation**: Tokens refreshed before expiration
- **Proper Cleanup**: Tokens cleared on logout

### 2. Request Security

- **HTTPS Only**: All requests use HTTPS
- **Token Injection**: Automatic Bearer token injection
- **Device Tracking**: Comprehensive device information

### 3. Error Security

- **No Sensitive Data**: Error messages don't expose sensitive information
- **Proper Logging**: Security events logged appropriately
- **Graceful Degradation**: Secure fallback mechanisms

## Performance Optimizations

### 1. Request Optimization

- **Proactive Refresh**: Prevents user-facing token expiration
- **Singleton Refresh**: Prevents concurrent refresh attempts
- **Request Logging**: Minimal overhead logging

### 2. Network Optimization

- **Timeout Handling**: Appropriate timeouts for mobile networks
- **Error Recovery**: Automatic retry for transient failures
- **Offline Handling**: Graceful offline behavior

### 3. Memory Optimization

- **Token Validation**: Efficient JWT decoding
- **State Management**: Minimal state updates
- **Error Handling**: Efficient error processing

## Testing and Debugging

### 1. Development Tools

**Dev Menu Integration:**

```typescript
// Available in development builds
{
  name: "Log Auth Store",
  callback: () => {
    const authStore = useAuthStore.getState()
    logger.debug("Auth Store " + JSON.stringify(authStore, null, 2))
  },
}
```

### 2. Logging

**Request Logging:**

```typescript
logger.debug(`${config.method?.toUpperCase()} ${config.url?.split("?")[0]}`)
```

**Error Logging:**

```typescript
logger.debug(`${errorCode}: ${errorMessage}`)
```

### 3. Network Debugging

**Network Inspector:**

- Use React Native Debugger for network inspection
- Monitor request/response headers
- Debug authentication flow

## Integration with Backend

The API client fully integrates with the [Hono API](../../../apps/api):

- **Shared Types**: Uses `@the/types` for type safety
- **Consistent Error Handling**: Matches backend error format
- **Authentication Flow**: Implements same auth patterns
- **Device Information**: Sends comprehensive device data
- **Token Management**: Follows backend token strategy
