import ExpoModulesCore
import Reteno
import Foundation

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
    // The module will be accessible from `requireNativeModule('ExpoSdk')` in JavaScript.
    Name("ExpoRetenoSdk")

    Events("onPushNotificationReceived")

    OnCreate {
      print("OnCreate")
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.handleIncomingNotification),
        name: .pushReceived,
        object: nil
      )
    }

    OnDestroy {
      print("OnDestroy")
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

    AsyncFunction("updateUserAttributes") { (payload: [String: Any], promise: Promise) -> Void in
        let externalUserId = payload["externalUserId"] as? String;
        
        do {
					 let requestPayload = try RetenoUserAttributes.buildSetUserAttributesPayload(payload: payload);
					
            Reteno.updateUserAttributes(
                externalUserId: externalUserId,
                userAttributes: requestPayload.userAttributes,
                subscriptionKeys: requestPayload.subscriptionKeys,
                groupNamesInclude: requestPayload.groupNamesInclude,
                groupNamesExclude: requestPayload.groupNamesExclude
            );
            let res:[String:Bool] = ["success":true];
            
						promise.resolve(res);
        } catch {
						promise.reject("100", "Reteno iOS SDK Error");
        }
    }
		
		AsyncFunction("updateAnonymousUserAttributes") { (payload: [String: Any], promise: Promise) -> Void in
			do {
					let anonymousUser = try RetenoUserAttributes.buildSetAnonymousUserAttributesPayload(payload: payload)

					Reteno.updateAnonymousUserAttributes(userAttributes: anonymousUser)
					promise.resolve(true)
			} catch {
					promise.reject("100", "Reteno iOS SDK setAnonymousUserAttributes Error");
			}
		}
		
		AsyncFunction("updateMultiAccountUserAttributes") { (
			payload: [String: Any],
			accountSuffix: String?,
			promise: Promise
		) -> Void in
			let externalUserId = payload["externalUserId"] as? String;
			
			do {
					let requestPayload = try RetenoUserAttributes.buildSetUserAttributesPayload(payload: payload);
					Reteno.updateMultiAccountUserAttributes(
							externalUserId: externalUserId,
							userAttributes: requestPayload.userAttributes,
							subscriptionKeys: requestPayload.subscriptionKeys,
							groupNamesInclude: requestPayload.groupNamesInclude,
							groupNamesExclude: requestPayload.groupNamesExclude,
							accountSuffix: getStringOrNil(input: accountSuffix)
					);
					let res:[String:Bool] = ["success":true];
					
					promise.resolve(res);
			} catch {
					promise.reject("100", "Reteno iOS SDK Error");
			}
		}

    AsyncFunction("setDeviceToken") { (deviceToken: String, promise: Promise) -> Void in
        promise.resolve(
            Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
        );
    }

		AsyncFunction("logEvent") { (payload: [String: Any], promise: Promise) -> Void in
        do {
						let requestPayload = try RetenoEvent.buildEventPayload(payload: payload);
					
            Reteno.logEvent(
                eventTypeKey: requestPayload.eventName,
                date: requestPayload.date,
                parameters: requestPayload.parameters,
                forcePush: requestPayload.forcePush
            );
					
						promise.resolve(["success":true]);
        } catch {
						promise.reject("100", "Reteno iOS SDK Error");
        }
    }
		
		AsyncFunction("logScreenView") { (screenName: String, promise: Promise) -> Void in
				Reteno.logEvent(
						eventTypeKey: "screenView",
						date: Date(),
						parameters: [Event.Parameter(name: "screenView", value: screenName)],
				);

				promise.resolve(["success":true]);
		}
		
		AsyncFunction("forcePushData") { (promise: Promise) -> Void in
				Reteno.logEvent(
						eventTypeKey: "",
						date: Date(),
						parameters: [],
						forcePush: true
				);

				promise.resolve(["success":true]);
		}
		
		
  }

  @objc
  func handleIncomingNotification(_ notification: Notification) {
    sendEvent("onPushNotificationReceived", [
      "payload": notification.userInfo
    ])
  }

  @objc
	func getStringOrNil(input userInput: String?) -> String {
		let value = (userInput ?? "").isEmpty ? "" : String(userInput ?? "")
		return String(value)
	}
}
