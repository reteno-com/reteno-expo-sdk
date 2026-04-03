# reteno-expo-sdk

Monorepo for the Expo wrapper of the Reteno SDK.

## Structure

```
.
├── expo-reteno-sdk/   # npm package — the Expo/React Native SDK
└── TestApp/           # example app for testing
```

## Package

The publishable package is [`expo-reteno-sdk`](./expo-reteno-sdk).

- [Installation](./expo-reteno-sdk/docs/ios.md)
- [Android setup](./expo-reteno-sdk/docs/android.md)
- [API](./expo-reteno-sdk/docs/api.md)
- [Troubleshooting](./expo-reteno-sdk/docs/troubleshooting.md)

## Release

```bash
npm run release:patch   # 1.1.0 → 1.1.1
npm run release:minor   # 1.1.0 → 1.2.0
```

## License

MIT
