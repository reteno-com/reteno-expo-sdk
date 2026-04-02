# Troubleshooting

## General

### Plugin throws "You are trying to setup RetenoSDK without any props"

The plugin requires a configuration object. You can configure only the platform you need — each section is applied independently:

```json
[
  "expo-reteno-sdk",
  {
    "ios": { "sdkAccessToken": "...", "mode": "production" },
    "android": { "sdkAccessToken": "..." }
  }
]
```

### SDK does not work in Expo Go

`expo-reteno-sdk` uses native modules and cannot run in Expo Go. You must use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or the bare workflow.

```bash
npx expo run:ios
# or
npx expo run:android
```

---

## iOS

### Build fails: `Missing required "mode" key`

The `mode` prop is required for iOS. Add it to the `ios` config:

```json
"ios": {
  "sdkAccessToken": "...",
  "mode": "production"
}
```

Use `"development"` for debug/simulator builds and `"production"` for App Store/TestFlight builds.

### Build fails: `SDK token is not defined`

`sdkAccessToken` is missing in the `ios` config. This prop is required.

### Push notifications not received on device

1. Make sure **Push Notifications** capability is enabled in Xcode: target → **Signing & Capabilities** → **Push Notifications**.
2. Verify `mode` matches your build type (`"development"` for debug, `"production"` for release).
3. `registerForRemoteNotifications()` must be called at app startup.

### `NotificationServiceExtension` already exists warning

If you see `NotificationServiceExtension already exists in project. Skipping...` during prebuild, the extension was already added in a previous run. This is expected and safe to ignore.

### Development Team not set, code signing fails

Provide your 10-character Apple Team ID in the `devTeam` prop:

```json
"ios": {
  "devTeam": "XXXXXXXXXX"
}
```

Find it at [developer.apple.com](https://developer.apple.com) → Account → Membership.

### Firebase on iOS: build errors with modular headers

If you use `notificationService: "firebase"` and get Clang/modular header errors, run:

```bash
cd ios && pod install --repo-update
```

### `setDeviceToken` throws on Android

`setDeviceToken` is iOS-only. Wrap the call with a platform check:

```ts
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  Reteno.setDeviceToken(token);
}
```

---

## Android

### Plugin skips `build.gradle` configuration (Kotlin DSL warning)

The plugin only supports Groovy-based `build.gradle` files. If your project uses Kotlin DSL (`.gradle.kts`), you will see:

```
[android.googleServicesFile] Cannot automatically configure project build.gradle if it's not groovy
```

Add the required dependencies manually to `android/build.gradle`:

```groovy
dependencies {
    classpath 'com.google.gms:google-services:4.4.4'
}
```

And to `android/app/build.gradle`:

```groovy
implementation 'com.reteno:core:2.9.1'
implementation 'com.reteno:push:2.9.1'
implementation 'com.reteno:fcm:2.9.1'
implementation 'com.google.firebase:firebase-messaging:23.1.0'
implementation 'com.google.firebase:firebase-messaging-ktx:23.1.0'
```

### Build fails: `minSdkVersion` too low

Reteno Android SDK requires `minSdkVersion` 26. Set it in `app.json`:

```json
{
  "expo": {
    "android": {
      "minSdkVersion": 26
    }
  }
}
```

### Push notifications not received on Android

1. Verify `google-services.json` is placed at `android/app/google-services.json`.
2. Make sure `registerForRemoteNotifications()` is called at app startup.
3. Check that `sdkAccessToken` is correct.
