/**
 * CORS configuration for the API
 * Optimized for mobile apps and web clients
 */
export const corsConfig = {
	origin: "*", // Safe for Expo apps; change to specific origins if adding browser clients
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowHeaders: ["Content-Type", "Authorization"],
	maxAge: 86400, // 24 hours
	credentials: false, // Explicitly disallow cookies (safe for token-based auth)
}
