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

```json
{
  "expo": {
    "plugins": [
      [
        "expo-reteno-sdk",
        {
          "ios": { },
          "android": {
            "sdkAccessToken": "YOUR_SDK_ACCESS_KEY",
            "debug": false
          }
        }
      ]
    ]
  }
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
- `MainApplication.kt` — Reteno SDK initialization with your access key

## Plugin props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sdkAccessToken` | `string` | Yes | Reteno SDK access key |
| `debug` | `boolean` | No | Enable SDK debug logging. Default: `false` |

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
