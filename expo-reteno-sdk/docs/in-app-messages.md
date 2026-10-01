# In app messages

## Pause In-App Messages

You can pause/unpause in-app messages at any time.

```ts
import Reteno from 'expo-reteno-sdk';

await Reteno.pauseInAppMessages(true);  // pause
await Reteno.pauseInAppMessages(false); // resume
```

To control what happens with messages while paused:

```ts
Reteno.setInAppMessagesPauseBehaviour('skip');
// or
Reteno.setInAppMessagesPauseBehaviour('postpone');
```

## Pause Push-Triggered In-App Messages (Android only)

Starting from Android SDK 2.9.0, push-triggered in-app messages can be paused independently:

```ts
import { Platform } from 'react-native';
import Reteno from 'expo-reteno-sdk';

if (Platform.OS === 'android') {
  await Reteno.pausePushInAppMessages(true);  // pause
  await Reteno.pausePushInAppMessages(false); // resume
}
```

To control what happens with push-triggered messages while paused:

```ts
import { Platform } from 'react-native';
import Reteno from 'expo-reteno-sdk';

if (Platform.OS === 'android') {
  await Reteno.setPushInAppMessagesPauseBehaviour('skip');
  // or
  await Reteno.setPushInAppMessagesPauseBehaviour('postpone');
}
```

## In-App Message Lifecycle Events

Subscribe to in-app lifecycle events.

Available handlers:

- `beforeInAppDisplayHandler`
- `onInAppDisplayHandler`
- `beforeInAppCloseHandler`
- `afterInAppCloseHandler`
- `onInAppErrorHandler`

```ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  Reteno.setInAppLifecycleCallback();

  const before = Reteno.beforeInAppDisplayHandler((data) => console.log('before', data));
  const onShow = Reteno.onInAppDisplayHandler((data) => console.log('show', data));
  const beforeClose = Reteno.beforeInAppCloseHandler((data) => console.log('beforeClose', data));
  const afterClose = Reteno.afterInAppCloseHandler((data) => console.log('afterClose', data));
  const onError = Reteno.onInAppErrorHandler((data) => console.log('error', data));

  return () => {
    before.remove();
    onShow.remove();
    beforeClose.remove();
    afterClose.remove();
    onError.remove();

    if (Platform.OS === 'android') {
      Reteno.removeInAppLifecycleCallback();
    }
  };
}, []);
```

### Close event data

`beforeInAppCloseHandler` and `afterInAppCloseHandler` receive an `InAppCloseData` object:

```ts
type InAppCloseData = {
  id?: string;
  source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  closeAction?: 'OPEN_URL' | 'BUTTON' | 'CLOSE_BUTTON' | 'UNKNOWN';
  isCloseButtonClicked?: boolean;
  isButtonClicked?: boolean;
  isOpenUrlClicked?: boolean;
};
```

### Error event data

`onInAppErrorHandler` receives an object with an `errorMessage` field:

```ts
type InAppErrorData = {
  id?: string;
  source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  errorMessage?: string;
};
```

## Handling Link and In-App Custom Data

Subscribe at app startup to receive link URLs and custom data from in-app messages and push notifications:

```ts
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  Reteno.setInAppLifecycleCallback();

  const listener = Reteno.onInAppMessageCustomDataHandler((data) => {
    if (data.source === 'pushNotification') {
      console.log('Push link received', data.url, data.customData);
    } else if (data.source === 'inAppMessage') {
      console.log('In-app link received', data.url, data.customData);
    }
  });

  return () => listener.remove();
}, []);
```

The event has the following shape:

```ts
type InAppCustomData = {
  customData?: Record<string, any>;
  source?: 'inAppMessage' | 'pushNotification';
  url?: string;
  inapp_id?: string;
  inapp_source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
};
```

`source` identifies where the link interaction itself originated. The Android-only `inapp_source` has different semantics: it identifies the rule that displayed the in-app message. Keep push cold-start handling through `getInitialNotification()` separate and deduplicate navigation if the same interaction is observed in both flows.

On Android, one in-app custom-data interaction produces one callback. If the
native event arrives before the first JavaScript handler is registered, it is
queued and delivered when `onInAppMessageCustomDataHandler` starts listening.

> **Android testing note:** this callback is emitted only when the in-app link
> action contains at least one custom-data field. A URL-only action is opened
> directly and does not emit `reteno-in-app-custom-data-received`. To verify
> `source` and `inapp_source`, configure test custom data such as
> `link_source_test=true` on the link action.
