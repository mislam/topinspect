const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const config = getDefaultConfig(__dirname)

// Restrict Metro to only watch the current app directory and shared packages
config.watchFolders = [
	__dirname, // Current app directory
	path.resolve(__dirname, "../../packages"), // Shared packages
]

config.transformer = {
	...config.transformer,
	babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
}

config.resolver = {
	...config.resolver,
	assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
	sourceExts: [...config.resolver.sourceExts, "svg"],
}

module.exports = withNativeWind(config, { input: "./src/config/app.css", inlineRem: 16 })
