export type RetenoSubscription = {
  remove: () => void;
};

export const InAppEvents = {
  BeforeInAppDisplay: "beforeInAppDisplay",
  OnInAppDisplay: "onInAppDisplay",
  BeforeInAppClose: "beforeInAppClose",
  AfterInAppClose: "afterInAppClose",
  OnInAppError: "onInAppError",
} as const;

export const PushNotificationEvents = {
  OnPushNotificationReceived: "onPushNotificationReceived",
  OnPushButtonClicked: "onPushButtonClicked",
} as const;

export const AppInboxEvents = {
  OnUnreadMessagesCountChanged: "onUnreadMessagesCountChanged",
} as const;

export type RetenoSubscriptionEvents = {
  [PushNotificationEvents.OnPushNotificationReceived]: (event: {
    body: string;
    [key: string]: any;
  }) => void;
  [PushNotificationEvents.OnPushButtonClicked]: (event: {
    body: string;
    [key: string]: any;
  }) => void;
  [InAppEvents.BeforeInAppDisplay]: (callback: InAppDisplayData) => void;
  [InAppEvents.OnInAppDisplay]: (callback: InAppDisplayData) => void;
  [InAppEvents.BeforeInAppClose]: (callback: InAppDisplayData) => void;
  [InAppEvents.AfterInAppClose]: (callback: InAppDisplayData) => void;
  [InAppEvents.OnInAppError]: (callback: InAppErrorData) => void;
  [AppInboxEvents.OnUnreadMessagesCountChanged]: () => void;
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

export type RecommendationPayload = {
  recomVariantId: string;
  productIds: string[];
  categoryId: string;
  filters?: { [key: string]: any }[];
  fields: string[];
};

export type RecommendationEvent = {
  productId: string;
};

export type RecommendationEventPayload = {
  recomVariantId: string;
  impressions: RecommendationEvent[];
  clicks: RecommendationEvent[];
  // forcePush is only for IOS
  forcePush?: boolean;
};

type InAppSource = "DISPLAY_RULES" | "PUSH_NOTIFICATION";

export type InAppCloseData = {
  id?: string;
  source?: InAppSource;
  closeAction?: "OPEN_URL" | "BUTTON" | "CLOSE_BUTTON";
};

export type InAppErrorData = {
  id?: string;
  source?: InAppSource;
  errorMessage?: string;
};

export type InAppCustomData = {
  customData?: Record<string, any>;
  inapp_id?: string;
  inapp_source?: InAppSource;
  url?: string;
};

export type InAppDisplayData = {
  id?: string;
  source?: InAppSource;
};

export type AppInboxStatus = "OPENED" | "UNOPENED";

export type AppInboxPayload = {
  page?: number;
  pageSize?: number;
  status?: AppInboxStatus;
};

export type InboxMessage = {
  id: string;
  title: string;
  createdDate: string;
  imageURL?: string;
  linkURL?: string;
  isNew: boolean;
  content?: string;
  // Only on Android
  category?: string;
  status?: AppInboxStatus;
};

export type UnreadMessagesCountData = {
  count: number;
};

export type UnreadMessagesCountErrorData = {
  statusCode?: number | null;
  response?: string | null;
  error?: string | null;
};
