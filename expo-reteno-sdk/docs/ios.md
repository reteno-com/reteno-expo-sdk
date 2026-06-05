# iOS Setup

## Requirements

- iOS 15.1+
- Xcode 14+
- Apple Developer account with push notifications entitlement

## Installation

### 1. Add the package

```bash
yarn add expo-reteno-sdk
# or
npm install expo-reteno-sdk
```

### 2. Configure the plugin in `app.json`

There are two setup paths — choose one:

**Path A — zero-config (no JS `initialize()` needed):**
Set `ios.sdkAccessToken` in the plugin config. The SDK auto-initializes at app startup with default options (no `isDebugMode`, no custom lifecycle/session options).

```json
{
  "expo": {
    "plugins": [
      [
        "expo-reteno-sdk",
        {
          "ios": {
            "sdkAccessToken": "YOUR_SDK_ACCESS_KEY",
            "mode": "production",
            "notificationService": "apns",
            "devTeam": "XXXXXXXXXX",
            "appGroups": ["group.com.your.bundleid.reteno-local-storage"]
          },
          "android": { "sdkAccessToken": "YOUR_SDK_ACCESS_KEY" }
        }
      ]
    ]
  }
}
```

> **Warning:** If `sdkAccessToken` is set, the SDK auto-inits with defaults before JS runs. Any subsequent call to `Reteno.initialize()` is a no-op — runtime options such as `isDebugMode`, `lifecycleTrackingOptions`, or `iosDeviceTokenHandlingMode` **will not be applied**.

**Path B — JS-controlled init (full options support):**
Omit `ios.sdkAccessToken`. Call `Reteno.initialize()` manually from JS.

```json
{
  "ios": {
    "mode": "production",
    "notificationService": "apns",
    "devTeam": "XXXXXXXXXX",
    "appGroups": ["group.com.your.bundleid.reteno-local-storage"]
  },
  "android": { "sdkAccessToken": "YOUR_SDK_ACCESS_KEY" }
}
```

### 3. Run prebuild

```bash
npx expo prebuild --platform ios
```

The plugin automatically configures:
- `AppDelegate.swift` — early Reteno delegate registration (`delayedStart`) for cold-start in-app support
- `Info.plist` — `RetenoSDKKey` (Path A only) + background modes (`remote-notification`)
- `Podfile` — Notification Service Extension target
- Entitlements — `aps-environment` and App Groups
- Xcode project — `NotificationServiceExtension` target

### 4. Install CocoaPods

```bash
npx pod-install
```

### 5. Initialize Reteno in your JS code (Path B only)

Skip this step if you used Path A above.

Call `Reteno.initialize()` once at app startup (e.g. in `App.tsx`). Push callbacks and in-app messages will not function until it is called.

```tsx
import Reteno from 'expo-reteno-sdk';

await Reteno.initialize({
  apiKey: 'YOUR_SDK_ACCESS_KEY',
  isDebugMode: false,
});
```

### 6. Enable Push Notifications capability in Xcode

Open `ios/<YourApp>.xcworkspace` in Xcode, select your main target → **Signing & Capabilities** → **+ Capability** → **Push Notifications**.

## Plugin props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sdkAccessToken` | `string` | No | SDK access key for **Path A** (zero-config auto-init). If set, the SDK starts automatically with default options — `Reteno.initialize()` is not needed but runtime JS options are ignored. Omit to use **Path B** (JS-controlled init). |
| `mode` | `"development"` \| `"production"` | Yes | APS environment. Use `"development"` for debug/simulator builds, `"production"` for App Store/TestFlight |
| `notificationService` | `"apns"` \| `"firebase"` | Yes | Push delivery provider |
| `devTeam` | `string` | No | Apple Development Team ID (10-character string from Apple Developer portal) |
| `appGroups` | `string[]` | Yes | App Group identifiers (e.g. `["group.com.your.bundleid.reteno-local-storage"]`) |
| `deploymentTarget` | `string` | No | iOS deployment target for Notification Service Extension. Default: `"15.1"` |
| `nseFilepath` | `string` | No | Path to a custom `NotificationService.swift` file |

## Firebase integration

If you use Firebase Cloud Messaging instead of APNs directly:

### 1. Install Firebase package

```bash
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Set `notificationService` to `"firebase"` in `app.json`

```json
{
  "ios": {
    "mode": "production",
    "notificationService": "firebase",
    "devTeam": "XXXXXXXXXX",
    "appGroups": ["group.com.your.bundleid.reteno-local-storage"]
  }
}
```

### 3. Run prebuild and pod install

```bash
npx expo prebuild --platform ios
npx pod-install
```

The plugin automatically adds Firebase modular headers to your `Podfile` and configures `MessagingDelegate` in `AppDelegate.swift`.

### 4. Add `GoogleService-Info.plist` to Xcode

Download `GoogleService-Info.plist` from your [Firebase Console](https://console.firebase.google.com/) and add it to your main app target in Xcode.

### 5. Pass the FCM token to Reteno

```tsx
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import Reteno from 'expo-reteno-sdk';
import { Platform } from 'react-native';

useEffect(() => {
  if (Platform.OS !== 'ios') return;

  messaging().getToken().then((token) => {
    Reteno.setDeviceToken(token);
  });

  return messaging().onTokenRefresh((token) => {
    Reteno.setDeviceToken(token);
  });
}, []);
```

## Auto-open links

Auto-open link behaviour is controlled entirely from JS via `Reteno.setAutoOpenLinks()`. No additional AppDelegate setup is required — the SDK registers its link handler inside `Reteno.initialize()`.

See [auto-open links API](./api.md#setautoopenlinks) for the JS-side control.

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

### Set device token manually (Firebase)

```tsx
import messaging from '@react-native-firebase/messaging';
import Reteno from 'expo-reteno-sdk';

const token = await messaging().getToken();
Reteno.setDeviceToken(token);
```

### Listen for push notifications

```tsx
useEffect(() => {
  const subscription = Reteno.setOnRetenoPushReceivedListener((event) => {
    console.log('Push received:', event.body);
  });

  return () => subscription.remove();
}, []);
```
