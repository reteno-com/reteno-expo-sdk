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

export type UserAttributes = {
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  timeZone?: string;
  address?: UserAddress;
  fields?: UserCustomField[];
};

export type User = {
  userAttributes?: UserAttributes;
  subscriptionKeys?: string[];
  groupNamesInclude?: string[];
  groupNamesExclude?: string[];
};

export type UserInformationPayload = {
  externalUserId: string;
  user: User;
};

export type UserInformationMultiAccountPayload = {
  externalUserId: string;
  user: {
    attributes?: UserAttributes;
    subscriptionKeys?: string[];
    groupNamesInclude?: string[];
    groupNamesExclude?: string[];
    accountSuffix?: string;
  };
};

export type AnonymousUserAttributes = {
  firstName?: string;
  lastName?: string;
  timeZone?: string;
  fields?: UserCustomField[];
};

export type LogEventParameter = {
  name: string;
  value?: string;
};

export type LogEventPayload = {
  eventName: string;
  date: string;
  parameters: LogEventParameter[];
  forcePush?: boolean; // iOS-only
};

export type LogScreenViewPayload = string;
