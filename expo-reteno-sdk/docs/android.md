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

Download your `google-services.json` from Firebase Console and place it to:

```text
android/app/google-services.json
```

> Screenshots for this step are available in the hosted guide: https://docs.reteno.com/reference/expo-android-sdk-setup

### Step 4: Run Expo prebuild

```sh
npx expo prebuild --platform android
```

The plugin configures Gradle dependencies, the Reteno FCM service, and Android broadcast receivers automatically. With Path A, it also adds the SDK access key to `AndroidManifest.xml`.

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

## Notes

- Required Android `minSdkVersion` is `26`.
- If you use Kotlin DSL (`build.gradle.kts`), some plugin patches may require manual Gradle setup.
- After upgrading to v2.0.0, run `npx expo prebuild --clean` to apply the updated manifest and FCM service configuration.
