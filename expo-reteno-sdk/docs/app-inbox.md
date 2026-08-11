# App inbox

## Get App Inbox Messages

You can retrieve inbox messages using `getAppInboxMessages`.

```ts
import Reteno from 'expo-reteno-sdk';

const handleDownloadMessages = () => {
  Reteno.getAppInboxMessages({ page: 0, pageSize: 20, status: 'UNOPENED' })
    .then((response) => {
      console.log('Messages:', response.messages);
      console.log('Total pages:', response.totalPages);
    })
    .catch((error) => {
      console.error('Error', error);
    });
};
```

`AppInboxPayload` (all fields optional):

```ts
type AppInboxPayload = {
  page?: number;
  pageSize?: number;
  status?: 'OPENED' | 'UNOPENED';
};
```

## Get Inbox Unread Messages Count

Use `getAppInboxMessagesCount` for one-time unread count request:

```ts
import Reteno from 'expo-reteno-sdk';

Reteno.getAppInboxMessagesCount().then((count) => {
  console.log('Unread messages count:', count);
});
```

## Handling Unread Messages Count Events

Subscribe to realtime unread count updates with `onUnreadMessagesCountChanged`:

```ts
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  const listener = Reteno.onUnreadMessagesCountChanged(({ count }) => {
    console.log('Unread Messages Count Changed:', count);
  });

  return () => {
    listener.remove();
  };
}, []);
```

Alternative unsubscribe methods:

```ts
Reteno.unsubscribeMessagesCountChanged();
Reteno.unsubscribeAllMessagesCountChanged();
```

## Marking Messages as Opened

Mark specific messages as opened with `markAsOpened`:

```ts
import Reteno from 'expo-reteno-sdk';

Reteno.markAsOpened([messageId])
  .then((response) => {
    console.log('Success Marked as Opened', response);
  })
  .catch((error) => {
    console.error('Error', error);
  });
```

> Note (Android): native implementation accepts a single message ID value. Passing multiple IDs may fail.

## Marking All Messages as Opened

Use `markAllAsOpened` to mark all inbox messages as opened:

```ts
import Reteno from 'expo-reteno-sdk';

Reteno.markAllAsOpened()
  .then((response) => {
    console.log('Success Marked All as Opened', response);
  })
  .catch((error) => {
    console.error('Error', error);
  });
```
