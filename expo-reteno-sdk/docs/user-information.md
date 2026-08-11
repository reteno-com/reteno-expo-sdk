# Tracking user information

## External User ID

Add your custom external user ID in Reteno via `updateUserAttributes`:

```ts
import Reteno from 'expo-reteno-sdk';

Reteno.updateUserAttributes({
  externalUserId: 'USER_ID',
  user: {},
});
```

> **Note:** `externalUserId` is required and must be a non-empty string. If it is missing or empty, the SDK throws `Error('[Reteno] Missing argument: "externalUserId"')`.

## User attributes

User attributes are attributes you define to describe segments of your user base, such as language preference or geographic location.

Add user attributes like phone, email, etc. with:

```ts
import Reteno from 'expo-reteno-sdk';

Reteno.updateUserAttributes({
  externalUserId: 'USER_ID',
  user: {
    userAttributes: {
      phone: '+380501234567',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      languageCode: 'en',
      timeZone: 'Europe/Kyiv',
      marketId: 'market-1',
      fields: [{ key: 'plan', value: 'premium' }],
    },
    subscriptionKeys: ['news'],
    groupNamesInclude: ['vip'],
    groupNamesExclude: ['inactive'],
  },
});
```

The `userAttributes` object structure:

```ts
type UserAddress = {
  region?: string | null;
  town?: string | null;
  address?: string | null;
  postcode?: string | null;
};

type UserCustomField = {
  key: string;
  value: string;
};

type UserAttributes = {
  phone?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  timeZone?: string | null;
  marketId?: string | null;
  address?: UserAddress | null;
  fields?: UserCustomField[] | null;
};

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

**Note**

`LanguageCode`

Data about language in [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) format. Primary language subtag in [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format is required. Example: `de-AT`.

`TimeZone`

Item from [TZ database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). Example: `Europe/Kyiv`.

`MarketId`

External market identifier. Available since Expo SDK v2.1.0. Pass an empty string `""` to clear the value on the backend.

## Anonymous User Attributes

Reteno SDK allows tracking anonymous user attributes. Use `updateAnonymousUserAttributes`:

```ts
import Reteno from 'expo-reteno-sdk';

Reteno.updateAnonymousUserAttributes({
  firstName: 'Guest',
  lastName: 'User',
  languageCode: 'en',
  timeZone: 'Europe/Kyiv',
  marketId: 'market-1',
  fields: [{ key: 'source', value: 'organic' }],
});
```

> Note: for `phone` and/or `email`, use identified user flow with `updateUserAttributes` and `externalUserId`.

The `AnonymousUserAttributes` object also supports `marketId` since Expo SDK v2.1.0. Pass an empty string `""` to clear the value on the backend.

## Multi-account user attributes

If multiple Reteno accounts are used in the same app, use `updateMultiAccountUserAttributes`:

```ts
import Reteno from 'expo-reteno-sdk';

Reteno.updateMultiAccountUserAttributes(
  {
    externalUserId: 'USER_ID',
    user: {
      userAttributes: {
        email: 'user@example.com',
      },
    },
  },
  'account_suffix'
);
```

> **Note:** `externalUserId` is required. If it is missing or empty, the SDK throws `Error('[Reteno] Missing argument: "externalUserId"')`.
