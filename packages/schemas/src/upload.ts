import { z } from "zod"

// Upload-related validation schemas

// Presigned URL request schema
export const presignedUrlSchema = z.object({
	contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/, "Only image files are allowed"),
	fileName: z.string().nonempty("File name is required").max(100, "File name too long"),
})

// Direct upload query parameters schema
export const directUploadQuerySchema = z.object({
	key: z.string().nonempty("Key is required"),
	contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/, "Invalid content type"),
})

// Export types for use in other files
export type PresignedUrlRequest = z.infer<typeof presignedUrlSchema>
export type DirectUploadQuery = z.infer<typeof directUploadQuerySchema>
