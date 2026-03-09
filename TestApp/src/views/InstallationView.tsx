import Reteno from "expo-reteno-sdk";
import { useState } from "react";
import { Platform, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

const USER_TOKEN = Platform.select({
  ios: "a81fbb6e-f1d4-4c5b-a06f-fcff840aa0ae",
  android: "2b5a1816-a8c0-40f9-a858-86a39901c920",
});

export const InstallationView = () => {
  const [token, setToken] = useState("");

  const handleDeviceToken = () => {
    Reteno.setDeviceToken(USER_TOKEN);
    setToken(USER_TOKEN);
  };

  return (
    <ScreenContainer>
      <Block title="SDK Installation">
        <Text>
          SDK installation is done at `prebuild` phase internally withour
          developer
        </Text>
        <Text>
          Check {Platform.OS === "ios" ? "Xcode" : "Android Studio"} project
          files
        </Text>
        <Button text="[IOS-ONLY] Set DeviceToken" onPress={handleDeviceToken} />
      </Block>

      {Boolean(token.length) && (
        <Block title="Device Token">
          <Text>{token}</Text>
        </Block>
      )}
    </ScreenContainer>
  );
};
