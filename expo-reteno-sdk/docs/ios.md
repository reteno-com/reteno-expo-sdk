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
            "appGroups": ["group.com.your.bundleid.reteno-local-storage"],
            "debug": false
          },
          "android": { }
        }
      ]
    ]
  }
}
```

### 3. Run prebuild

```bash
npx expo prebuild --platform ios
```

The plugin automatically configures:
- `AppDelegate.swift` — Reteno SDK initialization
- `Podfile` — Notification Service Extension target
- `Info.plist` — background modes (`remote-notification`)
- Entitlements — `aps-environment` and App Groups
- Xcode project — `NotificationServiceExtension` target

### 4. Install CocoaPods

```bash
npx pod-install
```

### 5. Enable Push Notifications capability in Xcode

Open `ios/<YourApp>.xcworkspace` in Xcode, select your main target → **Signing & Capabilities** → **+ Capability** → **Push Notifications**.

## Plugin props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sdkAccessToken` | `string` | Yes | Reteno SDK access key |
| `mode` | `"development"` \| `"production"` | Yes | APS environment. Use `"development"` for debug/simulator builds, `"production"` for App Store/TestFlight |
| `notificationService` | `"apns"` \| `"firebase"` | Yes | Push delivery provider |
| `devTeam` | `string` | No | Apple Development Team ID (10-character string from Apple Developer portal) |
| `appGroups` | `string[]` | Yes | App Group identifiers (e.g. `["group.com.your.bundleid.reteno-local-storage"]`) |
| `debug` | `boolean` | No | Enable SDK debug logging. Default: `false` |
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
    "sdkAccessToken": "YOUR_SDK_ACCESS_KEY",
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

## Auto-open links — native setup

To control automatic URL opening on **cold start** (app launched from a killed state via push notification), add a link handler to `AppDelegate.swift` **before** `Reteno.start()`:

```swift
import Reteno

@main
class AppDelegate: RCTAppDelegate {

  private static let autoOpenLinksKey = "RetenoAutoOpenLinks"

  private static var autoOpenLinks: Bool {
    if UserDefaults.standard.object(forKey: autoOpenLinksKey) == nil {
      return true
    }
    return UserDefaults.standard.bool(forKey: autoOpenLinksKey)
  }

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // IMPORTANT: set handler BEFORE Reteno.start()
    Reteno.addLinkHandler { linkInfo in
      NotificationCenter.default.post(
        name: NSNotification.Name("RetenoLinkReceived"),
        object: nil,
        userInfo: [
          "customData": linkInfo.customData,
          "url": linkInfo.url?.absoluteString as Any
        ]
      )

      if AppDelegate.autoOpenLinks, let url = linkInfo.url {
        UIApplication.shared.open(url)
      }
    }

    // rest of setup...
  }
}
```

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
