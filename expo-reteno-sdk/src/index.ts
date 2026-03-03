import {
  EventEmitter,
  NativeModule,
  requireNativeModule,
} from "expo-modules-core";
import {
  AnonymousUserAttributes,
  AppInboxEvents,
  AppInboxPayload,
  EcomEventCartUpdatedPayload,
  EcomEventOrderActionPayload,
  EcomEventOrderPayload,
  EcomEventProductCategoryViewedPayload,
  EcomEventProductPayload,
  EcomEventSearchRequestPayload,
  InAppCustomData,
  InAppDisplayData,
  InAppErrorData,
  InAppEvents,
  InboxMessage,
  LogEventPayload,
  LogScreenViewPayload,
  PushNotificationEvents,
  RecommendationEventPayload,
  RecommendationPayload,
  RetenoSubscription,
  RetenoSubscriptionEvents,
  UnreadMessagesCountData,
  User,
  UserInformationPayload,
} from "./types";
import { Platform } from "react-native";
// import { Platform } from "react-native";

declare class ExpoRetenoSdkModule extends NativeModule {
  registerForRemoteNotifications(): string;
  getInitialNotification: () => Promise<boolean>;
  setDeviceToken(messagingToken: string): void;
  updateUserAttributes(payload: UserInformationPayload): void;
  updateAnonymousUserAttributes(attributes?: AnonymousUserAttributes): void;
  updateMultiAccountUserAttributes(
    payload: UserInformationPayload,
    accountSuffix: string,
  ): void;
  logEvent(payload: LogEventPayload): Promise<boolean | string>;
  logScreenView(payload: LogScreenViewPayload): Promise<boolean | string>;
  forcePushData(): Promise<void>;
  getRecommendations(payload: RecommendationPayload): Promise<any>;
  logRecommendationEvent(payload: RecommendationEventPayload): Promise<void>;
  pauseInAppMessages(state: boolean): Promise<void>;
  setInAppLifecycleCallback(): void;
  getAppInboxMessages(
    payload: AppInboxPayload,
  ): Promise<InboxMessage[] | Error>;
  markAsOpened: (messageIds: string[]) => Promise<boolean>;
  markAllAsOpened: () => Promise<boolean>;
  getAppInboxMessagesCount: () => Promise<number>;

  addPushNotificationListener(
    listener: (event: any) => void,
  ): RetenoSubscription;
  beforeInAppDisplayHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription;
  onInAppDisplayHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription;
  beforeInAppCloseHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription;
  afterInAppCloseHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription;
  onInAppErrorHandler(
    callback: (data: InAppErrorData) => void,
  ): RetenoSubscription;
  onUnreadMessagesCountChanged(): RetenoSubscription;
  unreadMessagesCountHandler(
    callback: (data: UnreadMessagesCountData) => void,
  ): RetenoSubscription;
  setOnRetenoPushButtonClickedListener(
    listener: (event: any) => void,
  ): RetenoSubscription | undefined;
  onInAppMessageCustomDataHandler(
    callback: (data: InAppCustomData) => void,
  ): RetenoSubscription;

  // Ecommerce Events
  logEcomEventProductViewed: (
    payload: EcomEventProductPayload,
  ) => Promise<void>;
  logEcomEventProductAddedToWishlist: (
    payload: EcomEventProductPayload,
  ) => Promise<void>;
  logEcomEventProductCategoryViewed: (
    payload: EcomEventProductCategoryViewedPayload,
  ) => Promise<void>;
  logEcomEventCartUpdated: (
    payload: EcomEventCartUpdatedPayload,
  ) => Promise<void>;
  logEcomEventOrderCreated: (payload: EcomEventOrderPayload) => Promise<void>;
  logEcomEventOrderUpdated: (payload: EcomEventOrderPayload) => Promise<void>;
  logEcomEventOrderDelivered: (
    payload: EcomEventOrderActionPayload,
  ) => Promise<void>;
  logEcomEventOrderCancelled: (
    payload: EcomEventOrderActionPayload,
  ) => Promise<void>;
  logEcomEventSearchRequest: (
    payload: EcomEventSearchRequestPayload,
  ) => Promise<void>;

  setAutoOpenLinks: (state: boolean) => Promise<boolean>;
  getAutoOpenLinks: () => Promise<boolean>;
}

const ModuleInstance =
  requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");
const emitter = new EventEmitter<RetenoSubscriptionEvents>(ModuleInstance);

export const Reteno = {
  // User notifications
  registerForRemoteNotifications() {
    return ModuleInstance.registerForRemoteNotifications();
  },
  getInitialNotification() {
    return ModuleInstance.getInitialNotification();
  },
  setDeviceToken(token: string) {
    return ModuleInstance.setDeviceToken(token);
  },

  // User attributes
  updateUserAttributes(userId: string, attributes = {} as User) {
    return ModuleInstance.updateUserAttributes({
      externalUserId: userId,
      user: attributes,
    });
  },
  updateAnonymousUserAttributes(attributes: AnonymousUserAttributes) {
    return ModuleInstance.updateAnonymousUserAttributes(attributes);
  },
  updateMultiAccountUserAttributes(
    userId: string,
    attributes = {} as User,
    accountSuffix = "",
  ) {
    return ModuleInstance.updateMultiAccountUserAttributes(
      {
        externalUserId: userId,
        user: attributes,
      },
      accountSuffix,
    );
  },

  // Log events
  logEvent(payload: LogEventPayload): Promise<boolean | string> {
    return ModuleInstance.logEvent(payload);
  },
  logScreenView(screenName: LogScreenViewPayload): Promise<boolean | string> {
    return ModuleInstance.logScreenView(screenName);
  },
  forcePushData(): Promise<void> {
    return ModuleInstance.forcePushData();
  },

  // Recommendations
  getRecommendations(payload: RecommendationPayload): Promise<any> {
    return ModuleInstance.getRecommendations(payload);
  },
  logRecommendationEvent(payload: RecommendationEventPayload): Promise<void> {
    return ModuleInstance.logRecommendationEvent(payload);
  },

  // In-App Messages
  pauseInAppMessages(state: boolean): Promise<void> {
    return ModuleInstance.pauseInAppMessages(state);
  },
  setInAppLifecycleCallback() {
    ModuleInstance.setInAppLifecycleCallback();
  },
  getAppInboxMessages(payload: AppInboxPayload) {
    return ModuleInstance.getAppInboxMessages(payload);
  },
  markAsOpened(messageIds: string[]) {
    return ModuleInstance.markAsOpened(messageIds);
  },
  markAllAsOpened() {
    return ModuleInstance.markAllAsOpened();
  },
  getAppInboxMessagesCount() {
    return ModuleInstance.getAppInboxMessagesCount();
  },

  // Ecommerce events
  logEcomEventProductViewed: (payload: EcomEventProductPayload) => {
    return ModuleInstance.logEcomEventProductViewed(payload);
  },
  logEcomEventProductAddedToWishlist: (payload: EcomEventProductPayload) => {
    return ModuleInstance.logEcomEventProductAddedToWishlist(payload);
  },
  logEcomEventProductCategoryViewed: (
    payload: EcomEventProductCategoryViewedPayload,
  ) => {
    return ModuleInstance.logEcomEventProductCategoryViewed(payload);
  },
  logEcomEventCartUpdated: (payload: EcomEventCartUpdatedPayload) => {
    return ModuleInstance.logEcomEventCartUpdated(payload);
  },
  logEcomEventOrderCreated: (payload: EcomEventOrderPayload) => {
    return ModuleInstance.logEcomEventOrderCreated(payload);
  },
  logEcomEventOrderUpdated: (payload: EcomEventOrderPayload) => {
    return ModuleInstance.logEcomEventOrderUpdated(payload);
  },
  logEcomEventOrderDelivered: (payload: EcomEventOrderActionPayload) => {
    return ModuleInstance.logEcomEventOrderDelivered(payload);
  },
  logEcomEventOrderCancelled: (payload: EcomEventOrderActionPayload) => {
    return ModuleInstance.logEcomEventOrderCancelled(payload);
  },
  logEcomEventSearchRequest: (payload: EcomEventSearchRequestPayload) => {
    return ModuleInstance.logEcomEventSearchRequest(payload);
  },

  // Links handle
  setAutoOpenLinks: (state: boolean) => {
    return ModuleInstance.setAutoOpenLinks(state);
  },
  getAutoOpenLinks: () => {
    return ModuleInstance.getAutoOpenLinks();
  },

  // Listeners
  setOnRetenoPushReceivedListener(
    listener: (event: any) => void,
  ): RetenoSubscription {
    return emitter.addListener(
      PushNotificationEvents.OnPushNotificationReceived,
      listener,
    );
  },
  setOnRetenoPushClickedListener(
    listener: (event: any) => void,
  ): RetenoSubscription {
    return emitter.addListener(
      PushNotificationEvents.OnPushNotificationClicked,
      listener,
    );
  },
  beforeInAppDisplayHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription {
    return emitter.addListener(InAppEvents.BeforeInAppDisplay, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },
  onInAppDisplayHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription {
    return emitter.addListener(InAppEvents.OnInAppDisplay, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },
  beforeInAppCloseHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription {
    return emitter.addListener(InAppEvents.BeforeInAppClose, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },
  afterInAppCloseHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription {
    return emitter.addListener(InAppEvents.AfterInAppClose, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },
  onInAppErrorHandler(
    callback: (data: InAppErrorData) => void,
  ): RetenoSubscription {
    return emitter.addListener(InAppEvents.OnInAppError, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },
  onInAppMessageCustomDataHandler(
    callback: (data: InAppCustomData) => void,
  ): RetenoSubscription {
    return emitter.addListener(InAppEvents.OnInAppMessageCustomData, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },

  unreadMessagesCountHandler(
    callback: (data: UnreadMessagesCountData) => void,
  ) {
    return emitter.addListener(AppInboxEvents.UnreadMessagesCount, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },
  onUnreadMessagesCountChanged(): RetenoSubscription {
    return emitter.addListener(
      AppInboxEvents.OnUnreadMessagesCountChanged,
      () => {},
    );
  },

  setOnRetenoPushButtonClickedListener(
    listener: (event: any) => void,
  ): RetenoSubscription | undefined {
    if (Platform.OS === "ios") {
      return emitter.addListener(
        PushNotificationEvents.OnPushButtonClicked,
        listener,
      );
    }

    return undefined;
  },
};

// This call loads the native module object from the JSI.
export default Reteno;
