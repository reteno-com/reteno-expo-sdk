# Push notification

## Initialize the SDK

When using JavaScript-controlled initialization, call `initialize()` before registering listeners or requesting push notifications:

```ts
import Reteno from 'expo-reteno-sdk';

await Reteno.initialize('YOUR_SDK_ACCESS_KEY');
```

Skip this call if `sdkAccessToken` is set in the platform plugin config, because that enables automatic initialization.

## Register for push notifications

Call `registerForRemoteNotifications()` once at app startup:

```ts
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  Reteno.registerForRemoteNotifications();
}, []);
```

## Get initial notification

When your app is launched by clicking a Reteno push notification, including an iOS cold start from a terminated state, read the launch payload with `getInitialNotification()`.

The method returns the Reteno payload or `null`. On Android, launch intent extras from other integrations, such as Branch links, are ignored and do not appear as an initial Reteno notification. Call the method once during app startup; on iOS the stored cold-start response is consumed by the first call.

```ts
import { useEffect } from 'react';
import { Alert } from 'react-native';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  Reteno.getInitialNotification().then((data) => {
    if (data) {
      Alert.alert('getInitialNotification', JSON.stringify(data));
    }
  });
}, []);
```

Use `setOnRetenoPushClickedListener` below for notification clicks received after the app has started.

## Listen for new push notifications while app is active

To listen to pushes in foreground, use `setOnRetenoPushReceivedListener`:

```ts
import { useEffect } from 'react';
import { Alert } from 'react-native';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  const pushListener = Reteno.setOnRetenoPushReceivedListener((event) => {
    Alert.alert('onRetenoPushReceived', event ? JSON.stringify(event) : 'null');
  });

  return () => pushListener.remove();
}, []);
```

## Listen for Push Notification Clicks

To handle notification clicks, use `setOnRetenoPushClickedListener`:

```ts
import { useEffect } from 'react';
import { Alert } from 'react-native';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  const pushClickListener = Reteno.setOnRetenoPushClickedListener((event) => {
    Alert.alert('onRetenoPushClicked', event ? JSON.stringify(event) : 'null');
  });

  return () => pushClickListener.remove();
}, []);
```

## iOS Action Buttons

For iOS push action buttons, use `setOnRetenoPushButtonClickedListener`:

```ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  if (Platform.OS !== 'ios') return;

  const listener = Reteno.setOnRetenoPushButtonClickedListener((event) => {
    console.log('onRetenoPushButtonClicked', event);
  });

  return () => listener.remove();
}, []);
```

## Set device token manually

Use `setDeviceToken()` when managing the iOS FCM/APNs token manually:

```ts
const result = await Reteno.setDeviceToken(token);
```

The method returns `Promise<boolean>`. On Android it resolves successfully without changing the token because token handling is performed by the native Firebase messaging service.

## Listen for Push Notification Dismissed (Android only)

To handle when a user dismisses a push notification, use `setOnRetenoPushDismissedListener`:

```ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  if (Platform.OS !== 'android') return;

  const listener = Reteno.setOnRetenoPushDismissedListener((event) => {
    console.log('onRetenoPushDismissed', event);
  });

  return () => listener?.remove();
}, []);
```

## Listen for Custom / Silent Push Data (Android only)

To receive custom or silent push payloads, use `setOnRetenoCustomPushDataListener`:

```ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  if (Platform.OS !== 'android') return;

  const listener = Reteno.setOnRetenoCustomPushDataListener((event) => {
    console.log('onRetenoCustomPushReceived', event);
  });

  return () => listener?.remove();
}, []);
```

## Notification Permission (Android only)

Request notification permission at runtime and check its status:

```ts
import { Platform } from 'react-native';
import Reteno from 'expo-reteno-sdk';

// Request permission
if (Platform.OS === 'android') {
  const isGranted = await Reteno.requestNotificationPermission();
  console.log('Permission granted:', isGranted);
}

// Check current status
if (Platform.OS === 'android') {
  const status = await Reteno.getNotificationPermissionStatus();
  // status: 'ALLOWED' | 'DENIED' | 'PERMANENTLY_DENIED' | null
  console.log('Permission status:', status);
}
```

## Group notifications (Android only)

> Requires Reteno Android SDK 2.10.0 or newer (bundled since `expo-reteno-sdk` `v2.2.0`).

Notifications can be grouped by a value in the push payload or by a constant group ID. The rule is persisted natively and restored before JavaScript starts, so it also applies to notifications received while the app is not running.

```ts
import Reteno from 'expo-reteno-sdk';

// Group by a payload value, e.g. all pushes for the same chat
await Reteno.setNotificationGroupingRule({ payloadKey: 'chatId' });

// Group under a constant ID, regardless of payload
await Reteno.setNotificationGroupingRule({ groupId: 'messages' });

// Also show the collapsed "N new notifications" summary row Android displays
// when it stacks the group
await Reteno.setNotificationGroupingRule({ groupId: 'messages', showSummary: true });

// Disable grouping
await Reteno.setNotificationGroupingRule(null);
```

The rule must contain exactly one non-empty `payloadKey` or `groupId`.

### Summary notification (`showSummary`)

> Requires `expo-reteno-sdk` `v2.3.0` or newer.

Pass `showSummary: true` to also get the collapsed "N new notifications" row Android shows when it stacks a group. The SDK creates and maintains this summary notification for you natively — no native code or manual `NotificationCompat` setup needed. It:

- creates a dedicated `reteno_group_summary` notification channel (Android 8.0+),
- posts/updates the summary once at least two notifications share a group, using the fixed text "New notifications" / "You have N new notifications" (not currently customizable),
- removes the summary once fewer than two grouped notifications remain, e.g. after the user dismisses one down to a single leftover,
- automatically clears any existing summary if you call `setNotificationGroupingRule` again with a different `payloadKey`/`groupId`.

Requires Android 6.0 (API 23) or higher — on older devices the call still resolves successfully and grouping still applies, but no summary is shown. Like any notification, posting the summary also requires the `POST_NOTIFICATIONS` runtime permission on Android 13+ (see [Notification Permission (Android only)](#notification-permission-android-only) above); if it isn't granted, the summary is silently skipped until permission is granted and the next push arrives.

> **Upgrading from a manual summary implementation?** Earlier versions of this guide showed how to
> post the summary yourself from `MainApplication.kt` using
> `RetenoNotificationGroupingRuleProvider.resolveGroup(...)`. That helper is no longer part of the
> public API in `v2.3.0` — delete that native code and pass `showSummary: true` instead.

## Auto-open links behavior

Use these methods to control whether SDK opens links from push/in-app automatically:

```ts
import Reteno from 'expo-reteno-sdk';

await Reteno.setAutoOpenLinks(true); // enable
const isEnabled = await Reteno.getAutoOpenLinks();
console.log('Auto-open links:', isEnabled);
```

Default value:

- iOS: `true`
- Android: `false`

## Important for Expo

- `expo-reteno-sdk` requires a development build or bare app.
- Expo Go is not supported for push features using native module integration.
