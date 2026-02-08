/**
 * Shared ESLint configuration for the monorepo
 * Works for both packages and Expo apps
 * Uses flat config format for ESLint 9+
 */

const typescriptEslint = require("@typescript-eslint/eslint-plugin")
const typescriptParser = require("@typescript-eslint/parser")
const importXPlugin = require("eslint-plugin-import-x")
const prettierPlugin = require("eslint-plugin-prettier")

module.exports = [
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			parser: typescriptParser,
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				__DEV__: "readonly",
				console: "readonly",
				process: "readonly",
				Buffer: "readonly",
				global: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": typescriptEslint,
			prettier: prettierPlugin,
			"import-x": importXPlugin,
		},
		rules: {
			// TypeScript specific rules
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/no-var-requires": "off", // Allow require() for config files

			// General rules
			"no-console": ["warn", { allow: ["debug", "warn", "error"] }],
			"no-debugger": "error",
			"no-duplicate-imports": "error",
			"no-unused-vars": "off", // Use TypeScript version instead
			"prefer-const": "error",
			"no-var": "error",

			// Prettier integration
			"prettier/prettier": "error",

			// Import sorting rules
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
					pathGroups: [
						{
							pattern: "react",
							group: "external",
							position: "before",
						},
						{
							pattern: "react-native",
							group: "external",
							position: "after",
						},
						{
							pattern: "expo*",
							group: "external",
							position: "after",
						},
						{
							pattern: "@/**",
							group: "internal",
							position: "after",
						},
					],
					pathGroupsExcludedImportTypes: ["react"],
				},
			],
			// Ensure no duplicate imports
			"import-x/no-duplicates": "error",
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
			// TypeScript import rules for better type imports
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
				},
			],
		},
	},
	{
		// Configuration files
		files: ["*.config.js", "*.config.ts", "metro.config.js", "babel.config.js"],
		languageOptions: {
			globals: {
				require: "readonly",
				module: "readonly",
				exports: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-var-requires": "off",
			"no-console": "off",
		},
	},
	{
		// Test files
		files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
		languageOptions: {
			globals: {
				jest: "readonly",
				describe: "readonly",
				it: "readonly",
				expect: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
	{
		ignores: ["node_modules/", "dist/", "build/", ".expo/", "android/", "ios/", "*.d.ts"],
	},
]
