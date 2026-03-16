import ExpoModulesCore
import Reteno
import Foundation

enum InAppSource {
	case displayRules
	case pushNotification
	
	var value: String {
		switch self {
		case .displayRules:
			return "DISPLAY_RULES"
		case .pushNotification:
			return "PUSH_NOTIFICATION"
		}
	}
}

struct InAppDataPayload {
	let id: String? = ""
	let source: InAppSource? = .displayRules
}

enum RetenoExpoEvent {
	case onPushNotificationReceived
	case onPushNotificationClicked
	case onPushButtonClicked
	case inAppCustomDataReceived
	case beforeInAppDisplay
	case onInAppDisplay
	case beforeInAppClose
	case afterInAppClose
	case onInAppError
	case unreadMessagesCount

	var value: String {
		switch self {
			/// Push Notifications
			case .onPushNotificationReceived :
				return "reteno-push-received"
			case .onPushNotificationClicked :
				return "reteno-push-clicked"
			case .onPushButtonClicked :
				return "reteno-push-button-clicked"
			/// Link handler
			case .inAppCustomDataReceived:
				return "reteno-in-app-custom-data-received"
			/// In-App Events
			case .beforeInAppDisplay:
				return "reteno-before-in-app-display"
			case .onInAppDisplay:
				return "reteno-on-in-app-display"
			case .beforeInAppClose:
				return "reteno-before-in-app-close"
			case .afterInAppClose:
				return "reteno-after-in-app-close"
			case .onInAppError:
				return "reteno-on-in-app-error"
			/// App Inbox
			case .unreadMessagesCount:
				return "reteno-unread-messages-count"
		}
	}
}

public class ExpoRetenoSdkModule: Module {
	// Each module class must implement the definition function. The definition consists of components
	// that describes the module's functionality and behavior.
	// See https://docs.expo.dev/modules/module-api for more details about available components.
	private static let autoOpenLinksKey = "RetenoAutoOpenLinks"
	
	private static var autoOpenLinks: Bool {
			get {
					if UserDefaults.standard.object(forKey: autoOpenLinksKey) == nil {
							return true // default value
					}
					return UserDefaults.standard.bool(forKey: autoOpenLinksKey)
			}
			set {
					UserDefaults.standard.set(newValue, forKey: autoOpenLinksKey)
			}
	}
	
	public func definition() -> ModuleDefinition {
		// Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
		// Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
		// The module will be accessible from `requireNativeModule('ExpoSdk')` in JavaScript.
		
		Name("ExpoRetenoSdk")
		
		Events(
			RetenoExpoEvent.onPushNotificationReceived.value,
			RetenoExpoEvent.onPushNotificationClicked.value,
			RetenoExpoEvent.onPushButtonClicked.value,
			RetenoExpoEvent.beforeInAppDisplay.value,
			RetenoExpoEvent.onInAppDisplay.value,
			RetenoExpoEvent.beforeInAppClose.value,
			RetenoExpoEvent.afterInAppClose.value,
			RetenoExpoEvent.onInAppError.value,
			RetenoExpoEvent.unreadMessagesCount.value
		)
		
		OnCreate {
			// Listen for link events from AppDelegate via NotificationCenter (cold start support)
			NotificationCenter.default.addObserver(
					self,
					selector: #selector(handleLinkReceived(_:)),
					name: NSNotification.Name("RetenoLinkReceived"),
					object: nil
			)

			// Fallback: set link handler for clients who don't add it in AppDelegate
			// If AppDelegate already set a handler, this overrides it — which is fine,
			// because cold start links were already handled by AppDelegate's handler
			Reteno.addLinkHandler { linkInfo in
				self.sendEvent(
					RetenoExpoEvent.inAppCustomDataReceived.value,
					["body": [
						"customData": linkInfo.customData as Any,
						"url": linkInfo.url?.absoluteString as Any
					]]
				)
					
					if ExpoRetenoSdkModule.autoOpenLinks, let url = linkInfo.url {
							UIApplication.shared.open(url)
					}
			}
			
			print(RetenoExpoEvent.onPushNotificationReceived.value)
			
			Reteno.userNotificationService.didReceiveNotificationUserInfo = { userInfo in
				self.sendEvent(
					RetenoExpoEvent.onPushNotificationReceived.value,
					userInfo as! [String : Any?]
				)
			}
			
			Reteno.userNotificationService.didReceiveNotificationResponseHandler = { response in
				self.sendEvent(
					RetenoExpoEvent.onPushNotificationClicked.value,
					response.notification.request.content.userInfo as! [String : Any?]
				)
			}
			
			Reteno.userNotificationService.notificationActionHandler = { userInfo, action in
				let actionId = action.actionId
				let customData = action.customData
				let actionLink = action.link
				
				self.sendEvent(
					RetenoExpoEvent.onPushButtonClicked.value,
					[
						"userInfo": userInfo,
						"actionId": actionId,
						"customData": customData as Any,
						"actionLink": actionLink as Any
					]
				)
			}
		}
		
		// OnDestroy {
			//			print("OnDestroy")
			//			NotificationCenter.default.removeObserver(
			//				self,
			//				name: .pushReceived,
			//				object: nil
			//			)
		// }
		
    // Push notifications
		AsyncFunction("setDeviceToken") { (deviceToken: String, promise: Promise) -> Void in
			promise.resolve(
				Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
			);
		}
		
		AsyncFunction("registerForRemoteNotifications") { () -> Void in
			Reteno.userNotificationService.registerForRemoteNotifications(
				with: [.sound, .alert, .badge],
			)
		}
		
		AsyncFunction("getInitialNotification") { (promise: Promise) -> Void in
			var initialNotif: Any? = nil;
			//				let remoteUserInfo = bridge.launchOptions?[UIApplication.LaunchOptionsKey.remoteNotification];
			//
			//				if (remoteUserInfo != nil) {
			//						initialNotif = remoteUserInfo;
			//				}
			
			if (initialNotif != nil) {
				promise.resolve(initialNotif);
			} else {
				promise.resolve(nil);
			}
		}
		
    // User information
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
		
    // User behaviour
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
		
    // Recommendations
		AsyncFunction("getRecommendations") { (payload: [String: Any], promise: Promise) -> Void in
			guard let recomVariantId = payload["recomVariantId"] as? String,
						let productIds = payload["productIds"] as? [String],
						let categoryId = payload["categoryId"] as? String,
						let filters = payload["filters"] as? [NSDictionary],
						let fields = payload["fields"] as? [String] else {
				
				promise.reject("100", "Reteno iOS SDK Error: Invalid payload")
				return
			}
			
			var recomFilters: [RecomFilter]? = nil
			if let filters = filters as? [[String: Any]] {
				recomFilters = filters.compactMap { dict in
					guard let name = dict["name"] as? String, let values = dict["values"] as? [String] else {
						return nil
					}
					return RecomFilter(name: name, values: values)
				}
			}
			
			Reteno.recommendations().getRecoms(
				recomVariantId: recomVariantId,
				productIds: productIds,
				categoryId: categoryId,
				filters: recomFilters,
				fields: fields
			) { (result: Result<[Recommendation], Error>) in
				switch result {
				case .success(let recommendations):
					let serializedRecommendations = recommendations.map { recommendation in
						return [
							"productId": 	recommendation.productId,
							"name": 				recommendation.name,
							"description": recommendation.description ?? "",
							"imageUrl": 		recommendation.imageUrl?.absoluteString ?? "",
							"price": 			recommendation.price
						]
					}
					promise.resolve(serializedRecommendations)
					
				case .failure(_):
					promise.reject("100", "Reteno iOS SDK getRecommendations Error")
				}
			}
		}
		
		AsyncFunction("logRecommendationEvent") { (payload: [String: Any], promise: Promise) -> Void in
			guard let recomVariantId = payload["recomVariantId"] as? String,
						let impressions = payload["impressions"] as? [[String: Any]],
						let clicks = payload["clicks"] as? [[String: Any]],
						let forcePush = payload["forcePush"] as? Bool else {
				
				promise.reject("100", "Reteno iOS SDK logRecommendationEvent Error")
				return
			}
			
			var impressionEvents: [RecomEvent] = []
			var clickEvents: [RecomEvent] = []
			
			for impression in impressions {
				let productId = impression["productId"] as? String
				impressionEvents.append(RecomEvent(date: Date(), productId: productId ?? ""))
			}
			
			for click in clicks {
				let productId = click["productId"] as? String
				clickEvents.append(RecomEvent(date: Date(), productId: productId ?? ""))
			}
			
			Reteno.recommendations().logEvent(
				recomVariantId: recomVariantId,
				impressions: impressionEvents,
				clicks: clickEvents,
				forcePush: forcePush
			)
			
			let res: [String: Bool] = ["success": true]
			promise.resolve(res)
		}

    // In-App messages
		AsyncFunction("pauseInAppMessages") { (state: Bool, promise: Promise) -> Void in
			Reteno.pauseInAppMessages(isPaused: state);
			promise.resolve(true)
		}
		
		Function("setInAppLifecycleCallback") { () -> Void in
			Reteno.addInAppStatusHandler { inAppMessageStatus in
				switch inAppMessageStatus {
				case .inAppShouldBeDisplayed:
					self.sendEvent(RetenoExpoEvent.beforeInAppDisplay.value, [:])
				case .inAppIsDisplayed:
					self.sendEvent(RetenoExpoEvent.onInAppDisplay.value, [:])
				case .inAppShouldBeClosed(let action):
					self.sendEvent(RetenoExpoEvent.beforeInAppClose.value, [ "action": action ] )
				case .inAppIsClosed(let action):
					self.sendEvent(RetenoExpoEvent.afterInAppClose.value, [ "action": action ] )
				case .inAppReceivedError(let error):
					self.sendEvent(RetenoExpoEvent.onInAppError.value, [ "error": error ] )
				}
			}
		}

    // App inbox messages
		
		AsyncFunction("getAppInboxMessages") { (payload: [String: Any?], promise: Promise) -> Void in
			let page = payload["page"] as? Int
			let pageSize = payload["pageSize"] as? Int
			let statusString = payload["status"] as? String
			
			let status: AppInboxMessagesStatus? = {
				switch statusString?.uppercased() {
				case "OPENED":
					return .opened
				case "UNOPENED":
					return .unopened
				default:
					return nil
				}
			}()
			
			Reteno.inbox().downloadMessages(page: page, pageSize: pageSize, status: status) { result in
				switch result {
				case .success(let response):
					let messages = response.messages.map { message in
						return [
							"id": message.id,
							"createdDate": message.createdDate?.timeIntervalSince1970 as Any,
							"title": message.title as Any,
							"content": message.content as Any,
							"imageURL": message.imageURL?.absoluteString as Any,
							"linkURL": message.linkURL?.absoluteString as Any,
							"isNew": message.isNew,
						]
					}
					promise.resolve(["messages": messages, "totalPages": response.totalPages as Any])
					
				case .failure(let error):
					print("[ERROR] Download messages: \(error)")
					promise.reject("100", "Reteno iOS SDK downloadMessages Error")
				}
			}
		}
		
		Function("startListeningForUnreadMessages") { () -> Void in
      print("@@@ onUnreadMessagesCountChanged()")
			Reteno.inbox().onUnreadMessagesCountChanged = { count in
				self.sendEvent(
					RetenoExpoEvent.unreadMessagesCount.value,
					["count": count]
				)
			}
		}
		
		AsyncFunction("markAsOpened") { (messageIds: [String], promise: Promise) -> Void in
			Reteno.inbox().markAsOpened(messageIds: messageIds) { result in
				switch result {
				case .success:
					promise.resolve(true)
				case .failure(let error):
					print("[ERROR] markAsOpened(): \(error)")
					promise.reject("100", "Reteno iOS SDK markAsOpened Error")
				}
			}
		}
		
		AsyncFunction("markAllAsOpened") { (promise: Promise) -> Void in
			Reteno.inbox().markAllAsOpened { result in
				switch result {
				case .success:
					promise.resolve(true)
				case .failure(let error):
					print("[ERROR] markAllAsOpened(): \(error)")
					promise.reject("100", "Reteno iOS SDK markAllAsOpened Error")
				}
			}
		}
		
		AsyncFunction("getAppInboxMessagesCount") { (promise: Promise) -> Void in
			Reteno.inbox().getUnreadMessagesCount { result in
				switch result {
				case .success(let unreadCount):
					promise.resolve(unreadCount)
				case .failure(let error):
					print("[ERROR] getAppInboxMessagesCount(): \(error)")
					promise.reject("100", "Reteno iOS SDK getAppInboxMessagesCount Error")
				}
			}
		}

    // Ecommerce events
		AsyncFunction("logEcomEventProductViewed", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let data = RetenoEcomEvent.buildProductDataFromPayload(payload as [String : Any]) else {
					promise.reject("Payload Error", "Payload cannot be null")
					return
			}
			
			do {
					Reteno.ecommerce().logEvent(type: .productViewed(product: data.product, currencyCode: data.currencyCode),
																			date: Date(),
																			forcePush: true)
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		AsyncFunction("logEcomEventProductCategoryViewed", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let category = RetenoEcomEvent.buildProductCategoryDataFromPayload(payload as [String : Any]) else {
						promise.reject("Payload Error", "Payload cannot be null")
							return
					}
					
					do {
							Reteno.ecommerce().logEvent(type: .productCategoryViewed(category: category),
																					date: Date(),
																					forcePush: true)
						promise.resolve(["success": true])
					} catch {
						promise.reject("Reteno iOS SDK Error", error.localizedDescription)
					}
		})
		
		AsyncFunction("logEcomEventProductAddedToWishlist", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let data = RetenoEcomEvent.buildProductDataFromPayload(payload as [String : Any]) else {
				promise.reject("Payload Error", "Payload cannot be null")
				return
			}
			
			do {
				Reteno.ecommerce().logEvent(type: .productAddedToWishlist(product: data.product, currencyCode: data.currencyCode),
																		date: Date(),
																		forcePush: true)
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		AsyncFunction("logEcomEventCartUpdated", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let data = RetenoEcomEvent.buildCartUpdatedDataFromPayload(payload as [String : Any]) else {
				promise.reject("Payload Error", "Payload cannot be null")
					return
			}
			
			do {
					Reteno.ecommerce().logEvent(type: .cartUpdated(
							cartId: data.cartId,
							products: data.products,
							currencyCode: data.currencyCode
					),
																			date: Date(),
																			forcePush: true)
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		AsyncFunction("logEcomEventOrderCreated", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let data = RetenoEcomEvent.buildOrderDataFromPayload(payload as [String : Any]) else {
				promise.reject("Payload Error", "Payload cannot be null")
				return
			}
			do {
				Reteno.ecommerce().logEvent(type: .orderCreated(order: data.order, currencyCode: data.currencyCode),
																		date: Date(),
																		forcePush: true)
				
				
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		AsyncFunction("logEcomEventOrderUpdated", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let data = RetenoEcomEvent.buildOrderDataFromPayload(payload as [String : Any]) else {
				promise.reject("Payload Error", "Payload cannot be null")
				return
			}
			
			do {
				Reteno.ecommerce().logEvent(type: .orderUpdated(order: data.order, currencyCode: data.currencyCode),
																		date: Date(),
																		forcePush: true)
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		AsyncFunction("logEcomEventOrderDelivered", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let externalOrderId = RetenoEcomEvent.buildOrderExternalIdFromPayload(payload as [String : Any]) else {
				promise.reject("Payload Error", "Payload cannot be null")
					return
			}
			
			do {
					Reteno.ecommerce().logEvent(type: .orderDelivered(externalOrderId: externalOrderId))
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		AsyncFunction("logEcomEventOrderCancelled", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let externalOrderId = RetenoEcomEvent.buildOrderExternalIdFromPayload(payload as [String : Any]) else {
				promise.reject("Payload Error", "Payload cannot be null")
				return
			}
			
			do {
				Reteno.ecommerce().logEvent(type: .orderCancelled(externalOrderId: externalOrderId),
																		date: Date(),
																		forcePush: true)
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		AsyncFunction("logEcomEventSearchRequest", { ( payload: [String: Any?], promise: Promise ) -> Void in
			guard let data = RetenoEcomEvent.buildSearchRequestDataFromPayload(payload as [String : Any]) else {
				promise.reject("Payload Error", "Payload cannot be null")
				return
			}
			do {
				Reteno.ecommerce().logEvent(type: .searchRequest(query: data.searchQuery, isFound: data.isFound))
				promise.resolve(["success": true])
			} catch {
				promise.reject("Reteno iOS SDK Error", error.localizedDescription)
			}
		})
		
		// TODO: should it be refactored to default getter/setter?
		// -------------------------------------------------------
		AsyncFunction("setAutoOpenLinks") { (state: Bool, promise: Promise) -> Void in
				ExpoRetenoSdkModule.autoOpenLinks = state
				promise.resolve(true)
		}

		AsyncFunction("getAutoOpenLinks") { (promise: Promise) -> Void in
			promise.resolve(ExpoRetenoSdkModule.autoOpenLinks)
		}
		// -------------------------------------------------------
	}

	@objc
	func handleLinkReceived(_ notification: Notification) {
			guard let userInfo = notification.userInfo else { return }
		sendEvent(
			RetenoExpoEvent.inAppCustomDataReceived.value,
			["body": userInfo]
		)
	}
	
		@objc
		func getStringOrNil(input userInput: String?) -> String {
			let value = (userInput ?? "").isEmpty ? "" : String(userInput ?? "")
			return String(value)
		}
	}
