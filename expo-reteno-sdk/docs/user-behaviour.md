# Tracking user behaviour

## Track Custom Events

Reteno SDK provides ability to track custom events.

```ts
import Reteno from 'expo-reteno-sdk';

const result = await Reteno.logEvent({
  eventName: 'EVENT_NAME',
  date: new Date().toISOString(),
  parameters: [
    {
      name: 'Additional parameter',
      value: 'Additional value',
    },
  ],
  forcePush: false,
});
// result: { success: boolean }
```

The `parameters` list item structure:

```ts
type LogEventParameter = {
  name: string;
  value?: string;
};
```

**Note**

`date`

Date should be in [ISO8601](https://en.wikipedia.org/wiki/ISO_8601) format.

`forcePush`

`forcePush` is an iOS-only option in `logEvent` payload.

## Force push data

Reteno SDK caches events locally (events, device data, user information, user behavior, screen tracking, push statuses, etc).
Use `forcePushData` to send all accumulated events immediately:

```ts
import Reteno from 'expo-reteno-sdk';

await Reteno.forcePushData();
```

## Log screen view events

You can send screen view events using `logScreenView`:

```ts
import Reteno from 'expo-reteno-sdk';

const routeName = 'HomeScreen';
const result = await Reteno.logScreenView(routeName);
// result: { success: boolean }
```

There are multiple navigation approaches in React Native/Expo apps, therefore screen tracking integration depends on your navigator implementation.

## Mobile Push Subscribers

Reteno tracks push subscription state (subscribed/unsubscribed) based on OS-level notification permissions and token lifecycle.

On Android, SDK also monitors notification availability changes (for app/channel) and updates backend status.

## Track Session Events

`SessionStarted` is sent automatically by default. `SessionEnded` is **disabled by default** on iOS (v2.0.0); enable it explicitly if needed.

Both can be controlled via `lifecycleTrackingOptions` when calling `Reteno.initialize()`:

```ts
await Reteno.initialize({
  apiKey: 'YOUR_SDK_ACCESS_KEY',
  lifecycleTrackingOptions: {
    sessionStartEventsEnabled: true,  // default: true
    sessionEndEventsEnabled: true,    // default: false on iOS
  },
});
```

See [AppLifeCycleEvents](./app-lifecycle-events.md) for the full list of configurable lifecycle options.
