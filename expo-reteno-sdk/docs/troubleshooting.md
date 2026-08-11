# Troubleshooting

## General

### Plugin throws "You are trying to setup RetenoSDK without any props"

The plugin requires a configuration object. You can configure only the platform you need.

```json
[
  "expo-reteno-sdk",
  {
    "ios": {
      "mode": "production",
      "notificationService": "apns",
      "appGroups": ["group.com.your.bundleid.reteno-local-storage"]
    },
    "android": {
      "sdkAccessToken": "..."
    }
  }
]
```

### Runtime initialization options are ignored

If `sdkAccessToken` is set in the platform plugin config, the SDK initializes automatically before JavaScript runs. A later `Reteno.initialize()` call is a no-op.

**`isDebugMode`** can be enabled in Path A without switching to JavaScript initialization — use `config.isDebugMode` in the plugin config alongside `sdkAccessToken`:

```json
{
  "android": { "sdkAccessToken": "YOUR_KEY", "config": { "isDebugMode": true } },
  "ios":     { "sdkAccessToken": "YOUR_KEY", "config": { "isDebugMode": true }, "mode": "...", "notificationService": "...", "appGroups": ["..."] }
}
```

To apply `lifecycleTrackingOptions`, `sessionDurationSeconds`, `pauseInAppMessages`, or `iosDeviceTokenHandlingMode`, remove `sdkAccessToken` from that platform's plugin config, run `npx expo prebuild --clean`, and initialize from JavaScript:

```ts
await Reteno.initialize({
  apiKey: 'YOUR_SDK_ACCESS_KEY',
  lifecycleTrackingOptions: 'ALL',
  sessionDurationSeconds: 30,
});
```

### Plugin changes not applied after updating SDK or plugin props

If native code does not reflect your latest `app.json` config after updating `expo-reteno-sdk`, run prebuild with `--clean` to regenerate native projects from scratch:

```bash
npx expo prebuild --clean
```

This removes `ios/` and `android/` folders and recreates them. Make sure any manual native changes are backed up or managed via config plugins.

### SDK does not work in Expo Go

`expo-reteno-sdk` uses native modules and cannot run in Expo Go.
Use development build or bare workflow.

```bash
npx expo run:ios
# or
npx expo run:android
```

## iOS

### EAS Build fails on iOS extension signing/provisioning

If cloud build fails for `NotificationServiceExtension` / `NotificationContentExtension`, add `extra.eas.build.experimental.ios.appExtensions` to Expo config (for both targets).

See setup section:

- `docs/ios.md` -> **EAS Build (important for iOS extensions)**

Expo references:

- https://docs.expo.dev/build-reference/app-extensions/
- https://docs.expo.dev/app-signing/managed-credentials/

### Build fails: Missing required `mode` key

`mode` is required in iOS plugin config:

```json
"ios": {
  "mode": "production",
  "notificationService": "apns",
  "appGroups": ["group.com.your.bundleid.reteno-local-storage"]
}
```

Use `development` for debug/simulator, `production` for TestFlight/App Store.

See [iOS setup](./ios.md) for the full list of required and optional props.

### Push notifications or in-app messages do not work

If `sdkAccessToken` is omitted from the iOS plugin config, call `Reteno.initialize({ apiKey: '...' })` once at app startup before registering listeners.

### Push notifications not received on device

1. Enable **Push Notifications** capability in Xcode.
2. Verify `mode` matches current build type.
3. Ensure `Reteno.registerForRemoteNotifications()` is called at app startup.

### `NotificationServiceExtension` already exists warning

`NotificationServiceExtension already exists in project. Skipping...` during prebuild is expected if extension already exists.

### Development Team not set, code signing fails

Set `devTeam` with your Apple Team ID:

```json
"ios": {
  "devTeam": "XXXXXXXXXX"
}
```

### Firebase on iOS: build errors with modular headers

If using `notificationService: "firebase"`, run:

```bash
cd ios && pod install --repo-update
```

### `setDeviceToken` on Android

In v2.0.0, `setDeviceToken` is a no-op on Android and resolves successfully. Android token handling is performed by the native Firebase messaging service.

## Android

### Plugin skips `build.gradle` configuration (Kotlin DSL warning)

Kotlin DSL (`.gradle.kts`) is **not fully supported**. The plugin prints a console warning and skips dependency and Google Services plugin injection. However, `compileOptions` injection still runs unconditionally — it checks for existing `sourceCompatibility`/`targetCompatibility` in the `android {}` block, but if they are absent it injects Groovy-syntax lines into `.gradle.kts`, which will break the build.

The following are **still configured automatically** even with Kotlin DSL:
- `AndroidManifest.xml` — `ExpoRetenoClickReceiver`, `ExpoRetenoPushReceiver`, and `RetenoMessagingService` (FCM)
- `gradle.properties` — `android.useAndroidX`

The following require **manual setup**:

**1. Google Services classpath** — project-level `build.gradle.kts`:

```kotlin
buildscript {
    dependencies {
        classpath("com.google.gms:google-services:4.4.4")
    }
}
```

**2. Reteno dependencies** — app-level `build.gradle.kts`:

```kotlin
plugins {
    id("com.google.gms.google-services")
}

dependencies {
    implementation("com.reteno:core:2.9.6")
    implementation("com.reteno:push:2.9.6")
    implementation("com.reteno:fcm:2.9.6")
    implementation("com.google.firebase:firebase-messaging:23.1.0")
    implementation("com.google.firebase:firebase-messaging-ktx:23.1.0")
}
```

**3. Compile options** — inside the `android {}` block in app-level `build.gradle.kts`. Verify these are present; add them if missing:

```kotlin
compileOptions {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
}
```

### Build fails: `minSdkVersion` too low

Reteno Android SDK requires `minSdkVersion` 26.

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

1. Verify `google-services.json` is located at `android/app/google-services.json`.
2. Ensure `Reteno.registerForRemoteNotifications()` is called.
3. Verify the automatic `sdkAccessToken` or the `apiKey` passed to `Reteno.initialize()`.

### Push events not tracked on Android after upgrading to v2.0.0

v2.0.0 adds an updated FCM messaging service and manifest configuration. Regenerate the native project after upgrading:

```bash
npx expo prebuild --clean
```

This regenerates the native Android project with the updated manifest configuration.
