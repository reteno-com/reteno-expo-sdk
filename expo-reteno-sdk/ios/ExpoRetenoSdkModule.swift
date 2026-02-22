import ExpoModulesCore
import Reteno
import Foundation


struct RetenoUserAttributesField: Record {
    @Field var key: String = ""
    @Field var value: String = ""
}

struct RetenoUserAttributesAddress: Record {
    @Field var region: String? = ""
    @Field var town: String? = ""
    @Field var address: String? = ""
    @Field var postcode: String? = ""
}

struct RetenoUserAttributes: Record {
    @Field var phone: String? = ""
    @Field var email: String? = ""
    @Field var firstName: String? = ""
    @Field var lastName: String? = ""
    @Field var languageCode: String? = ""
    @Field var timeZone: String? = ""
    @Field var address: RetenoUserAttributesAddress?
    @Field var fields: [RetenoUserAttributesField]?
}

struct RetenoAnonymousUserAttributes: Record {
    @Field var firstName: String? = ""
    @Field var lastName: String? = ""
    @Field var timeZone: String? = ""
    @Field var fields: [RetenoUserAttributesField]?
}

struct RetenoUser: Record {
    @Field var user: RetenoUserAttributes?
    @Field var subscriptionKeys: [String]?
    @Field var groupNamesInclude: [String]?
    @Field var groupNamesExclude: [String]?
}

struct RetenoUserAttributesPayload: Record {
    @Field var externalUserId: String = ""
		@Field var userAttributes: RetenoUserAttributes?
		@Field var subscriptionKeys: [String]?
		@Field var groupNamesInclude: [String]?
		@Field var groupNamesExclude: [String]?
}

struct RetenoMultiAccountUserAttributesPayload: Record {
		@Field var externalUserId: String = ""
		@Field var userAttributes: RetenoUserAttributes?
		@Field var subscriptionKeys: [String]?
		@Field var groupNamesInclude: [String]?
		@Field var groupNamesExclude: [String]?
		@Field var accountSuffix: String? = nil
}

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

    AsyncFunction("updateUserAttributes") { (
        payload: RetenoUserAttributesPayload,
        promise: Promise
    ) -> Void in
			do {
				let fields = (payload.userAttributes?.fields ?? []).map { (f: RetenoUserAttributesField ) in
					UserCustomField(key: f.key, value: f.value )
				}
				
				let userAttributes = UserAttributes(
					phone: getStringOrNil(input: payload.userAttributes?.phone),
					email: getStringOrNil(input: payload.userAttributes?.email),
					firstName: getStringOrNil(input: payload.userAttributes?.firstName),
					lastName: getStringOrNil(input: payload.userAttributes?.lastName),
					languageCode: getStringOrNil(input: payload.userAttributes?.languageCode),
					timeZone: getStringOrNil(input: payload.userAttributes?.timeZone),
					address: payload.userAttributes?.address != nil ? Address(
						region: getStringOrNil(input: payload.userAttributes?.address?.region),
						town: getStringOrNil(input: payload.userAttributes?.address?.town),
						address: getStringOrNil(input: payload.userAttributes?.address?.address),
						postcode: getStringOrNil(input: payload.userAttributes?.address?.postcode)
					) : nil,
					fields: fields ?? []
				)
				
				Reteno.updateUserAttributes(
					externalUserId: payload.externalUserId,
					userAttributes: userAttributes,
					subscriptionKeys: payload.subscriptionKeys ?? [],
					groupNamesInclude: payload.groupNamesInclude ?? [],
					groupNamesExclude: payload.groupNamesExclude ?? []
				)
				
				promise.resolve(["success": true])
			} catch {
				promise.reject("500", "Reteno Expo SDK Error")
			}
    }

    AsyncFunction("updateAnonymousUserAttributes") { (
        attributes: RetenoUserAttributes?,
				promise: Promise
    ) -> Void in
			do {
				let fields = (attributes?.fields ?? []).map { (field: RetenoUserAttributesField ) in
					UserCustomField(key: field.key, value: field.value )
				}
				
				let userAttributes = AnonymousUserAttributes(
					firstName: getStringOrNil(input: attributes?.firstName),
					lastName: getStringOrNil(input: attributes?.lastName),
					timeZone: getStringOrNil(input: attributes?.timeZone),
					fields: fields ?? []
				)
				
				Reteno.updateAnonymousUserAttributes(
					userAttributes: userAttributes
				)
				
				promise.resolve(["success": true])
			} catch {
				promise.reject("500", "Reteno Expo SDK Error")
			}
    }
		
		AsyncFunction("updateMultiAccountUserAttributes") { (
        payload: RetenoMultiAccountUserAttributesPayload,
        promise: Promise
    ) -> Void in
			do {
				let fields = (payload.userAttributes?.fields ?? []).map { (f: RetenoUserAttributesField ) in
					UserCustomField(key: f.key, value: f.value )
				}
				
				let userAttributes = UserAttributes(
					phone: getStringOrNil(input: payload.userAttributes?.phone),
					email: getStringOrNil(input: payload.userAttributes?.email),
					firstName: getStringOrNil(input: payload.userAttributes?.firstName),
					lastName: getStringOrNil(input: payload.userAttributes?.lastName),
					languageCode: getStringOrNil(input: payload.userAttributes?.languageCode),
					timeZone: getStringOrNil(input: payload.userAttributes?.timeZone),
					address: payload.userAttributes?.address != nil ? Address(
						region: getStringOrNil(input: payload.userAttributes?.address?.region),
						town: getStringOrNil(input: payload.userAttributes?.address?.town),
						address: getStringOrNil(input: payload.userAttributes?.address?.address),
						postcode: getStringOrNil(input: payload.userAttributes?.address?.postcode)
					) : nil,
					fields: fields ?? []
				)
				
				Reteno.updateMultiAccountUserAttributes(
					externalUserId: payload.externalUserId,
					userAttributes: userAttributes,
					subscriptionKeys: payload.subscriptionKeys ?? [],
					groupNamesInclude: payload.groupNamesInclude ?? [],
					groupNamesExclude: payload.groupNamesExclude ?? [],
					accountSuffix: getStringOrNil(input: payload.accountSuffix)
				)
				
				promise.resolve(["success": true])
			} catch {
				promise.reject("500", "Reteno Expo SDK Error")
			}
    }

    AsyncFunction("setDeviceToken") { (deviceToken: String, promise: Promise) -> Void in
        promise.resolve(
            Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
        );
    }
  }

  @objc
  func handleIncomingNotification(_ notification: Notification) {
    print("Notification: \(notification.userInfo)")
    sendEvent("onPushNotificationReceived", [
      "payload": notification.userInfo
    ])
  }

  @objc
	func getStringOrNil(input userInput: String?) -> String {
		let value = (userInput ?? "").isEmpty ? "" : String(userInput ?? "")
		return String(value)
	}
	
	func getUserAttributes(payload p: RetenoUserAttributesPayload) {
		
	}
}
