import { directUploadQuerySchema, presignedUrlSchema } from "@prism/schemas"

import { requireAuth } from "../modules/auth/middleware"

import type { Context, Hono } from "hono"

import { getEnv, isDev } from "@/utils/env"
import { res } from "@/utils/response"
import { validate, validateQuery } from "@/utils/validation"

// Helper function to validate and get R2 configuration
function getR2Config(c: Context) {
	const env = getEnv(c)
	const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ENDPOINT } = env

	if (
		(!isDev(c) && !R2_ACCESS_KEY_ID) ||
		(!isDev(c) && !R2_SECRET_ACCESS_KEY) ||
		!R2_BUCKET_NAME ||
		!R2_PUBLIC_URL ||
		!R2_ENDPOINT
	) {
		throw new Error("R2 configuration is missing")
	}

	return { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ENDPOINT }
}

// AWS Signature V4 implementation for R2 authentication
async function generateAwsSignatureV4(
	method: string,
	path: string,
	contentType: string,
	contentLength: number,
	accessKeyId: string,
	secretAccessKey: string,
	endpoint: string,
): Promise<Record<string, string>> {
	const now = new Date()
	const date = now.toISOString().slice(0, 10).replace(/-/g, "")
	const datetime = now.toISOString().replace(/[:\-]|\.\d{3}/g, "")

	// Parse endpoint to get region
	const url = new URL(endpoint)
	const host = url.hostname
	const region = host.includes("r2.cloudflarestorage.com") ? "auto" : "us-east-1"

	// Create canonical request
	const canonicalHeaders = [
		`host:${host}`,
		`x-amz-content-sha256:UNSIGNED-PAYLOAD`,
		`x-amz-date:${datetime}`,
	].join("\n")

	const signedHeaders = "host;x-amz-content-sha256;x-amz-date"

	const canonicalRequest = [
		method,
		path,
		"", // query string
		canonicalHeaders,
		"",
		signedHeaders,
		"UNSIGNED-PAYLOAD",
	].join("\n")

	// Create string to sign
	const algorithm = "AWS4-HMAC-SHA256"
	const credentialScope = `${date}/${region}/s3/aws4_request`
	const stringToSign = [algorithm, datetime, credentialScope, await sha256(canonicalRequest)].join(
		"\n",
	)

	// Calculate signature
	const signingKey = await getSigningKey(secretAccessKey, date, region, "s3")
	const signature = await hmacSha256(signingKey, stringToSign)

	// Create authorization header
	const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

	return {
		Authorization: authorization,
		"x-amz-date": datetime,
		"x-amz-content-sha256": "UNSIGNED-PAYLOAD",
	}
}

async function sha256(data: string): Promise<string> {
	const encoder = new TextEncoder()
	const dataBuffer = encoder.encode(data)
	const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function hmacSha256(key: Uint8Array, data: string): Promise<string> {
	const encoder = new TextEncoder()
	const dataBuffer = encoder.encode(data)

	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		key,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	)
	const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer)
	const signatureArray = Array.from(new Uint8Array(signature))
	return signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function getSigningKey(
	secretKey: string,
	date: string,
	region: string,
	service: string,
): Promise<Uint8Array> {
	const encoder = new TextEncoder()

	// kDate = HMAC-SHA256("AWS4" + secretKey, date)
	const kDateKey = encoder.encode(`AWS4${secretKey}`)
	const kDate = await hmacSha256(kDateKey, date)
	const kDateBytes = new Uint8Array(kDate.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))

	// kRegion = HMAC-SHA256(kDate, region)
	const kRegion = await hmacSha256(kDateBytes, region)
	const kRegionBytes = new Uint8Array(kRegion.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))

	// kService = HMAC-SHA256(kRegion, service)
	const kService = await hmacSha256(kRegionBytes, service)
	const kServiceBytes = new Uint8Array(kService.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))

	// kSigning = HMAC-SHA256(kService, "aws4_request")
	const kSigning = await hmacSha256(kServiceBytes, "aws4_request")
	const kSigningBytes = new Uint8Array(kSigning.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))

	return kSigningBytes
}

// Uses a proxy upload approach for both local (MinIO) and production (R2)
// This is simpler and more reliable than presigned URLs
async function generatePresignedUrl(c: Context) {
	const { contentType, fileName } = c.get("validated")

	// Use the provided fileName as the key (client controls the naming)
	const key = fileName

	// The client will send the file as raw body with query parameters

	// For presigned PUT, we don't need additional fields
	const fields = {
		key,
		contentType,
	}

	// Extract imageId from the key (remove file extension)
	const imageId = key.split(".")[0]

	// Return imageId and fields
	return res.ok(c, {
		imageId,
		fields,
	})
}

// Direct upload handler - streams request body directly to R2/MinIO
// Bypasses Cloudflare Workers FormData parsing limitations
async function directUpload(c: Context) {
	// Get validated query parameters
	const { key, contentType } = c.get("validated")

	// Get and validate R2 configuration
	const { R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = getR2Config(c)

	// Stream request body directly to R2/MinIO (bypasses FormData parsing issues)
	const requestBody = await c.req.arrayBuffer()

	// Upload to R2/MinIO with proper authentication
	const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`

	// For R2, we need AWS Signature V4 authentication
	// For MinIO, we can use simple PUT (it accepts both)
	const isR2 = R2_ENDPOINT.includes("cloudflarestorage.com")

	let headers: Record<string, string> = {
		"Content-Type": contentType,
		"Content-Length": requestBody.byteLength.toString(),
	}

	if (isR2) {
		// Generate AWS Signature V4 for R2
		const authHeaders = await generateAwsSignatureV4(
			"PUT",
			`/${R2_BUCKET_NAME}/${key}`,
			contentType,
			requestBody.byteLength,
			R2_ACCESS_KEY_ID,
			R2_SECRET_ACCESS_KEY,
			R2_ENDPOINT,
		)
		headers = { ...headers, ...authHeaders }
	}

	const uploadResponse = await fetch(uploadUrl, {
		method: "PUT",
		body: requestBody,
		headers,
	})

	if (!uploadResponse.ok) {
		const errorText = await uploadResponse.text()
		throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
	}

	// Extract imageId from key (remove file extension)
	const imageId = key.split(".")[0]
	return res.ok(c, { imageId })
}

export const registerRoutes = (app: Hono) =>
	app
		.post("/upload/presigned-url", requireAuth, validate(presignedUrlSchema), generatePresignedUrl)
		.post("/upload/direct", requireAuth, validateQuery(directUploadQuerySchema), directUpload)
