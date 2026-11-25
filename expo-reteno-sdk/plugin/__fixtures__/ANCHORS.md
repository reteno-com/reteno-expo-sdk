# Anchor analysis

Generated from the fixtures in this directory (`ios/fixture/AppDelegate.swift`, `android/build.gradle`, `android/app/build.gradle`). Count = number of matching lines; the line shown is the first match. Regexes are the ones the plugin uses (`expo-reteno-sdk/plugin/src/support/ios.functions.ts`, `constants.ts`); A6 and A7 are the proposed anchors.

| Anchor | sdk-54 | sdk-55 | sdk-56 | sdk-57 | sdk-57-scene | sdk-58 |
|---|---|---|---|---|---|---|
| A1 @main|@UIApplicationMain | 1: `L5: @UIApplicationMain` | 1: `L5: @main` | 1: `L5: @main` | 1: `L5: @main` | 1: `L5: @main` | 1: `L5: @main` |
| A2 super.application(didFinish) | 1: `L32: return super.application(application, didFinishLaunchingWithOptions: launchOptions)` | 1: `L31: return super.application(application, didFinishLaunchingWithOptions: launchOptions)` | 1: `L31: return super.application(application, didFinishLaunchingWithOptions: launchOptions)` | 1: `L31: return super.application(application, didFinishLaunchingWithOptions: launchOptions)` | 1: `L23: return super.application(application, didFinishLaunchingWithOptions: launchOptions)` | 1: `L25: return super.application(application, didFinishLaunchingWithOptions: launchOptions)` |
| A3 public override func application | 3: `L12: public override func application(` | 3: `L12: public override func application(` | 3: `L12: public override func application(` | 3: `L12: public override func application(` | 3: `L12: public override func application(` | 1: `L12: public override func application(` |
| A4 import Expo | 1: `L1: import Expo` | 1: `L1: internal import Expo` | 1: `L1: internal import Expo` | 1: `L1: internal import Expo` | 1: `L1: internal import Expo` | 1: `L1: internal import Expo` |
| A5 factory.startReactNative( | 1: `L26: factory.startReactNative(` | 1: `L25: factory.startReactNative(` | 1: `L25: factory.startReactNative(` | 1: `L25: factory.startReactNative(` | 0 | 0 |
| A6 reactNativeFactory = factory | 1: `L21: reactNativeFactory = factory` | 1: `L21: reactNativeFactory = factory` | 1: `L21: reactNativeFactory = factory` | 1: `L21: reactNativeFactory = factory` | 1: `L21: reactNativeFactory = factory` | 1: `L21: reactNativeFactory = factory` |
| A7 bindReactNativeFactory(factory) | 1: `L22: bindReactNativeFactory(factory)` | 0 | 0 | 0 | 0 | 0 |
| G1 root dependencies { | 1: `L8: dependencies {` | 1: `L8: dependencies {` | 1: `L8: dependencies {` | 1: `L8: dependencies {` | 1: `L8: dependencies {` | 1: `L8: dependencies {` |
| G2 app react-android | 1: `L157: implementation("com.facebook.react:react-android")` | 1: `L157: implementation("com.facebook.react:react-android")` | 1: `L157: implementation("com.facebook.react:react-android")` | 1: `L157: implementation("com.facebook.react:react-android")` | 1: `L157: implementation("com.facebook.react:react-android")` | 1: `L157: implementation("com.facebook.react:react-android")` |

## Notes

- **Matches that changed meaning:** `@UIApplicationMain` in sdk-54 vs `@main` in sdk-55+; `import Expo` (A4) matches `internal import Expo` from sdk-55 on (substring match, still 1 hit).
- **`public override func application` (A3)** is 3 matches up to sdk-57, but 1 in sdk-58 (the template no longer overrides open-URL / continue-userActivity; only `didFinishLaunchingWithOptions` remains).
- **`bindReactNativeFactory(factory)` (A7)** exists only in sdk-54. Starting with sdk-55 the template no longer calls it, and `ExpoAppDelegate` (`node_modules/expo/ios/AppDelegates/ExpoAppDelegate.swift` in 54–57; `node_modules/expo/ios/Expo/ExpoAppDelegate.swift` in 58) has no `bindReactNativeFactory` / `factory` property. A7 is therefore **not a valid anchor for 55+**.
- **`reactNativeFactory = factory` (A6)** is still present in every AppDelegate template (1 match) — it is the stored-property assignment in the template, not an Expo API.
- **`factory.startReactNative(` (A5)**:
  - sdk-54 to sdk-57 (default): in `AppDelegate.swift` inside `didFinishLaunchingWithOptions`.
  - sdk-57-scene: removed from `AppDelegate.swift`. Window creation and `startReactNative` move to `ExpoAppSceneDelegate.swift`, `willConnectTo session:` (`node_modules/expo/ios/AppDelegates/ExpoAppSceneDelegate.swift` in 57; `node_modules/expo/ios/Expo/ExpoAppSceneDelegate.swift` in 58). `Info.plist` gets a `UIApplicationSceneManifest` with `UISceneDelegateClassName = EXExpoAppSceneDelegate`.
  - sdk-58: removed from `AppDelegate.swift` (0 matches). The fixture's `ios/fixture/SceneDelegate.swift` is a subclass of `ExpoAppSceneDelegate` with only a comment; startup happens in the base class `ExpoAppSceneDelegate`.
- **Gradle:** `dependencies {` (G1) first matches line 8 of the root `buildscript` block in every variant, so the plugin currently inserts into `buildscript.dependencies`. `implementation("com.facebook.react:react-android")` (G2) is at app `build.gradle` line 157 in every variant.
- Anchors were not validated against the plugin's actual runtime behavior; these are text-match counts only.
