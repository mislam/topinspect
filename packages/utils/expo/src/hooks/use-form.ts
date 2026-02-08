import { useState } from "react"

import { type z } from "zod"

// Get shape from Zod object schema
const getShape = (schema: z.ZodSchema<unknown>): z.ZodRawShape => {
	const zodObject = schema as z.ZodObject<z.ZodRawShape>
	return zodObject.shape || zodObject.def?.shape
}

// Validate a single field and return error message or null
const validateField = (fieldSchema: z.ZodTypeAny, value: unknown, field: string): string | null => {
	const result = fieldSchema.safeParse(value)
	return result.success ? null : result.error.issues[0]?.message || `${field} is invalid`
}

// Update error for a specific field
const updateFieldError = (
	setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
	field: string,
	errorMessage: string | null,
) => {
	setErrors((existingErrors) => {
		const newErrors = { ...existingErrors }
		errorMessage ? (newErrors[field] = errorMessage) : delete newErrors[field]
		return newErrors
	})
}

// Form hook for Zod schemas
export function useForm<T extends Record<string, unknown>>(
	schema: z.ZodSchema<T>,
	initialData?: Partial<T>,
) {
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [formData, setFormData] = useState<T>(() => {
		const shape = getShape(schema)
		if (!shape) throw new Error("Schema must be a Zod object schema")

		const initial: Record<string, unknown> = {}
		Object.keys(shape).forEach((field) => {
			const fieldSchema = shape[field]
			const defaultValue = initialData?.[field]

			initial[field] =
				defaultValue !== undefined
					? defaultValue
					: (fieldSchema as z.ZodTypeAny).safeParse(undefined).success
						? undefined
						: ""
		})
		return initial as T
	})

	const set = (field: keyof T, value: T[keyof T]) => {
		setFormData((currentData) => ({ ...currentData, [field]: value }))
		updateFieldError(setErrors, field as string, null)
	}

	const validate = (field?: string): boolean => {
		const shape = getShape(schema)
		const fieldsToValidate = field ? [field] : Object.keys(shape)
		let isValid = true
		const formErrors: Record<string, string> = {}

		fieldsToValidate.forEach((fieldName) => {
			const fieldSchema = shape[fieldName]
			if (!fieldSchema) return

			const value = formData[fieldName as keyof T]
			const errorMessage = validateField(fieldSchema as z.ZodTypeAny, value, fieldName)

			if (errorMessage) {
				isValid = false
				formErrors[fieldName] = errorMessage
			}
		})

		field ? updateFieldError(setErrors, field, formErrors[field] || null) : setErrors(formErrors)

		return isValid
	}

	return {
		data: formData,
		errors,
		set,
		validate,
	}
}
