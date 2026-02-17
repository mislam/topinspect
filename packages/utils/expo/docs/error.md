# Error Handling Guide

## Overview

This guide provides error handling patterns for Expo/React Native applications. The system provides consistent error responses, user-friendly error messages, and robust error recovery mechanisms that integrate seamlessly with the [Hono API error handling](../../../apps/api/docs/error.md).

## Error Response Format

All error responses follow a consistent structure that matches the backend API:

```typescript
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": [] // Optional structured details for validation errors
}
```

## Error Categories

### 1. Authentication Errors (401)

| Code                    | Description           | App Behavior                 |
| ----------------------- | --------------------- | ---------------------------- |
| `MISSING_TOKEN`         | Access token required | Redirect to login            |
| `INVALID_TOKEN`         | Invalid access token  | Redirect to login            |
| `EXPIRED_TOKEN`         | Access token expired  | Automatic refresh and retry  |
| `INVALID_REFRESH_TOKEN` | Invalid refresh token | Logout and redirect to login |

### 2. Rate Limiting Errors (429)

| Code           | Description       | App Behavior                 |
| -------------- | ----------------- | ---------------------------- |
| `RATE_LIMITED` | Too many requests | Show error with retry option |

### 3. Client Errors (400/404/409)

| Code               | Description        | App Behavior           |
| ------------------ | ------------------ | ---------------------- |
| `NOT_FOUND`        | Resource not found | Show error message     |
| `CONFLICT`         | Resource conflict  | Show error message     |
| `VALIDATION_ERROR` | Invalid input      | Show validation errors |

### 4. Network Errors

| Code            | Description          | App Behavior               |
| --------------- | -------------------- | -------------------------- |
| `NETWORK_ERROR` | Network connectivity | Show offline message       |
| `TIMEOUT_ERROR` | Request timeout      | Show retry option          |
| `UNKNOWN_ERROR` | Unexpected error     | Show generic error message |

## Implementation Patterns

### Form Validation with useForm

Use the `useForm` hook with Zod schemas for client-side validation:

```typescript
import { useForm } from "@prism/utils/expo"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
})

function MyForm() {
  const form = useForm(schema)

  const handleSubmit = () => {
    if (!form.validate()) {
      return // Validation errors are automatically set
    }

    // Submit form data
    submitData(form.data)
  }

  return (
    <View>
      <TextInput
        value={form.data.name}
        onChangeText={(value) => form.set("name", value)}
        onBlur={() => form.validate("name")}
        variant={form.errors.name ? "error" : undefined}
      />
      {form.errors.name && (
        <Text variant="error">{form.errors.name}</Text>
      )}
    </View>
  )
}
```

### API Error Handling

Handle API errors using toast notifications:

```typescript
import { Alert } from "@prism/ui/expo"

async function fetchData() {
	try {
		const response = await api.get("/data")
		// Handle success
	} catch (error: any) {
		// Handle specific error codes
		if (error.code === "CONFLICT") {
			Alert.toast({
				variant: "error",
				title: "Conflict",
				message: error.error || "This resource already exists.",
			})
			return
		}

		// Generic error
		Alert.toast({
			variant: "error",
			message: error.error || error.message || "An error occurred. Please try again.",
		})
	}
}
```

### Logging Errors

Use the logger for structured error logging:

```typescript
import { logger } from "@prism/utils/expo"

try {
	await performOperation()
} catch (error) {
	logger.error("Operation failed", { error, context: "user-action" })
	// Show user-friendly error
	Alert.toast({ variant: "error", message: "Operation failed. Please try again." })
}
```

## Best Practices

### 1. Error Message Design

- **User-Friendly**: Use clear, actionable error descriptions
- **Avoid Technical Jargon**: Don't expose internal implementation details
- **Provide Context**: Give users specific next steps when possible
- **Consistent Format**: Use the same error message structure across the app

### 2. Error Logging

- **Development**: Log all errors with full context and stack traces
- **Production**: Log security-relevant errors, avoid sensitive information
- **Structured Logging**: Use the logger utility for consistent formatting

### 3. Error Prevention

- **Input Validation**: Use Zod schemas with `useForm` for client-side validation
- **Network Handling**: Implement proper timeout handling and retry logic
- **Graceful Degradation**: Handle offline scenarios and provide fallbacks

### 4. Security Considerations

- **Don't Expose Details**: Sanitize error messages for production
- **Rate Limiting**: Handle rate limiting gracefully with user feedback
- **Authentication**: Don't reveal user existence in error messages

## Integration with Backend

The error handling system integrates with the [Hono API error handling](../../../apps/api/docs/error.md):

- **Consistent Error Format**: Matches backend error response structure
- **Shared Error Codes**: Uses same error codes as backend
- **Coordinated Handling**: Handles backend errors appropriately
- **Unified Experience**: Provides consistent error experience across platforms

## Package Integration

This error handling guide works with the following packages:

- **`@prism/utils/expo`**: Form validation (`useForm`), logging utilities
- **`@prism/types`**: Shared error response types
- **`@prism/ui/expo`**: Error display components (`Alert.toast`)
- **`@prism/auth/expo`**: Authentication error handling (if using auth features)
