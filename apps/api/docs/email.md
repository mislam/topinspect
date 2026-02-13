# Email - API Documentation

**Package**: `@the/email`  
**Adapter**: `@/adapters/email`

> **Overview**: Pluggable email sending via Mailpit (local), Postmark, or Resend. Uses React Email for templates.

## Environment Variables

| Variable         | Required | Description                                                   |
| ---------------- | -------- | ------------------------------------------------------------- |
| `EMAIL_PROVIDER` | Yes      | `mailpit` \| `resend` \| `postmark`                           |
| `EMAIL_API_KEY`  | No\*     | Provider API key (not needed for `mailpit`)                   |
| `EMAIL_FROM`     | Yes      | Sender address, e.g. `"Top Inspect <support@topinspect.app>"` |

## Providers

| Provider   | Use Case          | API Key |
| ---------- | ----------------- | ------- |
| `mailpit`  | Local development | No      |
| `resend`   | Production        | Yes     |
| `postmark` | Production        | Yes     |

## Local Development

**Mailpit** (email capture for testing):

1. Start services: `pnpm dev:up` (Mailpit runs in Docker Compose)
2. Set `EMAIL_PROVIDER=mailpit` in `.dev.vars`
3. View sent emails at http://localhost:8025

**React Email** (template preview & design):

- Run `pnpm dev:email` to start the React Email preview server
- Live preview of templates in `src/emails/` at http://localhost:3000

## Usage

```typescript
import { sendEmail } from "@/adapters/email"
import { WelcomeEmail } from "@/emails"

c.executionCtx.waitUntil(
	sendEmail(c, {
		to: "user@example.com",
		subject: "Welcome",
		template: WelcomeEmail({ appName, username, dashboardUrl, supportUrl }),
	}),
)
```
