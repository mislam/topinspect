# Middleware Architecture

The API uses a layered middleware approach for robust request handling and consistent error responses.

## Middleware Stack

### 1. CORS Middleware (Top Level)

Located in `src/config/cors.ts`, this middleware handles cross-origin requests:

- **Origin Handling**: Allows all origins for mobile app compatibility
- **Preflight Support**: Handles OPTIONS requests automatically
- **Header Management**: Sets appropriate CORS headers for all responses
- **Performance**: Uses Hono's built-in CORS middleware for optimization

### 2. JSON Validation Middleware

Located in `src/middlewares/json.ts`, this middleware validates JSON request bodies:

- **Content-Type Detection**: Case-insensitive check for `application/json`
- **Body Size Validation**: 1MB limit to prevent DoS attacks
- **Empty Body Detection**: Catches requests with no content
- **JSON Parsing**: Validates JSON syntax before reaching business logic
- **Consistent Error Format**: All validation errors return `422 VALIDATION_ERROR` with structured details

### 3. Error Handling Middleware

Located in `src/middlewares/error.ts`, handles runtime errors and provides consistent error responses.

### 4. Route-Specific Validation

Uses Zod schemas with the `validate()` utility for business logic validation.

## Error Response Format

All validation failures return `422 Unprocessable Entity` with structured error details:

```typescript
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "code": "EMPTY_BODY",           // JSON middleware: empty request body
      "message": "Request body cannot be empty",
      "path": ["body"]
    },
    {
      "code": "BODY_TOO_LARGE",       // JSON middleware: body > 1MB
      "message": "Request body exceeds size limit (1MB)",
      "path": ["body"]
    },
    {
      "code": "INVALID_JSON",         // JSON middleware: malformed JSON
      "message": "Invalid JSON format in request body",
      "path": ["body"]
    },
    {
      "code": "INVALID_TYPE",         // Business logic: missing required field
      "message": "Expected string, got undefined",
      "path": ["phone"]
    }
  ]
}
```

## Middleware Order

The middleware stack executes in this order:

1. **CORS** → Handles preflight and adds CORS headers
2. **JSON Validation** → Validates JSON requests (bypasses non-JSON)
3. **Error Handlers** → Catches runtime errors
4. **Route Handlers** → Business logic with Zod validation

This architecture ensures that malformed requests are caught early with clear, consistent error messages, while valid requests proceed smoothly to business logic validation.

## File Upload Compatibility

The JSON validation middleware is designed to work alongside file uploads:

- **JSON requests**: Fully validated and protected
- **File uploads**: Bypass JSON validation (use `multipart/form-data`)
- **Mixed requests**: Non-JSON requests skip validation entirely

When implementing file uploads to Cloudflare R2, they will automatically bypass this middleware.

## Key Features

### JSON Middleware

- **Size limit**: 1MB maximum for JSON payloads
- **Content validation**: Ensures proper `application/json` content type
- **Syntax checking**: Validates JSON format before processing
- **Performance**: Only processes actual JSON requests

### CORS Configuration

- **Mobile-friendly**: Allows all origins for Expo app compatibility
- **Standard methods**: Supports GET, POST, PUT, DELETE, OPTIONS
- **Security**: Explicitly disables credentials (safe for token-based auth)

### Validation System

- **Zod integration**: Type-safe validation with consistent error handling
- **Context injection**: Validated data automatically available in route handlers
- **Error standardization**: All validation errors follow the same format

## Performance Considerations

- **Early rejection**: Oversized or malformed requests are rejected quickly
- **Conditional processing**: Non-JSON requests bypass validation entirely
- **Background operations**: SMS and cleanup operations use `waitUntil` for non-blocking execution

## Security Features

- **Input validation**: All JSON requests validated before reaching business logic
- **Size limits**: 1MB limit prevents DoS attacks
- **Content enforcement**: Strict JSON validation for API endpoints
- **Error sanitization**: Error messages don't expose internal implementation details
