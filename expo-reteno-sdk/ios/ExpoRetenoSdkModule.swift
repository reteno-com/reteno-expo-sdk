import ExpoModulesCore
import Reteno

let RetenoEvents = [
    "PushReceived":            "reteno-push-received",
    "PushClicked":             "reteno-push-clicked",
    "PushButtonClicked":       "reteno-push-button-clicked",
    "InAppCustomDataReceived": "reteno-in-app-custom-data-received",
    "BeforeInAppDisplay":      "reteno-before-in-app-display",
    "OnInAppDisplay":          "reteno-on-in-app-display",
    "BeforeInAppClose":        "reteno-before-in-app-close",
    "AfterInAppClose":         "reteno-after-in-app-close",
    "OnInAppError":            "reteno-on-in-app-error",
    "UnreadMessagesCount":     "reteno-unread-messages-count",
    "Stub":                    "reteno-default"
]

func getNotificationName(from key: String) -> NSNotification.Name {
    return Notification.Name(RetenoEvents[key] ?? "Stub")
}

extension Notification.Name {
    static let pushReceived = getNotificationName(from: "PushReceived")
    static let pushClicked = getNotificationName(from: "PushClicked")
    static let pushButtonClicked = getNotificationName(from: "PushButtonClicked")
    static let inAppCustomDataReceived = getNotificationName(from: "InAppCustomDataReceived")
    static let beforeInAppDisplay = getNotificationName(from: "BeforeInAppDisplay")
    static let onInAppDisplay = getNotificationName(from: "OnInAppDisplay")
    static let onInAppError = getNotificationName(from: "OnInAppError")
    static let beforeInAppClose = getNotificationName(from: "BeforeInAppClose")
    static let afterInAppClose = getNotificationName(from: "AfterInAppClose")
    static let unreadMessagesCount = getNotificationName(from: "UnreadMessagesCount")
}

public class ExpoRetenoSdkModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoRetenoSdk')` in JavaScript.
    Name("ExpoRetenoSdk")

    Events("onPushNotificationReceived")

    OnCreate {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.handleIncomingNotification),
        name: .pushReceived,
        object: nil
      )
    }

    OnDestroy {
      NotificationCenter.default.removeObserver(
        self,
        name: .pushReceived,
        object: nil
      )
    }

    Function("registerForRemoteNotifications") { () -> Void in
        Reteno.userNotificationService.registerForRemoteNotifications(
            with: [.sound, .alert, .badge], 
        )
    }

    Function("setUserAttributes") { (userId: String) -> Void in
        Reteno.updateUserAttributes(externalUserId: userId)
    }

    AsyncFunction("setDeviceToken") { (deviceToken: String, promise: Promise) -> Void in
        promise.resolve(
            Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
        );
    }
  }

  @objc
  func handleIncomingNotification(_ notification: Notification) {
    // sendEvent("onNotificationReceived", [
    sendEvent("onPushNotificationReceived", [
      "payload": notification.userInfo
    ])
  }
}
