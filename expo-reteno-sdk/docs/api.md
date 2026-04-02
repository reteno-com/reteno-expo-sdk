# API Reference

## Overview

| Method | Platform | Description |
|--------|----------|-------------|
| [registerForRemoteNotifications](#registerforremotenotifications) | iOS, Android | Request push notification permission and register device |
| [getInitialNotification](#getinitialnotification) | iOS, Android | Get push notification that launched the app |
| [setDeviceToken](#setdevicetoken) | iOS | Set FCM/APNs device token manually |
| [setOnRetenoPushReceivedListener](#setonretenopushreceivedlistener) | iOS, Android | Listen for incoming push notifications |
| [setOnRetenoPushClickedListener](#setonretenopushclickedlistener) | iOS, Android | Listen for push notification clicks |
| [setOnRetenoPushButtonClickedListener](#setonretenopushbuttonclickedlistener) | iOS | Listen for push notification button clicks |
| [updateUserAttributes](#updateuserattributes) | iOS, Android | Set attributes for an identified user |
| [updateAnonymousUserAttributes](#updateanonymoususerattributes) | iOS, Android | Set attributes for an anonymous user |
| [updateMultiAccountUserAttributes](#updatemultiaccountuserattributes) | iOS, Android | Set user attributes for multi-account setup |
| [logEvent](#logevent) | iOS, Android | Log a custom event |
| [logScreenView](#logscreenview) | iOS, Android | Log a screen view event |
| [forcePushData](#forcepushdata) | iOS, Android | Force send all locally cached events |
| [getRecommendations](#getrecommendations) | iOS, Android | Fetch product recommendations |
| [logRecommendationEvent](#logrecommendationevent) | iOS, Android | Log recommendation impressions and clicks |
| [getAppInboxMessages](#getappinboxmessages) | iOS, Android | Fetch App Inbox messages (payload optional) |
| [markAsOpened](#markasopened) | iOS, Android | Mark specific messages as opened |
| [markAllAsOpened](#markasopened) | iOS, Android | Mark all messages as opened |
| [getAppInboxMessagesCount](#getappinboxmessagescount) | iOS, Android | Get unread messages count |
| [onUnreadMessagesCountChanged](#onunreadmessagescountchanged) | iOS, Android | Subscribe to unread count changes |
| [unsubscribeMessagesCountChanged](#onunreadmessagescountchanged) | iOS, Android | Unsubscribe current unread count listener |
| [unsubscribeAllMessagesCountChanged](#onunreadmessagescountchanged) | iOS, Android | Unsubscribe all unread count listeners |
| [pauseInAppMessages](#pauseinappmessages) | iOS, Android | Pause or resume in-app messages |
| [setInAppLifecycleCallback](#setinapplifecyclecallback) | iOS, Android | Subscribe to in-app message lifecycle events |
| [setInAppMessagesPauseBehaviour](#setinappmessagespausebehaviour) | iOS, Android | Set behaviour when in-app messages are paused |
| [removeInAppLifecycleCallback](#setinapplifecyclecallback) | iOS, Android | Remove all in-app lifecycle callbacks |
| [logEcomEventProductViewed](#ecommerce-events) | iOS, Android | Log product viewed event |
| [logEcomEventProductCategoryViewed](#ecommerce-events) | iOS, Android | Log product category viewed event |
| [logEcomEventProductAddedToWishlist](#ecommerce-events) | iOS, Android | Log product added to wishlist event |
| [logEcomEventCartUpdated](#ecommerce-events) | iOS, Android | Log cart updated event |
| [logEcomEventOrderCreated](#ecommerce-events) | iOS, Android | Log order created event |
| [logEcomEventOrderUpdated](#ecommerce-events) | iOS, Android | Log order updated event |
| [logEcomEventOrderDelivered](#ecommerce-events) | iOS, Android | Log order delivered event |
| [logEcomEventOrderCancelled](#ecommerce-events) | iOS, Android | Log order cancelled event |
| [logEcomEventSearchRequest](#ecommerce-events) | iOS, Android | Log search request event |
| [setAutoOpenLinks](#setautoopenlinks) | iOS, Android | Enable or disable automatic URL opening. Default: `true` (iOS), `false` (Android) |
| [getAutoOpenLinks](#getautoopenlinks) | iOS, Android | Get current auto-open links setting |

---

## Push Notifications

### `registerForRemoteNotifications()`

Requests push notification permission and registers the device. Call once on app startup.

```ts
Reteno.registerForRemoteNotifications(): Promise<void>
```

---

### `getInitialNotification()`

Returns the push notification payload that triggered the app launch, or `null` if the app was not opened via a notification.

```ts
Reteno.getInitialNotification(): Promise<any | null>
```

---

### `setDeviceToken(token)`

> **iOS only.** Throws an error on Android.

Manually passes an FCM or APNs token to the Reteno SDK. Use this when managing the token via `@react-native-firebase/messaging`.

```ts
Reteno.setDeviceToken(token: string): void
```

---

### `setOnRetenoPushReceivedListener(listener)`

Subscribes to push notifications received while the app is in the foreground.

```ts
Reteno.setOnRetenoPushReceivedListener(
  listener: (event: { body: string; [key: string]: any }) => void
): RetenoSubscription
```

**Example**

```ts
const subscription = Reteno.setOnRetenoPushReceivedListener((event) => {
  console.log('Push received:', event.body);
});

// Unsubscribe:
subscription.remove();
```

---

### `setOnRetenoPushClickedListener(listener)`

Subscribes to push notification click events.

```ts
Reteno.setOnRetenoPushClickedListener(
  listener: (event: any) => void
): RetenoSubscription
```

---

### `setOnRetenoPushButtonClickedListener(listener)`

> **iOS only.**

Subscribes to push notification action button click events.

```ts
Reteno.setOnRetenoPushButtonClickedListener(
  listener: (event: any) => void
): RetenoSubscription
```

---

## User Attributes

### `updateUserAttributes(payload)`

Associates the device with an identified user and sets their profile data.

```ts
Reteno.updateUserAttributes(payload: UserInformationPayload): Promise<void>
```

**`UserInformationPayload`**

```ts
type UserInformationPayload = {
  externalUserId: string;
  user: {
    userAttributes?: UserAttributes;
    subscriptionKeys?: string[];
    groupNamesInclude?: string[];
    groupNamesExclude?: string[];
  };
};
```

**`UserAttributes`**

| Field | Type | Description |
|-------|------|-------------|
| `phone` | `string` | Phone number |
| `email` | `string` | Email address |
| `firstName` | `string` | First name |
| `lastName` | `string` | Last name |
| `languageCode` | `string` | Language code (e.g. `"en"`) |
| `timeZone` | `string` | Time zone (e.g. `"Europe/Kyiv"`) |
| `address` | `UserAddress` | Postal address |
| `fields` | `UserCustomField[]` | Custom key-value fields |

**Example**

```ts
Reteno.updateUserAttributes({
  externalUserId: 'user-123',
  user: {
    userAttributes: {
      email: 'user@example.com',
      phone: '+380501234567',
      firstName: 'John',
      lastName: 'Doe',
      languageCode: 'en',
      timeZone: 'Europe/Kyiv',
      fields: [{ key: 'plan', value: 'premium' }],
    },
    subscriptionKeys: ['newsletter'],
    groupNamesInclude: ['vip'],
  },
});
```

---

### `updateAnonymousUserAttributes(payload)`

Sets profile attributes for an unidentified (anonymous) user.

```ts
Reteno.updateAnonymousUserAttributes(payload: AnonymousUserAttributes): Promise<void>
```

**`AnonymousUserAttributes`**

| Field | Type |
|-------|------|
| `firstName` | `string` |
| `lastName` | `string` |
| `languageCode` | `string` |
| `timeZone` | `string` |
| `address` | `UserAddress` |
| `fields` | `UserCustomField[]` |

**Example**

```ts
Reteno.updateAnonymousUserAttributes({
  firstName: 'Guest',
  fields: [{ key: 'source', value: 'organic' }],
});
```

---

### `updateMultiAccountUserAttributes(payload, accountSuffix?)`

Sets user attributes in a multi-account setup where multiple Reteno accounts share the same app.

```ts
Reteno.updateMultiAccountUserAttributes(
  payload: UserInformationPayload,
  accountSuffix?: string
): Promise<void>
```

---

## Log Events

### `logEvent(payload)`

Logs a custom event with optional parameters.

```ts
Reteno.logEvent(payload: LogEventPayload): Promise<boolean | string>
```

**`LogEventPayload`**

| Field | Type | Description |
|-------|------|-------------|
| `eventName` | `string` | Event type key |
| `date` | `string` | ISO 8601 date string |
| `parameters` | `LogEventParameter[]` | Event parameters |
| `forcePush` | `boolean` | iOS only. Force-send immediately |

**`LogEventParameter`**

```ts
type LogEventParameter = {
  name: string;
  value?: string;
};
```

**Example**

```ts
Reteno.logEvent({
  eventName: 'button_clicked',
  date: new Date().toISOString(),
  parameters: [
    { name: 'button_id', value: 'subscribe' },
    { name: 'screen', value: 'home' },
  ],
});
```

---

### `logScreenView(screenName)`

Logs a screen view event.

```ts
Reteno.logScreenView(screenName: string): Promise<boolean | string>
```

**Example**

```ts
Reteno.logScreenView('HomeScreen');
```

---

### `forcePushData()`

Forces the SDK to immediately send all locally cached events to the server. The SDK normally batches events — use this to flush them on demand.

```ts
Reteno.forcePushData(): Promise<void>
```

---

## Recommendations

### `getRecommendations(payload)`

Fetches product recommendations for a given recommendation variant.

```ts
Reteno.getRecommendations(payload: RecommendationPayload): Promise<any>
```

**`RecommendationPayload`**

| Field | Type | Description |
|-------|------|-------------|
| `recomVariantId` | `string` | Recommendation variant ID |
| `productIds` | `string[]` | Product IDs to base recommendations on |
| `categoryId` | `string` | Category ID |
| `filters` | `object[]` | Optional filters |
| `fields` | `string[]` | Fields to return |

---

### `logRecommendationEvent(payload)`

Logs recommendation impressions and click events.

```ts
Reteno.logRecommendationEvent(payload: RecommendationEventPayload): Promise<void>
```

**`RecommendationEventPayload`**

| Field | Type | Description |
|-------|------|-------------|
| `recomVariantId` | `string` | Recommendation variant ID |
| `impressions` | `RecommendationEvent[]` | Viewed products |
| `clicks` | `RecommendationEvent[]` | Clicked products |
| `forcePush` | `boolean` | iOS only. Force-send immediately |

---

## App Inbox

### `getAppInboxMessages(payload)`

Fetches a paginated list of App Inbox messages.

```ts
Reteno.getAppInboxMessages(
  payload?: AppInboxPayload
): Promise<{ messages: InboxMessage[]; totalPages: number | null }>
```

**`AppInboxPayload`** — all fields optional

| Field | Type | Description |
|-------|------|-------------|
| `page` | `number` | Page number (0-based) |
| `pageSize` | `number` | Items per page |
| `status` | `"OPENED" \| "UNOPENED"` | Filter by status |

**`InboxMessage`**

| Field | Type |
|-------|------|
| `id` | `string` |
| `title` | `string` |
| `createdDate` | `string` |
| `imageURL` | `string` |
| `linkURL` | `string` |
| `isNew` | `boolean` |
| `content` | `string` |
| `category` | `string` (Android only) |
| `status` | `"OPENED" \| "UNOPENED"` (Android only) |

---

### `markAsOpened(messageIds)` / `markAllAsOpened()`

Marks specific messages or all messages as opened.

```ts
Reteno.markAsOpened(messageIds: string[]): Promise<boolean>
Reteno.markAllAsOpened(): Promise<boolean>
```

> **Note (Android):** The native Android implementation accepts a single `String`, while the JS layer passes `string[]`. Behavior depends on the bridge — may throw or silently fail for arrays with more than one element.

---

### `getAppInboxMessagesCount()`

Returns the current unread messages count.

```ts
Reteno.getAppInboxMessagesCount(): Promise<number>
```

---

### `onUnreadMessagesCountChanged(callback)`

Subscribes to real-time unread messages count updates.

```ts
Reteno.onUnreadMessagesCountChanged(
  callback: (data: { count: number }) => void
): RetenoSubscription
```

**Example**

```ts
const subscription = Reteno.onUnreadMessagesCountChanged(({ count }) => {
  console.log('Unread messages:', count);
});

// Unsubscribe current listener:
subscription.remove();

// Or unsubscribe via SDK methods:
Reteno.unsubscribeMessagesCountChanged();
Reteno.unsubscribeAllMessagesCountChanged();
```

---

## In-App Messages

### `pauseInAppMessages(state)`

Pauses or resumes in-app message display.

```ts
Reteno.pauseInAppMessages(state: boolean): Promise<void>
```

---

### `setInAppLifecycleCallback()`

Activates in-app message lifecycle events. Must be called before using lifecycle listeners.

```ts
Reteno.setInAppLifecycleCallback(): void
```

Available listeners after calling this method:

| Method | Event |
|--------|-------|
| `beforeInAppDisplayHandler(cb)` | Before in-app is shown |
| `onInAppDisplayHandler(cb)` | After in-app is shown |
| `beforeInAppCloseHandler(cb)` | Before in-app is closed |
| `afterInAppCloseHandler(cb)` | After in-app is closed |
| `onInAppErrorHandler(cb)` | On in-app error |
| `onInAppMessageCustomDataHandler(cb)` | On custom data received |

**Example**

```ts
Reteno.setInAppLifecycleCallback();

const sub = Reteno.beforeInAppDisplayHandler((data) => {
  console.log('In-app about to show:', data);
});

// Unsubscribe:
sub.remove();

// Remove all lifecycle callbacks:
Reteno.removeInAppLifecycleCallback();
```

---

### `setInAppMessagesPauseBehaviour(state)`

Sets what happens to in-app messages while paused.

```ts
Reteno.setInAppMessagesPauseBehaviour(state: 'skip' | 'postpone'): void
```

| Value | iOS | Android |
|-------|-----|---------|
| `"skip"` | Discard in-app messages that arrive while paused | Discard |
| `"postpone"` | Queue in-app messages and show them when resumed | ⚠️ Currently behaves as `"skip"` (Android bug) |

---

## Ecommerce Events

All ecommerce methods return `Promise<void>`.

> **Note (iOS):** All ecommerce events on iOS are sent immediately (`forcePush: true` hardcoded). This behavior is not configurable.

```ts
import Reteno from 'expo-reteno-sdk';
```

### Product Events

```ts
// Product viewed
Reteno.logEcomEventProductViewed(payload: EcomEventProductPayload)

// Product added to wishlist
Reteno.logEcomEventProductAddedToWishlist(payload: EcomEventProductPayload)

// Product category viewed
Reteno.logEcomEventProductCategoryViewed(payload: EcomEventProductCategoryViewedPayload)
```

**`EcomEventProductPayload`**

```ts
type EcomEventProductPayload = {
  product: {
    productId: string;
    price: number;
    isInStock: boolean;
    attributes?: { name: string; value: (string | null)[] }[];
  };
  currencyCode?: string;
};
```

### Cart Event

```ts
Reteno.logEcomEventCartUpdated(payload: EcomEventCartUpdatedPayload)
```

```ts
type EcomEventCartUpdatedPayload = {
  cartId: string;
  cartItems: {
    productId: string;
    quantity: number;
    price: number;
    discount?: number;
    name?: string;
    category?: string;
  }[];
  currencyCode?: string;
};
```

### Order Events

```ts
Reteno.logEcomEventOrderCreated(payload: EcomEventOrderPayload)
Reteno.logEcomEventOrderUpdated(payload: EcomEventOrderPayload)
Reteno.logEcomEventOrderDelivered(payload: { externalOrderId: string })
Reteno.logEcomEventOrderCancelled(payload: { externalOrderId: string })
```

```ts
type EcomEventOrderPayload = {
  order: {
    externalOrderId: string;
    totalCost: number;
    status: 0 | 1 | 2 | 3; // Initialized | InProgress | Delivered | Cancelled
    externalCustomerId?: string;
    cartId?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    orderItems?: {
      externalItemId: string;
      name: string;
      category: string;
      quantity: number;
      price: number;
      url: string;
      imageUrl?: string;
    }[];
  };
  currencyCode?: string;
};
```

### Search Event

```ts
Reteno.logEcomEventSearchRequest(payload: { searchQuery: string; isFound: boolean })
```

---

## Links

### `setAutoOpenLinks(state)`

Enables or disables automatic URL opening when a user taps a push notification or in-app message with a link.

Default: `true` on iOS, `false` on Android.

```ts
Reteno.setAutoOpenLinks(state: boolean): Promise<boolean>
```

### `getAutoOpenLinks()`

Returns the current auto-open links setting.

```ts
Reteno.getAutoOpenLinks(): Promise<boolean>
```

> **Note:** For iOS cold-start support, additional native setup in `AppDelegate` is required. See [iOS setup](./ios.md).

---

## Types

```ts
type RetenoSubscription = { remove: () => void };

type UserCustomField = { key: string; value: string };

type UserAddress = {
  region?: string;
  town?: string;
  address?: string;
  postcode?: string;
};

type UserAttributes = {
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  timeZone?: string;
  address?: UserAddress;
  fields?: UserCustomField[];
};

type AnonymousUserAttributes = {
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  timeZone?: string;
  address?: UserAddress;
  fields?: UserCustomField[];
};

type LogEventPayload = {
  eventName: string;
  date: string;
  parameters: { name: string; value?: string }[];
  forcePush?: boolean;
};

type InAppDisplayData = { id?: string; source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION' };
type InAppErrorData  = { id?: string; source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION'; errorMessage?: string };
type InAppCustomData = { customData?: Record<string, any>; url?: string; inapp_id?: string; inapp_source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION' };
```
