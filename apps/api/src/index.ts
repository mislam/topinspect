import { Hono } from "hono"
import { cors } from "hono/cors"

import { corsConfig } from "@/config/cors"
import * as health from "@/handlers/health"
import * as upload from "@/handlers/upload"
import { errorHandler, json, notFoundHandler } from "@/middlewares"
import * as auth from "@/modules/auth"

const app = new Hono()

// CORS middleware
app.use("*", cors(corsConfig))

// JSON validation middleware
app.use("*", json)

// Error handlers
app.onError(errorHandler)
app.notFound(notFoundHandler)

// Register routes
health.registerRoutes(app)
auth.registerRoutes(app)
upload.registerRoutes(app)

export default app
