/**
 * Authentication Configuration
 *
 * Configure which sign-in methods are enabled for your app.
 * Set methods to `true` to enable, `false` to disable.
 *
 * Example configurations:
 * - Phone only: { phone: true, google: false, apple: false }
 * - Google only: { phone: false, google: true, apple: false }
 * - Both phone and Google: { phone: true, google: true, apple: false }
 * - All methods: { phone: true, google: true, apple: true }
 */
export const AUTH_CONFIG = {
	phone: false, // Phone/OTP authentication
	google: true, // Google Sign-In
	apple: true, // Apple Sign-In
} as const
