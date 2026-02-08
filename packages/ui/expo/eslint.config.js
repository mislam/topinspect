const baseConfig = require("../../../config/eslint")
const reactPlugin = require("eslint-plugin-react")
const reactHooksPlugin = require("eslint-plugin-react-hooks")

module.exports = [
	...baseConfig,
	{
		// React-specific configuration
		files: ["**/*.{ts,tsx}"],
		plugins: {
			react: reactPlugin,
			"react-hooks": reactHooksPlugin,
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			// React specific rules
			"react/react-in-jsx-scope": "off", // Not needed with React 17+
			"react/prop-types": "off", // We use TypeScript for prop validation
			"react/display-name": "warn",
			"react/jsx-uses-react": "off", // Not needed with React 17+
			"react/jsx-uses-vars": "error",

			// React Hooks rules
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
		},
	},
	// No package-specific overrides needed - base config handles console rules
]
