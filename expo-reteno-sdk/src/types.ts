export type RetenoSubscription = {
  remove: () => void;
};

export type RetenoSubscriptionEvents = {
  onPushNotificationReceived: (event: {
    body: string;
    [key: string]: any;
  }) => void;
};

type UserCustomField = Record<"key" | "value", string>;

type UserAddress = {
  region?: string;
  town?: string;
  address?: string;
  postcode?: string;
};

export type RetenoUserAttributes = {
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  timeZone?: string;
  address?: UserAddress;
  fields?: UserCustomField[];
};
