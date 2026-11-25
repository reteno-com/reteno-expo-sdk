# Android

### Getting started with Reteno SDK for Android in Expo

## Setting up SDK

Follow this guide to integrate Reteno into an Expo app.

### Step 1: Install package

Using `yarn`:

```sh
yarn add expo-reteno-sdk
```

or `npm`:

```sh
npm i expo-reteno-sdk
```

### Step 2: Configure plugin in `app.json`

Choose one initialization path.

#### Path A: Automatic initialization

Set `android.sdkAccessToken` in the plugin config. The plugin writes it to `AndroidManifest.xml`, and the SDK initializes automatically with default options.

```json
{
  "expo": {
    "plugins": [
      [
        "expo-reteno-sdk",
        {
          "android": {
            "sdkAccessToken": "YOUR_SDK_ACCESS_KEY",
            "config": {
              "isDebugMode": false
            }
          }
        }
      ]
    ],
    "android": {
      "minSdkVersion": 26
    }
  }
}
```

> If `sdkAccessToken` is set, a later `Reteno.initialize()` call is a no-op. Use Path B when you need runtime initialization options.

#### Path B: JavaScript-controlled initialization

Omit `android.sdkAccessToken`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-reteno-sdk",
        {
          "android": {}
        }
      ]
    ],
    "android": {
      "minSdkVersion": 26
    }
  }
}
```

Then initialize Reteno once at app startup:

```ts
import Reteno from 'expo-reteno-sdk';

await Reteno.initialize({
  apiKey: 'YOUR_SDK_ACCESS_KEY',
  isDebugMode: false,
  lifecycleTrackingOptions: 'ALL',
});
```

### Step 3: Add Firebase config

Download your `google-services.json` from Firebase Console, put it in the project root (next to `app.json`) and reference it in your Expo config:

```json
{
  "expo": {
    "android": {
      "package": "com.example.app",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

Expo applies the Google Services Gradle plugin and copies the file into the native project during prebuild. `expo-reteno-sdk` no longer edits Gradle files; if `android.googleServicesFile` is not set, the plugin prints a warning and push notifications through FCM will not work.

Do not commit `google-services.json` if your repository is public. Use your CI secret storage or EAS file environment variables to provide it at build time.

> Screenshots for this step are available in the hosted guide: https://docs.reteno.com/reference/expo-android-sdk-setup

### Step 4: Run Expo prebuild

```sh
npx expo prebuild --platform android
```

The plugin configures the Reteno FCM service, Android broadcast receivers and notification meta-data in `AndroidManifest.xml` automatically. The Reteno Android dependencies are provided by the `expo-reteno-sdk` native module itself. With Path A, it also adds the SDK access key to `AndroidManifest.xml`.

### Step 5: Build and run a development build

```sh
npx expo run:android
```

`expo-reteno-sdk` uses native modules and does not work in Expo Go.

### Step 6: Configure Firebase server key in Reteno panel

In Firebase console, open Project Settings -> Cloud Messaging -> Manage Service Accounts.
Then download Firebase Admin SDK service account JSON and add it in Reteno admin panel.

> Screenshots for this step are available in the hosted guide: https://docs.reteno.com/reference/expo-android-sdk-setup

Follow Reteno manual to complete setup in admin panel:
https://docs.reteno.com/docs/connect-your-mobile-app

After that you can run your app on a physical Android device and test push notifications.

## Plugin props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sdkAccessToken` | `string` | No | SDK access key for automatic initialization. Omit it to initialize from JavaScript. |
| `config.isDebugMode` | `boolean` | No | Enable SDK debug logging. Only applies when `sdkAccessToken` is set (Path A). Writes `com.reteno.IS_DEBUG_MODE` to `AndroidManifest.xml`. |
| `notificationIcon` | `string` | No | Since v2.4.0. Drawable resource for the small icon of Reteno push notifications, e.g. `@drawable/notification_icon`. Writes `com.reteno.notification_icon` to `AndroidManifest.xml`. When omitted, the SDK shows its bundled default icon. |
| `notificationIconColor` | `string` | No | Since v2.4.0. Color resource for the notification icon accent, e.g. `@color/notification_icon_color`. Writes `com.reteno.notification_icon_color` to `AndroidManifest.xml`. |

### Notification icon

The Reteno SDK renders its push notifications itself and reads the icon only from its own meta-data keys. It does not use the icon configured for Firebase or `expo-notifications`. If your app already uses the `expo-notifications` plugin with `icon` and `color`, point Reteno at the resources that plugin generates:

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", { "icon": "./assets/notification-icon.png", "color": "#ffffff" }],
      [
        "expo-reteno-sdk",
        {
          "android": {
            "notificationIcon": "@drawable/notification_icon",
            "notificationIconColor": "@color/notification_icon_color"
          }
        }
      ]
    ]
  }
}
```

Otherwise, reference any drawable and color resource that exists in your Android project. Run `npx expo prebuild --clean` after changing these props.

Values must be Android resource references (`@drawable/...` or `@mipmap/...` for the icon, `@color/...` for the color), and the resources must exist in the project. The plugin writes the values as-is without validating them, so a missing resource or a plain name such as `notification_icon` makes the Android build fail.

## Notes

- Required Android `minSdkVersion` is `26`.
- Android Gradle files are not modified by the plugin, so Groovy and Kotlin DSL projects are handled the same way.
- After upgrading to v2.0.0, run `npx expo prebuild --clean` to apply the updated manifest and FCM service configuration.
- After upgrading to v3.0.0 (Expo SDK 54–58), set `android.googleServicesFile` in your Expo config and run `npx expo prebuild --clean` once. Remove any manual Reteno or Google Services Gradle edits you added earlier to avoid duplicates.
