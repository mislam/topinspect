import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for combining class names with Tailwind CSS conflict resolution
 *
 * Features:
 * - Handles conditional classes (falsy values are filtered out)
 * - Resolves Tailwind CSS class conflicts (last class wins)
 * - Type-safe with full TypeScript support
 *
 * @param inputs - Class names to combine
 * @returns Combined class string with conflicts resolved
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('base-class', 'additional-class')
 * // Result: "base-class additional-class"
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active-class', isDisabled && 'disabled-class')
 * // Result: "base-class active-class" (when isActive is true, isDisabled is false)
 *
 * // Tailwind conflict resolution
 * cn('text-red-500', 'text-blue-500')
 * // Result: "text-blue-500" (last class wins)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs))
}
