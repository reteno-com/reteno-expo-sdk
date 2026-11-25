# expo-reteno-sdk 3.0.0 — Expo SDK 54–58 Upgrade Workflow

Status: draft (rev. 2) · Prepared: 2026-11-16 · Baseline: v2.5.3 (`be12333`)

Legend: **[code]** verified in this repo · **[source]** official Expo changelogs/templates/guides · **[to verify]** must be confirmed by a fixture or build.

---

## 1. Decision

```json
"peerDependencies": {
  "expo": ">=54.0.0 <59.0.0",
  "react": "*",
  "react-native": "*"
}
```

Release as **3.0.0**. The primary reason is the peer floor: declared support for Expo SDK 51–53 is removed. Other changes (scene-aware AppDelegate integration, Android Gradle plugin migration) are not breaking on their own. If validation forces a platform/toolchain bump (e.g. iOS deployment target), it becomes an additional breaking reason and must be listed in the changelog.

**Floor = 54.** Expo 54 remains supported to preserve the current installed base and tested baseline, despite the additional compatibility cost. Dropping 54 would simplify:

- no Legacy Architecture;
- single iOS minimum (16.4);
- newer Swift/Gradle toolchains only;
- smaller build matrix;
- no need to support the older AppDelegate template.

Adoption data for 54 among Reteno customers should be checked internally before final sign-off.

**Expo 54 support scope.** Expo 54 is outside or at the end of its upstream maintenance window; Reteno support is compatibility-only and does not imply upstream Expo maintenance. Support applies to the toolchain recommended for Expo 54 (Xcode/iOS SDK and JDK recorded in §5.6). Building Expo 54 apps with Xcode 27 / iOS 27 SDK is not promised unless explicitly tested.

**Architecture on 54.** Decision: test both. Result: plugin and Android build work on Legacy; iOS Legacy fails on Xcode 26.6 inside the third-party `fmt` pod (`consteval`), identically with 2.5.4 on a clean project, so it is documented in the README and not treated as an SDK regression.

**Target range is provisional.** It is confirmed only after the demo app passes testing on every Expo SDK 54–58 without regressions (Step 6). If a regression cannot be avoided, the range is narrowed after a team discussion and the remaining SDKs are delivered in separate releases.

**Upper bound = <59.** Conservative policy; each new Expo SDK gets a minor release after passing the matrix. The range admits early patches of each major while only the latest patch is tested, so README must say: *"Use the latest available patch release within the selected Expo SDK major."*

---

## 2. Current state (v2.5.3)

| Item | Value |
|---|---|
| peerDependencies | `expo >=51.0.0`, `react`/`react-native: *` |
| devDependencies / TestApp | expo 54.0.x, RN 0.81.5, React 19.1.0 |
| iOS podspec | platform 15.1, `swift_version 5.9`, Reteno 2.7.7 |
| Android module | legacy `apply from: ExpoModulesCorePlugin.gradle` pattern; compile/target 36, minSdk 24; Reteno 2.11.0; explicit `firebase-messaging:23.1.0`; `lintOptions` |
| TestApp | `newArchEnabled=true`, Swift AppDelegate with `ExpoReactNativeFactory`, `android.googleServicesFile` set, iOS `notificationService: "apns"` |

Findings **[code]**:

- Since v2.0.0 (commit `3fab8e9`) the iOS plugin inserts init code before `factory.startReactNative(` (`plugin/src/support/ios.functions.ts`). Missing anchor → prebuild throws `ERR_NO_MATCH`.
- The anchor `public override func application` matches several methods in the standard AppDelegate; the plugin silently uses the first one.
- `withFirebasePodfileUpdate` swallows Podfile errors via `.catch(console.error)`; Firebase pods added to the Podfile are not removed when switching to APNs with `--no-clean`.
- `expo-modules-core` 3.0.29 (SDK 54) still ships `android/ExpoModulesCorePlugin.gradle` with the legacy helpers, so the current Gradle file builds on 54. Other SDK 54 modules (e.g. `expo-application`) already use `plugins { id 'expo-module-gradle-plugin' }`.
- The library `android/build.gradle` already declares Reteno + Firebase Messaging, but the plugin also injects them into the consumer `app/build.gradle`. TestApp still has stale `com.reteno:*:2.10.2` and `firebase-messaging-ktx` there.
- Expo already adds the Google Services classpath/plugin when `android.googleServicesFile` is set; the Reteno plugin adds another one → two classpaths (4.4.1 + 4.4.4) in TestApp root `build.gradle`.
- The plugin also forces `sourceCompatibility/targetCompatibility 1.8` and `android.useAndroidX` in the app.
- `ExpoAppDelegateSubscriber` is not used.

---

## 3. Expo SDK changes relevant to us

| SDK | Release / RN / React | Key changes | Impact on expo-reteno-sdk |
|---|---|---|---|
| 53 | RN 0.79 **[to verify]** | Swift AppDelegate + `ExpoReactNativeFactory` **[to verify]** | Not in the supported/tested range of 3.0.0. No claim that it is broken until a fixture shows it |
| 54 | RN 0.81 / React 19.1 | Last SDK allowing Legacy Architecture | Baseline; test both architectures |
| 55 | 2026-02-25 / RN 0.83 / React 19.2 **[source]** | Legacy Architecture removed; Expo Modules Core in Swift 6 language mode; iOS 15.1, Xcode 26.2; compile/target SDK 36; `NativeModule` no longer extends `Record<string, any>` | Check effective `SWIFT_VERSION` of our target; New Architecture runtime |
| 56 | 2026-05-21 / RN 0.85 / React 19.2.3 **[source]** | iOS min 16.4, Xcode 26.4; JSI layer replaced by `ExpoModulesJSI`; `EXNativeModulesProxy`/`ExpoBridgeModule` removed; native-module maintainers advised to move to iOS 16.4 | Issue #18 regression (e-commerce numbers); deployment targets of all targets |
| 57 | 2026-06-30 / RN 0.86 / React 19.2.3 **[source]** | `@ExpoModule`, `Module.emit`; Int outside JS safe range throws; prebuild cleans by default; `ios.enableSceneSupport` available in `expo@57.0.23+` and removes `factory.startReactNative(...)` from AppDelegate **[source]** ([scene lifecycle guide](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md)) | Reteno plugin behavior with the scene template **[to verify]** — current anchor is expected to break |
| 58 | 2026-10-15 / RN 0.88 / React 19.3 **[source]** | Scene-based lifecycle by default (driven by iOS 27 SDK requirements); Expo Modules 2.0 (annotation-based) in **beta**; AGP 9, Kotlin 2.2.21; Node ≥ 22.13; `hostingRuntimeContext`/`errorManager` removed; `JavaScriptValue` changes | Current iOS anchor breaks. Legacy lifecycle DSL expected to keep working **[to verify]** |

APIs we do not use **[code]**: `JavaScriptValue`, `errorManager`, `hostingRuntimeContext`, `executeOnJavaScriptThread`, `AndroidConfig.StatusBar`/`SystemBars`, app.json `notification` field.

Config Plugins API: according to the `@expo/config-plugins` changelog, nothing we use (`withAppDelegate`, `withDangerousMod`, `withXcodeProject`, `withProjectBuildGradle`, `AndroidConfig.Manifest`) was removed in 2026 **[source]**; confirm against installed package versions in fixtures **[to verify]**.

Templates for 55 and 58 **[source]**: Android root/app `build.gradle` remain **Groovy**; `implementation("com.facebook.react:react-android")` present; Podfile keeps `use_expo_modules!` and `podfile_properties`; AppDelegate keeps `@main`, `public override func application`, `super.application(`.

---

## 4. Scope

### 4.1 Known implementation work

1. **Scene-aware iOS startup integration** — current `factory.startReactNative(` anchor breaks on Expo 58 (default) and on 57.0.23+ with `enableSceneSupport: true`. Evaluate `ExpoAppDelegateSubscriber` first (§5.2).
2. **Precise iOS anchors and Podfile handling** — replace non-unique anchors; fail prebuild on Podfile errors; make Firebase ↔ APNs switching reversible.
3. **Android Gradle module migration** to `expo-module-gradle-plugin` plus AGP 9 hygiene.
4. **Minimal Android config plugin** — manifest-only; Google Services left to Expo's `android.googleServicesFile`.

### 4.2 Release validation gates

- Debug builds on all SDKs 54–58 (54 on Legacy and New Architecture).
- Release builds (iOS + Android with R8) on 54 (both architectures, if Legacy is supported) and 58.
- Runtime smoke on every SDK.
- Full on-device push run on 54 and 58: iOS APNs, iOS Firebase, Android FCM.
- Deployment targets consistent across app, pods and extensions.
- Idempotency and reversibility of prebuild.
- All SDKs tested with one packed npm tarball (same SHA-256), built and inspected before the matrix.
- Final full matrix 54–58 passed on a single release-candidate tarball with recorded SHA-256 (Step 7).
- `expo-doctor` result recorded for every SDK project.

---

## 5. Workflow

### Step 0 — Preparation

- [ ] Free **20–30 GB** of disk space (currently ~2.2 GB). Work with one reusable test project per SDK at a time; keep only fixtures, lockfiles and logs; delete generated build artifacts between SDKs; do not purge global caches without a separate decision.
- [ ] Run Metro on a different port (`--port 8082`); 8081 is used by an unrelated process.
- [ ] Commit or stash local TestApp changes (`app.config.js`, `PushNotificationsView.tsx`).
- [ ] Move `sdkAccessToken` out of `TestApp/app.json` into an environment variable read by `app.config.js`:
  - never print the key;
  - fail fast with a clear error for device-test builds when the key is missing;
  - allow a placeholder / no-key mode for compile-only fixtures;
  - never include the real key in fixtures, snapshots or CI logs.
  The key is already committed and is client-side (visible in built apps anyway); decide on rotation with the Reteno app owner, especially if the repository is public.
- [ ] Create branch `v3.0.0` (see Step 0.1 for the 2.x maintenance branch, which must exist before 3.0.0 is merged into `main`).

### Step 0.1 — 2.x maintenance branch

Before the 3.0.0 work is merged into `main` (i.e. before the 3.0.0 release), create a long-lived `v2.x` branch from `main`:

- [ ] Make sure the latest 2.x release (currently 2.5.3) is merged into `main` and tagged (`v2.5.3`).
- [ ] Create `v2.x` from that `main` commit and push it; protect it like `main` (PR + review required).
- [ ] Scope of `v2.x`: patch releases (2.5.x, or 2.6.x if a native SDK update needs a minor) for:
  - Reteno iOS SDK updates (podspec `Reteno` version, NSE/NCE compatibility);
  - Reteno Android SDK updates (`com.reteno:*` versions in the library `build.gradle` and plugin constants);
  - critical bug fixes that cannot wait for or be resolved by upgrading to 3.x.
  No new Expo SDK support and no new features on `v2.x`; peer range stays `expo >=51.0.0` (SemVer does not allow narrowing it within 2.x).
- [ ] README on `v2.x` must state honestly:
  - the declared peer range is unchanged;
  - maintenance builds are verified on Expo 54 only;
  - Expo 51–53 are not covered by the regression checks;
  - native SDK bumps must not raise platform minimums (iOS deployment target, Android minSdk); such a change requires a separate major.
- [ ] The demo app (`TestApp`) stays on `v2.x` with its current dependencies (Expo 54, RN 0.81.5, React 19.1.0) and is used to verify 2.x patches. Do not upgrade Expo on `v2.x`.
- [ ] Publishing from `v2.x` after 3.0.0 is released must not move the npm `latest` tag: publish with a separate dist-tag using the repo scripts, e.g. `npm run release:patch -- --npm.tag=v2-latest` (or `npx release-it patch --npm.tag=v2-latest`). npm dist-tag and GitHub "Latest release" are separate mechanisms: verify whether the installed `release-it` (^15.1.0) can create a GitHub release without marking it as latest; otherwise adjust the release in GitHub manually or upgrade `release-it`.
- [ ] Fixes relevant to both lines: land in `main` first, then cherry-pick to `v2.x` (or the reverse for native-SDK-only bumps), noting the cross-reference in both PRs.
- [ ] Document the support policy in README: 2.x receives Reteno native SDK updates and critical fixes until an agreed end-of-support date (to be decided by the team).

### Step 1 — Fixtures and discovery

- [ ] Generate a clean prebuild **without** our SDK for: 54, 55, 56, 57 default, 57 with `ios.enableSceneSupport: true`, 58. If 56 native files are identical to 55, the 56 fixture may be omitted with a note; the 56 project is still needed for build/regression runs.
- [ ] Store per fixture:
  - iOS: `AppDelegate.swift`, `SceneDelegate.swift`, app `Info.plist`, app entitlements, `Podfile`, `project.pbxproj`;
  - Android: root and app `build.gradle`, `settings.gradle`, `gradle.properties`, `AndroidManifest.xml`, `MainApplication.kt`;
  - the app config used for generation.
- [ ] After applying our plugin, additionally store NSE/NCE `Info.plist` and entitlements.
- [ ] Record Kotlin / AGP / Gradle / JDK / minSdk / Xcode for each SDK.
- [ ] Plugin-configuration variants (full set on 54 and 58):
  - iOS APNs; iOS Firebase;
  - automatic initialization (with `sdkAccessToken`); manual initialization (without);
  - notification icon/color present / absent;
  - debug mode true / false;
  - custom `appGroups`.
- [ ] Minimum variants on 57 with `enableSceneSupport: true` (the AppDelegate lifecycle changes there): automatic initialization, cold-start notification handler, APNs path.

### Step 2 — iOS startup integration

**2a. Spike: `ExpoAppDelegateSubscriber`** (recommended by Expo for libraries; composable and scene-aware).

- [ ] Instrument and record, on 54, 57 default, 57 scene and 58, the relative order of: React Native start, subscriber `didFinishLaunching`, module `OnCreate`, notification-handler installation, notification delivery. Do not assume an order in advance.
- [ ] Verify cold-start notification handling via the subscriber.
- [ ] On 54–57 classic templates, `super.application(...)` is called after `factory.startReactNative(...)`, so the subscriber may be too late for `ExpoRetenoSdkModule.delayedStart()` and the early notification-response handler. If so, keep the AppDelegate anchor for init.
- [ ] Where possible, move APNs/Firebase delegate methods (`didRegisterForRemoteNotificationsWithDeviceToken`, Firebase setup) into the subscriber.

**2b. Anchor-based init (if still needed after 2a)**

- [ ] Insert Reteno init right after `reactNativeFactory = factory` (present in classic and scene templates).
- [ ] Require **exactly one** match; fail with an explanatory error on 0 or >1.
- [ ] Verify via fixtures/runtime:
  - `delayedStart()` runs before module initialization;
  - the handler is installed before any notification response is delivered;
  - inserting before `bindReactNativeFactory(factory)` on 54 has no side effects;
  - the code runs exactly once.

**2c. Anchor audit**

- [ ] List every anchor in the iOS plugin and find non-unique ones (`public override func application` is known to be non-unique).
- [ ] Replace them with exact method signatures; only then enforce the exactly-one-match rule.

**2d. Podfile / Firebase**

- [ ] Audit Firebase pods added by the plugin: are all still needed, is `FirebaseMessaging` alone sufficient, are modular headers still required.
- [ ] Remove plugin-added Firebase pods when switching Firebase → APNs.
- [ ] Podfile modification errors must fail prebuild with a clear message (remove `.catch(console.error)`).

### Step 3 — Android

**3a. Library module (`expo-reteno-sdk/android/build.gradle`)**

- [ ] Migrate to:
  ```gradle
  plugins {
    id 'com.android.library'
    id 'expo-module-gradle-plugin'
  }
  ```
- [ ] AGP 9 hygiene: `lintOptions` → `lint {}`; decide whether explicit `react-android` and explicit compile/target/min SDK are needed; Kotlin/JVM target; release build with R8.
- [ ] Inspect the dependency graph (`./gradlew :expo-reteno-sdk:dependencies`): does `com.reteno:fcm` bring Firebase Messaging transitively; is explicit `firebase-messaging:23.1.0` needed; does it force a downgrade in an Expo 58 app.

**3b. Config plugin — target state**

Keep only:

- AndroidManifest meta-data;
- receivers;
- SDK key / debug flag;
- notification icon / color;
- a **warning only** (never a hard failure) if `android.googleServicesFile` is missing, so manually configured / bare apps keep working.

Docs explain that CNG users must set `android.googleServicesFile`; manual native Google Services configuration remains supported.

Remove:

- project `build.gradle` mutation;
- app `build.gradle` mutation;
- Google Services classpath / plugin injection (handled by Expo via `android.googleServicesFile`);
- Reteno / Firebase dependency injection;
- Java 8 compile options;
- manual `android.useAndroidX`.

**3c. Migration of existing native projects**

- [ ] Default migration path for users: one-time `npx expo prebuild --clean` (documented in the changelog).
- [ ] Optional cleanup during `--no-clean`, only if it can be made robust. The `// Reteno SDK dependencies` marker is the same in root and app Gradle files, so the implementation must:
  - locate the marker in the specific Gradle context (root `buildscript.dependencies` vs app `dependencies`);
  - remove only the exact known generated lines (old classpath / known dependency lines written by previous plugin versions);
  - never remove the whole `dependencies` block;
  - never remove arbitrary `com.reteno` or Firebase lines by regex (they may be user-added);
  - have a fixture with similar user-added dependencies;
  - be idempotent.
  If this proves fragile, skip cleanup entirely and require the one-time `--clean`.

### Step 4 — Native module

- [ ] **Legacy lifecycle DSL** (`OnCreate`, `OnStartObserving`, `OnStopObserving`): confirm compilation on 58 and that `OnStartObserving(event)` / `OnStopObserving(event)` actually toggle listener state at runtime. Migrate only if the compiler rejects the API (Modules 2.0 is beta in 58).
- [ ] **Swift**:
  - required: build in the effective `SWIFT_VERSION` of the `ExpoRetenoSdk` target (55 and 58);
  - recommended: forced Swift 6 mode as a forward-compatibility check. A failure only there is a follow-up, not a release blocker, unless Swift 6 compatibility is claimed.
- [ ] **Deployment targets**: verify app target, `ExpoRetenoSdk` pod, NSE, NCE, Reteno pod and Firebase pods. Ensure the plugin does not leave extension targets at 15.1 in 56–58 apps whose app target is 16.4. Keep podspec at 15.1 only if CocoaPods/Xcode builds succeed on 56–58; raising to 16.4 breaks 54/55 apps that stay on 15.1.

### Step 5 — Validation specification

> This step is a **specification**: it defines what is checked and the acceptance criteria. It is **executed in Step 6**, after packaging (6b), against the packed tarball. The only exception is §5.1 plugin tests, which also run in the repo during development.

#### 5.1 Plugin tests

- [ ] Integration tests: run the **compiled** config plugin against a temporary native project (from fixtures) and assert the combined result — AppDelegate, Podfile, Xcode targets, entitlements, Info.plist, AndroidManifest, Gradle. This catches mod ordering and interaction with Expo default plugins.
- [ ] Keep function-level unit tests for individual helpers.

#### 5.2 Idempotency

1. `npx expo prebuild --clean`;
2. save a hash/diff of `ios/` and `android/`;
3. run `npx expo prebuild --no-clean` twice;
4. after each run: no new diff, no duplicated targets, dependencies or handlers.

#### 5.3 Reversibility (`--no-clean`)

- APNs → Firebase → APNs;
- `sdkAccessToken` present → removed;
- icon/color present → removed;
- debug mode true → false;
- `appGroups` changed;
- plugin removed from app config (document which native changes disappear only after `--clean`).

#### 5.4 Runtime smoke (every SDK 54–58)

- automatic and manual initialization;
- JS → native call; native → JS event;
- listener attach/detach;
- integer and fractional e-commerce values;
- App Inbox basic method;
- in-app callback;
- notification permission status.

#### 5.5 Matrix

| SDK | Architecture | Debug build | Release build | Runtime smoke | Full push run |
|---|---|---|---|---|---|
| 54 | Legacy | Android ✓; iOS blocked by `fmt` + Xcode 26.6 (also fails on 2.5.4; not an SDK issue, documented in README) | Android R8 only | — | — |
| 54 | New | ✓ | ✓ (iOS + Android R8) | ✓ | ✓ |
| 55 | New | ✓ | — | ✓ + Swift diagnostics | — |
| 56 | New | ✓ | — | ✓ + #18 regression, deployment targets | — |
| 57 default | New | ✓ | — | ✓ | — |
| 57 `enableSceneSupport` | New | ✓ | — | ✓ | — |
| 58 | New | ✓ | ✓ (iOS + Android R8) | ✓ | ✓ |

The 54 Legacy row (including Release) is required only if Legacy Architecture on 54 is officially supported; otherwise drop the row and declare Expo 54 New Architecture only (§1).

Every SDK project additionally runs `npx expo-doctor@latest` after dependency install; record the result and any known exceptions in the report (separates Reteno issues from inconsistent Expo dependency sets).

Full push run = three separate configurations: **iOS APNs**, **iOS Firebase**, **Android FCM** (one iOS build cannot cover both iOS paths).

Scenarios: token registration; tap in foreground / background / killed state; initial notification on cold start; NSE rich media; NCE action buttons; deep link from push (scene-based cold start on 58); in-app; App Inbox; e-commerce; permission status; Android icon/color.

Acceptance evidence per scenario:

- correct token type (APNs vs FCM);
- contact registration in Reteno;
- delivered / clicked status in Reteno;
- exactly one callback, no duplicates;
- initial-notification payload;
- deep-link result;
- logs without the access key;
- cold-start timing.

#### 5.6a Minimum toolchain per Expo SDK (Xcode)

| Expo SDK | Minimum iOS | Minimum Xcode | Source |
|---|---|---|---|
| 54 | — | not re-checked | — |
| 55 | 15.1 | 26.2 | §3 table |
| 56 | 16.4 | 26.4 | [Expo SDK reference](https://docs.expo.dev/versions/latest/) |
| 57 | 16.4 | **26.4** | [Expo SDK reference](https://docs.expo.dev/versions/latest/); `expo-doctor` reports "SDK 57 is not compatible with Xcode 26.2, required >=26.4.0" ([Recipedia #634](https://github.com/AntoC-dev/Recipedia/issues/634)) |
| 58 | 16.4 | **26.4** | [Expo SDK reference](https://docs.expo.dev/versions/latest/); [SDK 58 changelog](https://expo.dev/changelog/sdk-58) |

Notes:
- SDK 58 is built for iOS 27 and uses the scene-based lifecycle, which apps built with the iOS 27 SDK get automatically ([changelog](https://expo.dev/changelog/sdk-58)). Xcode 27 is required only for specific features (e.g. `expo-app-intents` on-screen identification) and, per third-party reports, for the EAS `sdk-58` build image; it is not stated as a hard minimum for building SDK 58.
- The figures for 57/58 were taken from the official docs table as quoted by search results; the docs page itself was not opened directly. Re-verify against the live table before publishing the README compatibility table.
- Our matrix was built with Xcode 26.6 (≥ all minimums above). Xcode 27 has not been tested.

#### 5.6 Reproducibility

For every run record: exact `expo`, React Native, React; Node; npm/yarn; Xcode/Swift; CocoaPods; JDK; Gradle/AGP/Kotlin; OS/device. The compatibility table states "tested on exact versions", not "every patch from .0.0".

### Step 6 — SDK upgrade to Expo 58, packaging, demo-app testing on 54–58

**6a. SDK upgrade.** On `v3.0.0` the SDK is upgraded **directly to Expo 58** (SDK `devDependencies`, native module, config plugin). Every change must stay compatible with Expo 54–58: use only APIs available on 54, or guard newer ones (compile-time checks in native code, template detection in the plugin).

**6b. Packaging — before the demo-app matrix.** All SDKs must be tested with one and the same SDK artifact (`file:` symlinks can hide autolinking, package-contents and relative-path issues):

1. [ ] Build the SDK and explicitly compile the config plugin in `expo-reteno-sdk`: `npm run build:all` (`expo-module build` + `expo-module build plugin`, non-watch). Note: since `expo-module-scripts` 56, `npm run prepare` is a no-op and `expo-module prepublishOnly` builds only `build/`; the package's `prepublishOnly` script therefore also cleans and builds `plugin/`. Confirm `build/` and `plugin/build/` are freshly generated from the current commit before packing.
2. [ ] Set a unique prerelease version for the test artifact, e.g. `3.0.0-test.<short-commit>`, so npm/build caches and Expo fingerprinting cannot reuse a previous tarball with the same version.
3. [ ] `npm pack` in `expo-reteno-sdk`.
4. [ ] Inspect the tarball. Must contain:
   - `build/index.js` and `.d.ts` typings;
   - compiled `plugin/build` and `app.plugin.js`;
   - NSE/NCE extension sources (`plugin/src/support/nse|nce`);
   - `ios/` sources and `ExpoRetenoSdk.podspec`;
   - `android/` sources, resources, `build.gradle`, `AndroidManifest.xml`;
   - `expo-module.config.json`.
   Must **not** contain test fixtures, credentials (`google-services.json`, `GoogleService-Info.plist`, keys), or local build artifacts.
5. [ ] Record the tarball SHA-256 in the test report.
6. [ ] Install **the same tarball** in every Expo 54–58 project and run the matrix (6c).
7. [ ] After any SDK change: create a new tarball (new prerelease version, new SHA-256), reinstall it and repeat the affected runs with `prebuild --clean`.

**6c. Demo-app testing.** The demo app is tested against **each** Expo SDK 54, 55, 56, 57 (default and `enableSceneSupport`) and 58 with the tarball from 6b, executing the Step 5 specification:

1. [ ] Use a **fresh per-SDK project** (`create-expo-app` for SDK N, or the Step 1 project) with the demo-app sources copied in. If a copy of `TestApp` is switched between Expo majors instead, a clean state is mandatory for every SDK: delete `node_modules`, lockfile, `ios/`, `android/`, Pods and Gradle build artifacts, then do a clean dependency install and `prebuild --clean`.
2. [ ] Run `npx expo-doctor@latest` and record the result.
3. [ ] Run the checks for SDK N from §5.5 (build, runtime smoke, idempotency; full push run on 54 and 58).
4. [ ] Record exact versions, tarball SHA-256 and results (§5.6).
5. [ ] After all SDKs pass, keep `TestApp` on Expo 58 in `v3.0.0`; keep the setup for producing the 54–57 projects reproducible (script or documented steps) for future regression runs.

Regression policy:

- **Goal:** the upgrade to Expo 58 must not introduce regressions on any of Expo 54–58.
- **If an SDK/plugin change required for a newer SDK cannot be made without breaking an older SDK in the range** (e.g. an API removed in 58 has no replacement on 54, or a deployment target / toolchain conflict):
  1. record which SDKs pass and which regress;
  2. document the conflict (affected SDKs, root cause, options) and **discuss it with the team** before continuing;
  3. options to decide between:
     - release 3.0.0 for the passing range only (e.g. `>=54.0.0 <58.0.0`) and deliver support for the conflicting SDK(s) in a **separate release**: minor if the floor is unchanged, major if the floor must be raised (e.g. 4.0.0 with `>=55`);
     - conditional code paths (compile-time checks, template detection in the plugin) if they keep the code maintainable;
     - raise the floor in 3.0.0 itself if the team accepts dropping the affected SDK.
- The final `peerDependencies` range in §1 is confirmed only after all SDKs 54–58 pass; adjust §1 and the changelog if the range changes.

### Step 7 — Release 3.0.0

- [ ] Gate: `v2.x` branch exists and is pushed (Step 0.1) before merging into `main`.
- [ ] Gate: **final release-candidate run.** After all fixes are in, build one release-candidate tarball (e.g. `3.0.0-rc.1`, via 6b), record its SHA-256, and run the **entire** final matrix 54–58 (§5.5, all rows and push configurations) on that single tarball. Any SDK change after this point invalidates the run: produce a new RC (`3.0.0-rc.2`, new SHA-256) and rerun the full matrix. The published 3.0.0 must be built from the same commit as the passing RC; record commit and RC SHA-256 in the release notes / test report.
- [ ] Update `peerDependencies` as in §1.
- [ ] README and docs.reteno.com:
  - compatibility table for Expo SDK 54–58 with exact tested versions;
  - *"Use the latest available patch release within the selected Expo SDK major."*;
  - *"Requires a development build or a standalone native build; Expo Go is not supported."*;
  - Expo 54 support scope and architecture statement (§1);
  - iOS: Google Services / Firebase setup; Android: `android.googleServicesFile` is required for FCM.
- [ ] CHANGELOG:
  - *"Expo SDK 51–53 are no longer supported. Compatibility could not be reliably guaranteed with the current native templates and config-plugin integration."*;
  - scene lifecycle (SceneDelegate) support;
  - Android module migrated to `expo-module-gradle-plugin`;
  - config plugin no longer modifies Gradle files; Google Services handled by Expo's `android.googleServicesFile`;
  - users running prebuild with `--no-clean` should run `npx expo prebuild --clean` once;
  - any confirmed platform/toolchain bump.
- [ ] Reply to support with the matrix results.

---

## 6. Process for each future Expo SDK

1. Generate a new fixture from a clean template.
2. Run plugin integration and unit tests against it.
3. Debug build + runtime smoke; full push run on the newest SDK.
4. Raise the upper bound in `peerDependencies`; publish a minor release.

---

## 7. Open questions

- Was `ExpoReactNativeFactory` introduced exactly in SDK 53? (Only matters if 53 is ever re-added.)
- Does `ExpoAppDelegateSubscriber` fire early enough on 54–57 classic templates? (Step 2a.)
- Legacy Architecture on 54: test it, or declare New Architecture only?
- Kotlin / AGP / minSdk / Xcode of the 55–58 templates (Step 1).
- Is explicit `firebase-messaging` needed on Android? (Step 3a.)
- Internal adoption data for Expo 54 among Reteno customers.
- End-of-support date for the `v2.x` line.
- Any SDK in 54–58 where a regression proves unavoidable during Step 6 (triggers a team discussion and a possible separate release).

## 8. Execution log (Step 6)

Android debug builds in the matrix use `-PreactNativeArchitectures=arm64-v8a` (disk space); Release builds on 54 and 58 should build all ABIs.

Environment: Xcode 26.6, macOS (Darwin 25.5). Test projects are clean `create-expo-app` blank templates; placeholder SDK key and a dummy `google-services.json` (no real credentials).

**Release-candidate tarball (test):** `expo-reteno-sdk-3.0.0-test.805d632.tgz`, 73 files, SHA-256 `15a51ffbe413db92862eece60f9be82ff91419f662c058815ee7bcd7730494d0`. Contains no fixtures, tests, tsbuildinfo or credentials. Built with `npm run build:all`. Must be rebuilt and re-hashed for the final RC (Step 7), since the tree has uncommitted changes.

| SDK | Arch | expo-doctor | Prebuild | iOS Debug | Android Debug | Notes |
|---|---|---|---|---|---|---|
| 54.0.36 / RN 0.81.5 | New | 18/18 | ✓ | ✓ | ✓ | plain `import Reteno` |
| 54.0.36 | Legacy | — | ✓ | ✗ (`fmt` pod, Xcode 26.6) | ✓ | iOS failure is identical with published 2.5.4 on a clean project; not an SDK regression; documented in README |
| 55.0.32 / RN 0.83.10 | New | 20/20 | ✓ | ✓ | ✓ | `internal import Reteno` / `ExpoRetenoSdk` |
| 56.0.24 / RN 0.85.3 | New | 21/22 | ✓ | ✓ | ✓ (arm64-v8a) | doctor failure is Expo's Hermes V1 memory regression (fixed in 57.0.9+), not the SDK |
| 57.0.34 / RN 0.86.3 (default) | New | 21/21 | ✓ | ✓ | ✓ (arm64-v8a) | `internal import`; classic AppDelegate |
| 57.0.34 `enableSceneSupport` | New | 21/21 | ✓ | ✓ | ✓ (arm64-v8a) | `UIApplicationSceneManifest` → `EXExpoAppSceneDelegate`; init inserted after `reactNativeFactory = factory` |
| 58.0.26 / RN 0.88.1 | New | 20/20 | ✓ | ✓ | ✓ (arm64-v8a) | scene template: `SceneDelegate.swift` generated; `internal import`; also passed earlier in TestApp (Firebase mode) |

Debug matrix 54–58 (clean projects, test tarball) is complete: all green except 54 Legacy iOS (third-party `fmt`, see above).

Not done yet: runtime smoke (§5.4), Release builds on 54 and 58 (all ABIs), on-device push runs, docs (`docs/android.md`, troubleshooting, CHANGELOG), final matrix on the final RC tarball.

