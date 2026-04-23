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
  InAppCloseData,
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
  UserInformationPayload,
} from "./types";
import { Platform } from "react-native";

declare class ExpoRetenoSdkModule extends NativeModule {
  // Push Notifications
  registerForRemoteNotifications(): string;
  getInitialNotification: () => Promise<boolean>;
  setDeviceToken(messagingToken: string): void;
  setOnRetenoPushReceivedListener(
    listener: (event: any) => void,
  ): RetenoSubscription;
  setOnRetenoPushClickedListener(
    listener: (event: any) => void,
  ): RetenoSubscription;
  setOnRetenoPushButtonClickedListener(
    listener: (event: any) => void,
  ): RetenoSubscription;
  // Android only
  setOnRetenoPushDismissedListener(
    listener: (event: any) => void,
  ): RetenoSubscription;
  setOnRetenoCustomPushDataListener(
    listener: (event: any) => void,
  ): RetenoSubscription;

  // User attributes
  updateUserAttributes(payload: UserInformationPayload): Promise<void>;
  updateAnonymousUserAttributes(
    payload: AnonymousUserAttributes,
  ): Promise<void>;
  updateMultiAccountUserAttributes(
    payload: UserInformationPayload,
    accountSuffix: string,
  ): Promise<void>;

  // Log events
  logEvent(payload: LogEventPayload): Promise<boolean | string>;
  logScreenView(payload: LogScreenViewPayload): Promise<boolean | string>;
  forcePushData(): Promise<void>;

  // Recommendations
  getRecommendations(payload: RecommendationPayload): Promise<any>;
  logRecommendationEvent(payload: RecommendationEventPayload): Promise<void>;

  // App Inbox messages
  getAppInboxMessages(
    payload?: AppInboxPayload,
  ): Promise<{ messages: InboxMessage[]; totalPages: null | number } | Error>;
  markAsOpened: (messageIds: string[]) => Promise<boolean>;
  markAllAsOpened: () => Promise<boolean>;
  getAppInboxMessagesCount: () => Promise<number>;
  startListeningForUnreadMessages: () => void;
  unsubscribeMessagesCountChanged: () => Promise<void>;
  unsubscribeAllMessagesCountChanged: () => Promise<void>;

  // In-App Listeners
  pauseInAppMessages(state: boolean): Promise<void>;
  setInAppLifecycleCallback(): void;
  setInAppMessagesPauseBehaviour(state: "skip" | "postpone"): void;
  // Android only - push-triggered in-app (SDK 2.9.0)
  pausePushInAppMessages(isPaused: boolean): Promise<boolean>;
  setPushInAppMessagesPauseBehaviour(state: "skip" | "postpone"): Promise<boolean>;
  // Android only - notification permission (SDK 2.9.0)
  requestNotificationPermission(): Promise<boolean>;
  getNotificationPermissionStatus(): Promise<'ALLOWED' | 'DENIED' | 'PERMANENTLY_DENIED' | null>;

  // In-App Listeners
  beforeInAppDisplayHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription;
  onInAppDisplayHandler(
    callback: (data: InAppDisplayData) => void,
  ): RetenoSubscription;
  beforeInAppCloseHandler(
    callback: (data: InAppCloseData) => void,
  ): RetenoSubscription;
  afterInAppCloseHandler(
    callback: (data: InAppCloseData) => void,
  ): RetenoSubscription;
  onInAppErrorHandler(
    callback: (data: InAppErrorData) => void,
  ): RetenoSubscription;
  onInAppMessageCustomDataHandler(
    callback: (data: InAppCustomData) => void,
  ): RetenoSubscription;
  onUnreadMessagesCountChanged(
    callback?: (data: UnreadMessagesCountData) => void,
  ): RetenoSubscription;
  removeInAppLifecycleCallback: () => void;

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

  // Autolinks
  setAutoOpenLinks: (state: boolean) => Promise<boolean>;
  getAutoOpenLinks: () => Promise<boolean>;
}

const ModuleInstance =
  requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");
const emitter = new EventEmitter<RetenoSubscriptionEvents>(ModuleInstance);

export const Reteno = {
  // Push notifications
  registerForRemoteNotifications() {
    return ModuleInstance.registerForRemoteNotifications();
  },
  getInitialNotification() {
    return ModuleInstance.getInitialNotification();
  },
  setDeviceToken(token: string) {
    if (Platform.OS === "android")
      throw new Error("[Reteno] `setDeviceToken` is iOS-only");

    return ModuleInstance.setDeviceToken(token);
  },
  setOnRetenoPushReceivedListener(
    listener: (event: any) => void,
  ): RetenoSubscription {
    return emitter.addListener(
      PushNotificationEvents.OnPushNotificationReceived,
      listener,
    );
  },

  // Android only
  setOnRetenoPushClickedListener(
    listener: (event: any) => void,
  ): RetenoSubscription | undefined {
    return emitter.addListener(
      PushNotificationEvents.OnPushNotificationClicked,
      listener,
    );
  },

  // iOS
  setOnRetenoPushButtonClickedListener(
    listener: (event: any) => void,
  ): RetenoSubscription | undefined {
    return emitter.addListener(
      PushNotificationEvents.OnPushButtonClicked,
      listener,
    );
  },

  // Android only - push dismissed
  setOnRetenoPushDismissedListener(
    listener: (event: any) => void,
  ): RetenoSubscription | undefined {
    if (Platform.OS === "android") {
      return emitter.addListener(PushNotificationEvents.OnPushDismissed, listener);
    }
    return undefined;
  },

  // Android only - custom/silent push data
  setOnRetenoCustomPushDataListener(
    listener: (event: any) => void,
  ): RetenoSubscription | undefined {
    if (Platform.OS === "android") {
      return emitter.addListener(PushNotificationEvents.OnCustomPushReceived, listener);
    }
    return undefined;
  },

  // User attributes
  updateUserAttributes(payload) {
    return ModuleInstance.updateUserAttributes(payload);
  },
  updateAnonymousUserAttributes(payload: AnonymousUserAttributes) {
    return ModuleInstance.updateAnonymousUserAttributes(payload);
  },
  updateMultiAccountUserAttributes(payload, accountSuffix) {
    return ModuleInstance.updateMultiAccountUserAttributes(
      payload,
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

  // App Inbox Messages
  getAppInboxMessages(payload: AppInboxPayload = {}) {
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

  // In-App Messages
  pauseInAppMessages(state: boolean): Promise<void> {
    return ModuleInstance.pauseInAppMessages(state);
  },
  setInAppLifecycleCallback() {
    ModuleInstance.setInAppLifecycleCallback();
  },
  setInAppMessagesPauseBehaviour(state: "skip" | "postpone"): void {
    ModuleInstance.setInAppMessagesPauseBehaviour(state);
  },
  // Android only - push-triggered in-app (SDK 2.9.0)
  pausePushInAppMessages(isPaused: boolean): Promise<boolean> {
    if (Platform.OS === "android") {
      return ModuleInstance.pausePushInAppMessages(isPaused);
    }
    return Promise.resolve(false);
  },
  setPushInAppMessagesPauseBehaviour(state: "skip" | "postpone"): Promise<boolean> {
    if (Platform.OS === "android") {
      return ModuleInstance.setPushInAppMessagesPauseBehaviour(state);
    }
    return Promise.resolve(false);
  },
  // Android only - notification permission (SDK 2.9.0)
  requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === "android") {
      return ModuleInstance.requestNotificationPermission();
    }
    return Promise.resolve(false);
  },
  getNotificationPermissionStatus(): Promise<'ALLOWED' | 'DENIED' | 'PERMANENTLY_DENIED' | null> {
    if (Platform.OS === "android") {
      return ModuleInstance.getNotificationPermissionStatus();
    }
    return Promise.resolve(null);
  },
  unsubscribeMessagesCountChanged(): void {
    ModuleInstance.unsubscribeMessagesCountChanged();
  },
  unsubscribeAllMessagesCountChanged(): void {
    ModuleInstance.unsubscribeAllMessagesCountChanged();
  },

  // In-App Listeners
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
    callback: (data: InAppCloseData) => void,
  ): RetenoSubscription {
    return emitter.addListener(InAppEvents.BeforeInAppClose, (data) => {
      if (callback && typeof callback === "function") {
        callback(data);
      }
    });
  },
  afterInAppCloseHandler(
    callback: (data: InAppCloseData) => void,
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
  onUnreadMessagesCountChanged(
    callback: (data: UnreadMessagesCountData) => void,
  ): RetenoSubscription {
    ModuleInstance.startListeningForUnreadMessages();

    return emitter.addListener(
      AppInboxEvents.OnUnreadMessagesCountChanged,
      (data) => {
        if (callback && typeof callback === "function") {
          callback(data);
        }
      },
    );
  },
  removeInAppLifecycleCallback() {
    ModuleInstance.removeInAppLifecycleCallback();
  },

  // Ecommerce Events
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
} as ExpoRetenoSdkModule;

// This call loads the native module object from the JSI.
export default Reteno;
