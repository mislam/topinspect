import appJson from "./app.json"

const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME

if (!googleIosUrlScheme) {
	console.warn(
		"EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME is missing — Google Sign-In on iOS will not work properly.",
	)
}

// Single source of truth: slug derived from name (lowercase, no spaces); identifier from slug
const name = appJson.expo.name as string
const slug = name.toLowerCase().replace(/\s+/g, "")
const identifierPrefix = "com.viralapps"
const applicationId = `${identifierPrefix}.${slug}`

export default {
	...appJson.expo,
	slug,
	scheme: slug,
	ios: {
		...appJson.expo.ios,
		bundleIdentifier: applicationId,
	},
	android: {
		...appJson.expo.android,
		package: applicationId,
	},
	plugins: [
		...(appJson.expo.plugins ?? []), // keep all your other static plugins
		["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosUrlScheme }],
	],
}
