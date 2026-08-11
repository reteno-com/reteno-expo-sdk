# App Lifecycle Events

Reteno SDK automatically tracks application lifecycle events.

## Track AppLifecycle Events

Tracked events include:

- `ApplicationInstalled`
- `ApplicationUpdated`
- `ApplicationOpened`
- `ApplicationBackgrounded`

## Track Push Subscription Events

Tracked events include:

- `PushNotificationsSubscribed`
- `PushNotificationsUnsubscribed`

## Track Session Events

Tracked events include:

- `SessionStarted`
- `SessionEnded`

## Expo note

Lifecycle tracking options can be configured when using JavaScript-controlled initialization:

```ts
import Reteno from 'expo-reteno-sdk';

await Reteno.initialize({
  apiKey: 'YOUR_SDK_ACCESS_KEY',
  sessionDurationSeconds: 30,
  lifecycleTrackingOptions: {
    appLifecycleEnabled: true,
    foregroundLifecycleEnabled: false,
    pushSubscriptionEnabled: true,
    sessionStartEventsEnabled: true,
    sessionEndEventsEnabled: false,
  },
});
```

`lifecycleTrackingOptions` also accepts `'ALL'` or `'NONE'`.

To use these options, omit `sdkAccessToken` from the platform plugin config. If `sdkAccessToken` is set, the SDK initializes automatically with default options before JavaScript runs.
