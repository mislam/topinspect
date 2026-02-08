import baseConfig from "@hono/eslint-config"

// Disable type-checked rules that require project references
// This is similar to how the Hono project itself configures it
const typeCheckedRules = {
	"@typescript-eslint/no-unnecessary-type-conversion": "off",
	"@typescript-eslint/await-thenable": "off",
	"@typescript-eslint/no-base-to-string": "off",
	"@typescript-eslint/no-confusing-void-expression": "off",
	"@typescript-eslint/no-duplicate-type-constituents": "off",
	"@typescript-eslint/no-floating-promises": "off",
	"@typescript-eslint/no-for-in-array": "off",
	"@typescript-eslint/no-implied-eval": "off",
	"@typescript-eslint/no-meaningless-void-operator": "off",
	"@typescript-eslint/no-misused-promises": "off",
	"@typescript-eslint/no-mixed-enums": "off",
	"@typescript-eslint/no-redundant-type-constituents": "off",
	"@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
	"@typescript-eslint/no-unnecessary-condition": "off",
	"@typescript-eslint/no-unnecessary-template-expression": "off",
	"@typescript-eslint/no-unnecessary-type-arguments": "off",
	"@typescript-eslint/no-unnecessary-type-assertion": "off",
	"@typescript-eslint/no-unsafe-argument": "off",
	"@typescript-eslint/no-unsafe-assignment": "off",
	"@typescript-eslint/no-unsafe-call": "off",
	"@typescript-eslint/no-unsafe-enum-comparison": "off",
	"@typescript-eslint/no-unsafe-member-access": "off",
	"@typescript-eslint/no-unsafe-return": "off",
	"@typescript-eslint/no-unsafe-unary-minus": "off",
	"@typescript-eslint/only-throw-error": "off",
	"@typescript-eslint/prefer-includes": "off",
	"@typescript-eslint/prefer-nullish-coalescing": "off",
	"@typescript-eslint/prefer-optional-chain": "off",
	"@typescript-eslint/prefer-promise-reject-errors": "off",
	"@typescript-eslint/prefer-reduce-type-parameter": "off",
	"@typescript-eslint/prefer-regexp-exec": "off",
	"@typescript-eslint/prefer-return-this-type": "off",
	"@typescript-eslint/prefer-string-starts-ends-with": "off",
	"@typescript-eslint/require-await": "off",
	"@typescript-eslint/restrict-plus-operands": "off",
	"@typescript-eslint/restrict-template-expressions": "off",
	"@typescript-eslint/return-await": "off",
	"@typescript-eslint/strict-boolean-expressions": "off",
	"@typescript-eslint/unbound-method": "off",
	"@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
	"@typescript-eslint/prefer-find": "off",
	"@typescript-eslint/no-misused-spread": "off",
	"@typescript-eslint/related-getter-setter-pairs": "off",
	"@typescript-eslint/prefer-literal-enum-member": "off",
	"@typescript-eslint/no-useless-default-assignment": "off",

	// Stylistic rules that might conflict with Prettier
	"@typescript-eslint/consistent-indexed-object-style": "off",
	"@typescript-eslint/consistent-type-definitions": "off",
	"@typescript-eslint/dot-notation": "off",
	"@typescript-eslint/no-array-delete": "off",
	"@typescript-eslint/no-confusing-non-null-assertion": "off",
	"@typescript-eslint/no-deprecated": "off",
	"@typescript-eslint/no-dynamic-delete": "off",
	"@typescript-eslint/no-invalid-void-type": "off",
	"@typescript-eslint/no-non-null-assertion": "off",
	"@typescript-eslint/no-unnecessary-type-parameters": "off",
	"@typescript-eslint/no-useless-constructor": "off",
	"@typescript-eslint/non-nullable-type-assertion-style": "off",
	"@typescript-eslint/prefer-for-of": "off",
	"@typescript-eslint/prefer-function-type": "off",
	"@typescript-eslint/unified-signatures": "off",
	"@typescript-eslint/consistent-generic-constructors": "off",
	"@typescript-eslint/array-type": "off",
	"@typescript-eslint/no-extraneous-class": "off",
}

export default [
	...baseConfig,
	{
		rules: {
			...typeCheckedRules,
			// Import statement sorting rules
			"import-x/order": [
				"error",
				{
					groups: [
						"builtin",
						"external",
						"internal",
						"parent",
						"sibling",
						"index",
						"object",
						"type",
					],
					"newlines-between": "always",
					alphabetize: {
						order: "asc",
						caseInsensitive: true,
					},
				},
			],
			// Sort members within each import statement
			"sort-imports": [
				"error",
				{
					ignoreCase: true,
					ignoreDeclarationSort: true, // We use import-x/order for declaration sorting
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
					allowSeparatedGroups: false,
				},
			],
		},
	},
	{
		// Ignore build artifacts and generated files
		ignores: [
			"dist/",
			".wrangler/",
			"worker-configuration.d.ts",
			"node_modules/",
			"scripts/", // Ignore script files
		],
	},
]
