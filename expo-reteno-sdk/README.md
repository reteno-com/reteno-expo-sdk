# expo-reteno-sdk

Expo wrapper for Reteno SDK.

## Installation

```bash
npm install expo-reteno-sdk
```

## Compatibility

| expo-reteno-sdk | Expo SDK |
|---|---|
| 3.x | 54 – 58 |
| 2.x | 51 – 54 (maintenance branch `v2.x`) |

Expo SDK 54 is the last release that allows Legacy Architecture (`newArchEnabled: false`); Expo 55+ is New Architecture only.

**Legacy Architecture on Expo 54.** The plugin and native module work on Legacy (verified: prebuild and Android build). The iOS Legacy build compiles React Native 0.81 dependencies from source, and on Xcode 26.6 the `fmt` pod fails to compile (`consteval` errors). This comes from React Native / Xcode compatibility, not from this SDK: the same failure occurs with `expo-reteno-sdk` 2.5.4 on a clean Expo 54 project. Use an Xcode version compatible with RN 0.81 or New Architecture.

## Documentation

- [Expo SDK Overview](https://docs.reteno.com/reference/expo-sdk)

### Setup Guides

- [Expo iOS SDK Setup](https://docs.reteno.com/reference/expo-ios-sdk-setup)
- [Expo Android SDK Setup](https://docs.reteno.com/reference/expo-android-sdk-setup)

### Additional

- [Expo SDK Release Notes](https://docs.reteno.com/page/expo-sdk-release-notes)

## License

MIT

---

Made with [Expo Modules API](https://docs.expo.dev/modules/overview/)
