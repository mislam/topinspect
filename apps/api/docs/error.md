# Error Handling

This document outlines the comprehensive error handling system implemented in the Hono API.

## Overview

The API implements a layered error handling approach that provides:

- **Consistent error responses** across all endpoints
- **Specific error codes** for different failure scenarios
- **Structured error details** for validation failures
- **Graceful degradation** for external service failures
- **Security-conscious logging** that doesn't expose sensitive information

## Error Response Format

All error responses follow this consistent structure:

```typescript
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {} // Optional structured details
}
```

## Error Categories

### 1. Authentication Errors (401)

| Code                    | Description              | When Used                       |
| ----------------------- | ------------------------ | ------------------------------- |
| `MISSING_TOKEN`         | Access token required    | No Authorization header         |
| `INVALID_TOKEN`         | Invalid access token     | Malformed or corrupted JWT      |
| `EXPIRED_TOKEN`         | Access token expired     | JWT past expiration time        |
| `INVALID_REFRESH_TOKEN` | Invalid refresh token    | Refresh token not found/expired |
| `OTP_INVALID`           | Invalid OTP code         | Wrong OTP entered               |
| `EXPIRED_OTP`           | OTP has expired          | OTP past expiration time        |
| `OTP_MAX_ATTEMPTS`      | Too many failed attempts | Max attempts exceeded           |

### 2. Rate Limiting Errors (429)

| Code               | Description           | When Used                  |
| ------------------ | --------------------- | -------------------------- |
| `RATE_LIMITED`     | Too many requests     | General rate limiting      |
| `OTP_RATE_LIMITED` | Too many OTP requests | OTP-specific rate limiting |

### 3. User Management Errors (404/409)

| Code                 | Description             | When Used                    |
| -------------------- | ----------------------- | ---------------------------- |
| `USER_NOT_FOUND`     | User not found          | Login with non-existent user |
| `USER_EXISTS`        | User already exists     | Signup with existing phone   |
| `PROFILE_INCOMPLETE` | User profile incomplete | Data consistency issues      |

### 4. Service Errors (500/503)

| Code                | Description               | When Used                    |
| ------------------- | ------------------------- | ---------------------------- |
| `DATABASE_ERROR`    | Database operation failed | DB connection/query failures |
| `SMS_SERVICE_ERROR` | SMS service unavailable   | External SMS provider down   |

### 5. General HTTP Errors

| Code                  | Description           | When Used                |
| --------------------- | --------------------- | ------------------------ |
| `BAD_REQUEST`         | Invalid request data  | Malformed request body   |
| `VALIDATION_ERROR`    | Validation failed     | Zod schema validation    |
| `FORBIDDEN`           | Access forbidden      | Insufficient permissions |
| `NOT_FOUND`           | Resource not found    | Invalid endpoint         |
| `CONFLICT`            | Resource conflict     | Duplicate data           |
| `INTERNAL_ERROR`      | Internal server error | Unhandled exceptions     |
| `SERVICE_UNAVAILABLE` | Service unavailable   | External service down    |

## Implementation Details

### Response Utility (`src/utils/response.ts`)

The `res` utility provides methods for all error scenarios:

```typescript
// Authentication errors
res.missingToken(c)
res.invalidToken(c)
res.expiredToken(c)
res.invalidRefreshToken(c)
res.invalidOtp(c)
res.expiredOtp(c)
res.tooManyOtpAttempts(c)

// Rate limiting
res.rateLimited(c)
res.otpRateLimited(c)

// User management
res.userNotFound(c)
res.userExists(c)
res.profileIncomplete(c)

// Service errors
res.databaseError(c)
res.smsServiceError(c)
```

### OTP Verification (`src/modules/auth/types.ts`)

OTP verification uses structured error handling with types defined in the types file:

```typescript
export type OtpErrorCode = "OTP_NOT_FOUND" | "OTP_EXPIRED" | "OTP_MAX_ATTEMPTS" | "OTP_INVALID"

export interface OtpVerificationSuccess {
	success: true
}

export interface OtpVerificationFailure {
	success: false
	errorCode: OtpErrorCode
	error: string
}

export type OtpVerificationResult = OtpVerificationSuccess | OtpVerificationFailure
```

### Error Handler Middleware

The global error handler catches runtime errors and provides consistent error responses:

- **Zod validation errors**: Automatically handled with structured error details
- **Database errors**: Specific handling for constraint violations and connection issues
- **Security logging**: Logs unexpected errors while avoiding sensitive data exposure
- **Environment-aware**: Returns detailed errors in development, generic in production

## Client Integration Guidance

### Error Response Structure

Clients should expect error responses in this format:

```typescript
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": [] // Optional structured details for validation errors
}
```

### Authentication Error Handling

For authentication-related errors, clients should:

- **401 EXPIRED_TOKEN**: Attempt token refresh and retry the request
- **401 INVALID_TOKEN/INVALID_REFRESH_TOKEN**: Redirect to login
- **429 RATE_LIMITED**: Implement exponential backoff
- **422 VALIDATION_ERROR**: Display validation details to user

### Rate Limiting

When receiving `429` responses:

- Implement exponential backoff with jitter
- Respect `Retry-After` headers if provided
- Log rate limiting events for monitoring

## Best Practices

### 1. Error Logging

- **Don't log expired tokens** - this is normal user behavior
- **Log security issues** - invalid tokens, suspicious patterns
- **Log service errors** - database, SMS failures for monitoring
- **Sanitize sensitive data** - never log tokens, passwords, OTPs

### 2. Error Messages

- **User-friendly messages** - clear, actionable error descriptions
- **Consistent terminology** - use same terms across all endpoints
- **Appropriate detail level** - don't expose internal implementation

### 3. Error Recovery

- **Graceful degradation** - continue operation when possible
- **Automatic retries** - for transient failures (timeouts, network)
- **Fallback mechanisms** - alternative paths when services fail

### 4. Security Considerations

- **Rate limiting** - prevent abuse of OTP and auth endpoints
- **Token rotation** - refresh tokens on successful refresh
- **Cleanup** - remove expired/failed OTPs from database
- **Validation** - validate all inputs at API boundaries

## Testing Error Scenarios

Test these error conditions:

1. **Invalid OTP attempts** - verify max attempts enforcement
2. **Expired tokens** - test automatic refresh flow
3. **Rate limiting** - verify cooldown periods
4. **Database failures** - test error handling
5. **SMS service down** - verify graceful degradation
6. **Malformed requests** - test validation error responses

## Monitoring and Alerting

Monitor these error patterns:

- **High OTP failure rates** - potential security issues
- **Database error spikes** - infrastructure problems
- **SMS service failures** - external dependency issues
- **Token refresh failures** - authentication system problems
- **Rate limiting triggers** - potential abuse or bugs
