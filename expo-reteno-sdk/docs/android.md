# Android Setup

## Requirements

- `minSdkVersion` 26+
- `google-services.json` from your Firebase project

## Installation

### 1. Add the package

```bash
yarn add expo-reteno-sdk
# or
npm install expo-reteno-sdk
```

### 2. Add `google-services.json`

Download `google-services.json` from your [Firebase Console](https://console.firebase.google.com/) and place it at:

```
android/app/google-services.json
```

### 3. Configure the plugin in `app.json`

There are two setup paths — choose one:

**Path A — zero-config (no JS `initialize()` needed):**
Set `android.sdkAccessToken` in the plugin config. The key is written to `AndroidManifest.xml` as meta-data; the native module reads it at startup and calls `Reteno.initWithConfig()` automatically with default options.

```json
{
  "expo": {
    "plugins": [
      [
        "expo-reteno-sdk",
        {
          "ios": { },
          "android": { "sdkAccessToken": "YOUR_SDK_ACCESS_KEY" }
        }
      ]
    ]
  }
}
```

> **Warning:** If `sdkAccessToken` is set, the SDK auto-inits with defaults before JS runs. Any subsequent call to `Reteno.initialize()` is a no-op — runtime options such as `isDebugMode` or `lifecycleTrackingOptions` **will not be applied**.

**Path B — JS-controlled init (full options support):**
Omit `android.sdkAccessToken`. Call `Reteno.initialize()` from JS with the API key and any desired options.

```json
{
  "android": { }
}
```

### 4. Run prebuild

```bash
npx expo prebuild --platform android
```

The plugin automatically configures:
- `android/build.gradle` — Google Services classpath dependency
- `android/app/build.gradle` — Reteno and Firebase dependencies
- `gradle.properties` — `android.useAndroidX=true`
- `AndroidManifest.xml` — `com.reteno.SDK_ACCESS_KEY` meta-data (Path A only), click/push receiver meta-data

### 5. Initialize Reteno in your JS code (Path B only)

Skip this step if you used Path A above.

```tsx
import Reteno from 'expo-reteno-sdk';

await Reteno.initialize({
  apiKey: 'YOUR_SDK_ACCESS_KEY',
  isDebugMode: false,
  lifecycleTrackingOptions: 'ALL',
});
```

## Plugin props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sdkAccessToken` | `string` | No | SDK access key for **Path A** (zero-config auto-init). If set, auto-inits with defaults — `Reteno.initialize()` not needed but runtime JS options are ignored. Omit for **Path B**. |

## Usage examples

### Register for remote notifications

```tsx
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

export default function App() {
  useEffect(() => {
    Reteno.registerForRemoteNotifications();
  }, []);

  return <YourApp />;
}
```

### Identify a user

```tsx
import Reteno from 'expo-reteno-sdk';

Reteno.updateUserAttributes({
  externalUserId: 'user-123',
  user: {
    userAttributes: {
      email: 'user@example.com',
      phone: '+380501234567',
      firstName: 'John',
      lastName: 'Doe',
    },
  },
});
```

### Listen for push notification clicks

```tsx
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

export default function App() {
  useEffect(() => {
    const subscription = Reteno.setOnRetenoPushClickedListener((event) => {
      console.log('Push clicked:', event);
    });

    return () => subscription.remove();
  }, []);

  return <YourApp />;
}
```
