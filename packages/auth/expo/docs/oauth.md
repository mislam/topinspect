# OAuth Provider Setup

Setup instructions for Google and Apple Sign-In with the `@the/auth/expo` package.

## Google Sign-In Setup

### iOS

**Create iOS OAuth Client**:

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to **APIs & Services** > **Credentials**
- Click **Create Credentials** > **OAuth client ID**
- Select **iOS** as application type
- Enter your Bundle ID (e.g., `com.viralapps.myawesomeapp`)
- Copy the **Client ID** → Set as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- Copy the **iOS URL scheme** → Set as `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`

### Android

1. **Get SHA-1 Fingerprint**:

   ```bash
   cd android
   ./gradlew signingReport
   # Look for SHA1 under "Variant: debug" > "Config: debug"
   ```

2. **Create Web OAuth Client**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Select **Web application** as application type
   - Copy the **Client ID** → Set as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

3. **Create Android OAuth Client** (for SHA-1 registration):
   - In the same **Credentials** page
   - Click **Create Credentials** > **OAuth client ID**
   - Select **Android** as application type
   - Enter:
     - **Package name**: Your app's package name (e.g., `com.viralapps.myawesomeapp`)
     - **SHA-1 certificate fingerprint**: Your SHA-1 from step 1
   - Click **Create**
   - **Note**: You don't use this Android client ID in code - it's only for SHA-1 registration

**Important**:

- Your code uses the **Web OAuth client ID** (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
- You must also create an **Android OAuth client** with SHA-1 fingerprint
- Both clients must be in the same Google Cloud project

## Apple Sign-In Setup

Apple Sign-In is automatically configured when you add the `expo-apple-authentication` plugin to your `app.json`:

```json
{
	"plugins": ["expo-apple-authentication"],
	"ios": {
		"usesAppleSignIn": true
	}
}
```

No additional OAuth client configuration is needed. Apple Sign-In uses your app's Bundle ID for authentication.

## Troubleshooting

### Google Sign-In

- **DEVELOPER_ERROR on Android**: SHA-1 fingerprint missing or incorrect. Verify Android OAuth client has correct SHA-1 and package name.
- **Package name mismatch**: Ensure `app.json` package name matches Google Cloud Console.
- **Wait time**: After adding SHA-1, wait 2-5 minutes for Google's servers to update.

### Apple Sign-In

- **Not available on device**: Apple Sign-In is only available on iOS devices running iOS 13+.
- **Configuration error**: Ensure `usesAppleSignIn: true` is set in `app.json` iOS configuration.
