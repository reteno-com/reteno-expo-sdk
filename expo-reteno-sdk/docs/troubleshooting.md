# Troubleshooting

## General

### Plugin throws "You are trying to setup RetenoSDK without any props"

The plugin requires a configuration object. You can configure only the platform you need — each section is applied independently:

```json
[
  "expo-reteno-sdk",
  {
    "ios": { "mode": "production" },
    "android": { "sdkAccessToken": "YOUR_SDK_ACCESS_KEY" }
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
  "mode": "production"
}
```

Use `"development"` for debug/simulator builds and `"production"` for App Store/TestFlight builds.

### Push notifications / in-app messages not working

Make sure `Reteno.initialize({ apiKey: '...' })` is called from JS at app startup. Push callbacks and in-app messages are registered inside `initialize()` — they will not function if it is never called.

```ts
import Reteno from 'expo-reteno-sdk';

await Reteno.initialize({ apiKey: 'YOUR_SDK_ACCESS_KEY' });
```

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

### `setDeviceToken` on Android

`setDeviceToken` is a no-op on Android. Token handling is performed by the native Firebase messaging service.

```ts
Reteno.setDeviceToken(token); // resolves on Android
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
implementation 'com.reteno:core:2.9.6'
implementation 'com.reteno:push:2.9.6'
implementation 'com.reteno:fcm:2.9.6'
implementation 'com.google.firebase:firebase-messaging:23.1.0'
implementation 'com.google.firebase:firebase-messaging-ktx:23.1.0'
apply plugin: 'com.google.gms.google-services'
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
3. Check that the `apiKey` passed to `Reteno.initialize()` is correct.
