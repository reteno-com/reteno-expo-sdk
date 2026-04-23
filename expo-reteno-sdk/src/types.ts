export type RetenoSubscription = {
  remove: () => void;
};

export const InAppEvents = {
  BeforeInAppDisplay: "reteno-before-in-app-display",
  OnInAppDisplay: "reteno-on-in-app-display",
  BeforeInAppClose: "reteno-before-in-app-close",
  AfterInAppClose: "reteno-after-in-app-close",
  OnInAppError: "reteno-on-in-app-error",
  OnInAppMessageCustomData: "reteno-in-app-custom-data-received",
} as const;

export const PushNotificationEvents = {
  OnPushNotificationReceived: "reteno-push-received",
  OnPushNotificationClicked: "reteno-push-clicked",
  OnPushButtonClicked: "reteno-push-button-clicked",
  OnPushDismissed: "reteno-push-dismissed",
  OnCustomPushReceived: "reteno-custom-push-received",
} as const;

export const AppInboxEvents = {
  OnUnreadMessagesCountChanged: "reteno-unread-messages-count",
  OnUnreadMessagesCountError: "reteno-unread-messages-error",
  UnreadMessagesCount: "unreadMessagesCount",
} as const;

export type RetenoSubscriptionEvents = {
  [PushNotificationEvents.OnPushNotificationReceived]: (event: {
    body: string;
    [key: string]: any;
  }) => void;
  [PushNotificationEvents.OnPushNotificationClicked]: (event: {
    body: string;
    [key: string]: any;
  }) => void;
  [PushNotificationEvents.OnPushButtonClicked]: (event: {
    body: string;
    [key: string]: any;
  }) => void;
  [PushNotificationEvents.OnPushDismissed]: (event: Record<string, any>) => void;
  [PushNotificationEvents.OnCustomPushReceived]: (event: Record<string, any>) => void;
  [InAppEvents.BeforeInAppDisplay]: (callback: InAppDisplayData) => void;
  [InAppEvents.OnInAppDisplay]: (callback: InAppDisplayData) => void;
  [InAppEvents.BeforeInAppClose]: (callback: InAppCloseData) => void;
  [InAppEvents.AfterInAppClose]: (callback: InAppCloseData) => void;
  [InAppEvents.OnInAppError]: (callback: InAppErrorData) => void;
  [InAppEvents.OnInAppMessageCustomData]: (callback: InAppCustomData) => void;
  [AppInboxEvents.OnUnreadMessagesCountChanged]: (
    callback: UnreadMessagesCountData,
  ) => void;
  [AppInboxEvents.OnUnreadMessagesCountError]: (
    callback: UnreadMessagesCountData,
  ) => void;
  [AppInboxEvents.UnreadMessagesCount]: (
    callback: UnreadMessagesCountData,
  ) => void;
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
  user: User & {
    accountSuffix?: string;
  };
};

type Address = {
  region?: string | null;
  town?: string | null;
  address?: string | null;
  postcode?: string | null;
};

type Field = {
  key: string;
  value: string;
};

type Fields = Field[];

export type AnonymousUserAttributes = {
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  languageCode?: string | null | undefined;
  timeZone?: string | null | undefined;
  address?: Address | null | undefined;
  fields?: Fields | null | undefined;
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
  closeAction?: "OPEN_URL" | "BUTTON" | "CLOSE_BUTTON" | "DISMISSED" | "UNKNOWN";
  isCloseButtonClicked?: boolean;
  isButtonClicked?: boolean;
  isOpenUrlClicked?: boolean;
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

//ECOMMERCE EVENTS

export type EcomAttribute = {
  name: string;
  value: (string | null)[];
};

export type EcomSimpleAttribute = {
  name: string;
  value: string;
};

export type EcomProductView = {
  productId: string;
  price: number;
  isInStock: boolean;
  attributes?: EcomAttribute[] | null;
};

export type EcomCartItem = {
  productId: string;
  quantity: number;
  price: number;
  discount?: number | null;
  name?: string | null;
  category?: string | null;
};

export enum OrderStatus {
  Initialized,
  InProgress,
  Delivered,
  Cancelled,
}

export type EcomOrder = {
  externalOrderId: string;
  externalCustomerId?: string | null;
  totalCost: number;
  status: OrderStatus;
  cartId?: string | null;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  shipping?: number | null;
  discount?: number | null;
  taxes?: number | null;
  restoreId?: string | null;
  statusDescription?: string | null;
  storeId?: string | null;
  source?: string | null;
  deliveryMethod?: string | null;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  orderItems?: EcomOrderItem[] | null;
  attributes?: EcomSimpleAttribute[] | null;
};

export type EcomOrderItem = {
  externalItemId: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  url: string;
  imageUrl?: string | null;
  description?: string | null;
};

export type EcomCategoryView = {
  productCategoryId: string;
  attributes?: EcomAttribute[] | null;
};

export type EcomEventProductPayload = {
  product: EcomProductView;
  currencyCode?: string | null;
};

export type EcomEventProductCategoryViewedPayload = {
  category: EcomCategoryView;
};

export type EcomEventCartUpdatedPayload = {
  cartItems: EcomCartItem[];
  currencyCode?: string | null;
  cartId: string;
};

export type EcomEventOrderPayload = {
  order: EcomOrder;
  currencyCode?: string | null;
};

export type EcomEventOrderActionPayload = {
  externalOrderId: string;
};

export type EcomEventSearchRequestPayload = {
  searchQuery: string;
  isFound: boolean;
};
