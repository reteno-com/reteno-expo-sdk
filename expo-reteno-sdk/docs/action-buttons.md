# Action Buttons

## Configuring Action Buttons

When creating mobile push notifications, you can add action buttons for greater interactivity.

- iOS supports up to 4 buttons in a single notification.
- Android supports up to 3 buttons in a single notification.

### Adding Action Buttons

1. In Reteno, open Messages -> Mobile Push.
2. Create or edit a push notification.
3. In the `Buttons` section configure each button.

> Screenshots for this step are available in the hosted guide: https://docs.reteno.com/reference/expo-action-buttons

Use unique Action ID values for different buttons.

## Handle the Action Button Click Event

### iOS

Use `setOnRetenoPushButtonClickedListener`:

```ts
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  const listener = Reteno.setOnRetenoPushButtonClickedListener((event) => {
    console.log('onRetenoPushButtonClicked', event);
  });

  return () => listener.remove();
}, []);
```

### Android

On Android, action button clicks are delivered through `setOnRetenoPushClickedListener` with button data in payload.

```ts
import { useEffect } from 'react';
import Reteno from 'expo-reteno-sdk';

useEffect(() => {
  const listener = Reteno.setOnRetenoPushClickedListener((event) => {
    console.log('onRetenoPushClicked', event);
  });

  return () => listener.remove();
}, []);
```
