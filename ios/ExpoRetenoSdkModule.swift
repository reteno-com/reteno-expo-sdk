import ExpoModulesCore
import Reteno

public class ExpoRetenoSdkModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoRetenoSdk')` in JavaScript.
    Name("ExpoRetenoSdk")

    Function("start") { (key: String) -> Void in
        Reteno.start(apiKey: key)
    }

    Function("requestPermission") { () -> Void in
        Reteno.userNotificationService.registerForRemoteNotifications(
            with: [.sound, .alert, .badge], 
        )
    }
  }
}
