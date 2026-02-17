# Hono API

Modern TypeScript-first API built with Hono v4.8.10 for Cloudflare Workers. Targets ~10ms cold starts with scalable, low-maintenance architecture serving mobile apps with secure token-based authentication.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono v4.8.10 (fast, lightweight)
- **Database**: Neon Postgres with Drizzle ORM v0.44.4
- **Authentication**: SMS OTP with access token + refresh token strategy
- **Validation**: Zod schemas with centralized validation utilities and type-safe request handling
- **Types**: Shared type definitions via `@prism/types` package

## Project Structure

```
src/
├── index.ts               # Application entry point
├── config/                # Configuration files
│   └── cors.ts            # CORS configuration
├── handlers/              # Business logic and route handlers
│   └── health.ts          # Health check with DB connectivity
├── middlewares/           # Request/response middleware
│   ├── index.ts           # Middleware exports
│   ├── error.ts           # Error handling middleware with comprehensive error types
│   └── json.ts            # JSON validation middleware for API requests
├── modules/               # Feature modules
│   └── auth/              # Authentication module
│       ├── index.ts       # Module exports
│       ├── handlers.ts    # Auth route handlers
│       ├── middleware.ts  # Auth middleware
│       ├── types.ts       # Auth-specific types
│       └── config.ts      # Auth configuration
├── utils/                 # Shared utilities
│   ├── date.ts            # Date/time utilities
│   ├── response.ts        # Response helpers (res.*)
│   └── validation.ts      # Centralized validation schemas and middleware
├── adapters/              # External services
│   ├── database.ts        # Neon database adapter
│   └── sms.ts             # SMS service adapter
└── db/                    # Database schema
    └── schema.ts          # Drizzle schema (auth, users, tokens, OTPs)
```

## Core Patterns

- **Response Format**: Direct data responses or structured error objects

  ```typescript
  // Success - direct data
  { data, meta? }

  // Error - structured error object
  { error, code, details? }
  ```

- **Request Validation**: Centralized Zod schemas with type-safe handlers

  ```typescript
  app.post("/users", validate(userSchema), createUser)
  ```

- **Middleware Stack**: Layered approach with CORS, JSON validation, and error handling
  - See [Middleware Architecture](docs/middleware.md) for detailed implementation

- **Authentication**: Mobile-first token strategy
  - Access Token: JWT (30 minutes) for API access
  - Refresh Token: Cryptographically secure base36 string (30 days) for token renewal
  - Comprehensive input validation with sanitization and age restrictions

## Error Handling & Response Codes

The API provides consistent error responses across all endpoints:

### Validation Errors (422)

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

### Other Error Codes

- **400 Bad Request**: General client errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation failures
- **429 Too Many Requests**: Rate limiting
- **500 Internal Server Error**: Server errors
- **503 Service Unavailable**: Service temporarily unavailable

## API & Security Docs

- See Authentication Guide (`docs/auth.md`) for the full API reference, authentication lifecycle, token behavior, database model, and security design.

## Environment Variables

**Non-secret variables** (defined in `wrangler.jsonc`):

- `ENV`: Environment name (`"development" | "staging" | "production"`)

**Secret variables** (stored in `.dev.vars` for local, and set via Wrangler CLI for production):

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: 64-character secret key for JWT signing
- `SMS_API_KEY`: API key for SMS provider
- `SMS_SENDER_ID`: Sender ID for SMS messages

**Set production secrets**:

```bash
pnpm wrangler secret put DATABASE_URL --env staging
```

**Helper functions**:

**`getEnv(c)`**: Type-safe access to all environment variables. Use it instead of direct `c.env` access for a better type safety.

**`isDev(c)`**: Returns `true` for `development` environment.

```typescript
const { DATABASE_URL, JWT_SECRET } = getEnv(c)

if (isDev(c)) {
	// This code runs on development only
}
```

## Documentation

- Authentication Guide: [docs/auth.md](docs/auth.md)
- SMS Provider: [docs/sms.md](docs/sms.md)
- Middleware Architecture: [docs/middleware.md](docs/middleware.md)
- Error Handling [docs/error.md](docs/error.md)
