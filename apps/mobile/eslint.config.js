const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended")

module.exports = defineConfig([
	expoConfig,
	eslintPluginPrettierRecommended,
	{
		rules: {
			// Allow all console statements in apps (for debugging)
			"no-console": "off",
			// Override Expo's import/order with better organization
			"import/order": [
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
			"import/no-duplicates": "error",
			// Sort members within each import statement
			"sort-imports": [
				"error",
				{
					ignoreCase: true,
					ignoreDeclarationSort: true, // We use import/order for declaration sorting
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
			// Disable some overly strict Expo rules that might conflict
			"import/no-unresolved": "off",
			"import/named": "off",
			"import/namespace": "off",
			"import/default": "off",
			"import/export": "off",
		},
	},
	{
		ignores: [".expo/", "node_modules/", "dist/", "android/", "ios/"],
	},
])
