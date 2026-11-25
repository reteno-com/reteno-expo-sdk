# Changelog

## 3.0.0

### Breaking changes

- Supported Expo SDK range is now `>=54.0.0 <59.0.0`. Expo SDK 51–53 are no longer supported; stay on 2.x for them.
- Android: FCM requires `android.googleServicesFile` in the Expo config. The plugin no longer edits Gradle files and only prints a warning if the option is missing.
- Run `npx expo prebuild --clean` once after upgrading, and remove any manual Reteno / Google Services Gradle edits.

### Changes

- Config plugin: anchor-based AppDelegate edits that fail with a clear error instead of silently skipping; compatible with the Expo 55+ `internal import` template and the scene-based template.
- iOS: Firebase pods are managed in one generated Podfile block and removed when switching back to APNs; extension targets use the app deployment target.
- Android module uses `expo-module-gradle-plugin`.
- Expo 54 Legacy Architecture: Android builds; iOS Legacy depends on React Native 0.81 / Xcode compatibility (see README).
