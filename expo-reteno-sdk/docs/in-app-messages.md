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

## Handling In-App Messages Custom Data

To receive custom data from in-app messages:

```ts
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  Reteno.setInAppLifecycleCallback();

  const listener = Reteno.onInAppMessageCustomDataHandler((data) => {
    console.log('Custom Data Received', data);
  });

  return () => listener.remove();
}, []);
```
