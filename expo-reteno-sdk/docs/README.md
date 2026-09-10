# Expo SDK Setup

### Getting started with Reteno SDK for Expo

## Overview

`expo-reteno-sdk` is an Expo module for Reteno mobile engagement features.

##### The SDK supports:

- Expo development builds (Expo Go is not supported)
- iOS 15.1 or later
- Android 8.0 or later (`minSdkVersion = 26`)

##### Native SDK versions in `expo-reteno-sdk` `v2.3.1`:

- Reteno Android SDK 2.10.2
- Reteno iOS SDK 2.7.4

## Getting started with Reteno SDK / Setup guide

- [iOS](./ios.md)
- [Android](./android.md)

## Guides

- [Push notifications](./push-notifications.md)
- [Action buttons](./action-buttons.md)
- [In-app messages](./in-app-messages.md)
- [App Inbox](./app-inbox.md)
- [Tracking user information](./user-information.md)
- [Tracking user behaviour](./user-behaviour.md)
- [App lifecycle events](./app-lifecycle-events.md)
- [Ecommerce activity tracking](./ecommerce.md)
- [Recommendations](./recommendations.md)
- [Troubleshooting](./troubleshooting.md)
- [API reference](./api.md)

## Initialization in v2.0.0

Expo SDK v2.0.0 supports two initialization paths:

- Set `sdkAccessToken` in the platform plugin config to initialize automatically with default options.
- Omit `sdkAccessToken` and call `Reteno.initialize()` from JavaScript to control debug mode, lifecycle tracking, session duration, initial in-app pause state, and iOS device token handling.

Do not combine the two paths. If `sdkAccessToken` is set, the SDK initializes before JavaScript runs and a later `Reteno.initialize()` call is a no-op.

##### License

Reteno Expo SDK is released under the MIT license.
