# Prism Stack

A full-stack TypeScript monorepo starter for building native mobile apps with companion web applications and scalable APIs.

## What's Inside

- **`apps/api`**: Hono API optimized for Cloudflare Workers
- **`apps/mobile`**: React Native app with Expo for iOS and Android
- **`apps/web`**: SvelteKit web application
- **`packages/*`**: Shared TypeScript packages
- **Infrastructure**: Docker Compose for local development

## Quick Start

### Prerequisites

- [Node.js v22 LTS](https://nodejs.org/) (managed via NVM)
- [PNPM](https://pnpm.io/) (managed via Corepack)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Cursor Editor](https://cursor.com/) (recommended for multi-root workspace)

```bash
# Install Node.js v22 LTS via NVM
nvm install 22 --lts
nvm alias default node

# Enable Corepack for PNPM
corepack enable
```

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/mobile/.env.example apps/mobile/.env

# Generate JWT secret
pnpm --filter @prism/api gen:jwt-secret
```

Follow [OAuth Provider Setup](packages/auth/expo/docs/oauth.md) for creating three OAuth clients (iOS, Web, and Android) to enable Google Sign-in.

```bash
# Build and install Dev Client (development build) on a physical device
pnpm dev:install:ios
pnpm dev:install:android
```

### Development

```bash
# Start infrastructure (PostgreSQL, Neon Proxy, Mailpit, MinIO)
pnpm dev:up

# Start individual services:
pnpm dev:api     # Start Hono API development server
pnpm dev:mobile  # Start Expo development server
pnpm dev:web     # Start SvelteKit development server

# Stop infrastructure
pnpm dev:down
```

### Cloudflare Tunnel

We use Cloudflare Tunnel to expose our local development environments over a public DNS. This is required for:

- Testing on mobile devices and simulators outside our local network
- Enabling webhooks or third-party integrations that require a public endpoint

#### Setup Tunnels

1. Create a DNS `A record` for our local test domain `localtest.cc`:

   | Type | Name | Value     | Proxy | TTL  |
   | ---- | ---- | --------- | ----- | ---- |
   | A    | @    | 192.0.2.1 | ✅    | Auto |

2. **Install Cloudflare CLI**  
   [Cloudflare Tunnel CLI installation guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/create-local-tunnel/)

3. **Authenticate with Cloudflare**

   ```bash
   cloudflared login
   ```

4. **Create the Tunnel**

   ```sh
   cloudflared tunnel create --cred-file ~/.cloudflared/localtest.json localtest
   ```

5. **Create Tunnel Routes**

   Create four DNS CNAME records to the tunnel:

   ```bash
   cloudflared tunnel route dns localtest api
   cloudflared tunnel route dns localtest app
   cloudflared tunnel route dns localtest media
   cloudflared tunnel route dns localtest www
   ```

6. **Configure Tunnel Routes**

   Take a look into `cloudflared.yaml`:

   ```yaml
   tunnel: localtest
   credentials-file: ~/.cloudflared/localtest.json

   ingress:
   - hostname: api.localtest.cc      # <- Hono API
      service: http://localhost:8787
   - hostname: app.localtest.cc      # <- SvelteKit web app
      service: http://localhost:5173
   - hostname: media.localtest.cc    # <- MinIO
      service: http://localhost:9000
   - service: http_status:404        # <- Not found
   ```

7. **Redirect localtest.cc → www.localtest.cc**
   - Open to Cloudflare dashboard for `localtest.cc`
   - Go to `Rules` and create a new `Redirect Rule`.
   - Name it `Redirect localtest.cc → www.localtest.cc`.
   - Select `Wildcard pattern` with request URL `https://localtest.cc/*` and target URL `https://www.localtest.cc/${1}` with 301 status code.

8. **Bypass Cache**
   - Go to `Rules` and create a new `Cache Rule`.
   - Name it `Bypass cache for web`.
   - Use custom filter expression when:
     - `Hostname` → `is in`:
       - `www.localtest.cc`
       - `app.localtest.cc`
   - Then `Bypass cache`. Also set `Browser TTL` to `Bypass cache`.

9. **Run Tunnel:**

   ```sh
   pnpm dev:tunnel
   ```

### Development Workflow

Keep the tunnel running on a dedicated terminal. And for development, use tmux to split our terminal and run both API and Expo servers simultaneously:

- **Top pane**: Run `pnpm dev:api` for the Hono API server
- **Bottom pane**: Run `pnpm dev:mobile` for the Expo development server

### Database Operations

```bash
# Push schema changes
pnpm db:push

# Reset database
pnpm db:reset

# Open Drizzle Studio
pnpm db:admin
```

### Code Quality

```bash
# Format code across all apps
pnpm format

# Type check across all apps (using Turbo)
pnpm typecheck

# Lint code across all apps (using Turbo)
pnpm lint

# Fix lint issues across all apps (using Turbo)
pnpm lint:fix
```

### Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to ensure code quality:

- **Pre-commit**: Automatically formats staged files, runs type checking, and linting
- **Commit-msg**: Validates commit message format (conventional commits)

The hooks run the following pipeline:

1. **Format**: Prettier formatting on staged files
2. **Lint**: ESLint linting across the monorepo
3. **Typecheck**: TypeScript type checking across the monorepo

## 📁 Project Structure

```
monorepo/                 # Monorepo root
├── apps/
│   ├── api/              # Hono API for Cloudflare Workers
│   ├── mobile/           # React Native mobile app with Expo
│   └── web/              # SvelteKit companion web app
├── packages/
│   └── types/            # Shared type definitions and validation schemas
├── scripts/              # Development scripts
├── compose.yaml          # Docker services
├── drizzle.config.ts     # Drizzle configuration
├── turbo.json            # Build system configuration
└── package.json          # Root dependencies & scripts
```

## 🐳 Local Services

The development environment includes:

- **Wrangler Server**: Local dev server for Cloudflare Worker (localhost:8787)
- **PostgreSQL 17**: Main database (localhost:5432)
- **Neon Proxy**: Enables Neon serverless driver with local PostgreSQL (localhost:4444)
- **Mailpit**: Email & SMTP testing (localhost:8025)
- **MinIO**: Object storage (localhost:9000, Console: localhost:9001)

## 📚 Documentation

- [API Documentation](apps/api/README.md)
- [Authentication Guide](apps/api/docs/auth.md)
- [SMS Provider Guide](apps/api/docs/sms.md)
- [Email Provider Guide](apps/api/docs/email.md)
