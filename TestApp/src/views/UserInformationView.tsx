import Reteno from "expo-reteno-sdk";
import { useState } from "react";
import { Platform, ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

const USER_TOKEN = Platform.select({
  ios: "a81fbb6e-f1d4-4c5b-a06f-fcff840aa0ae",
  android: "2b5a1816-a8c0-40f9-a858-86a39901c920",
});

const userData = {
  phone: "+380990000005",
  email: "emailtest3@gmail.com",
  timeZone: "Europe/Kyiv",
  languageCode: "en-UA",
  firstName: "Marshall",
  lastName: "Eriksen",
  address: {
    region: "Ukraine",
    town: "Kyiv",
    address: "42 Random st.",
    postcode: "4815162342",
  },
  fields: [{ key: "custom_field", value: "Custom Value" }],
};

const anonymousData = {
  timeZone: "Europe/Kyiv",
  languageCode: "en-UA",
  firstName: "Lilly",
  lastName: "Aldrin",
  address: {
    region: "Ukraine",
    town: "Kyiv",
    address: "42 Random st.",
    postcode: "4815162342",
  },
  fields: [{ key: "custom_field", value: "Custom Value" }],
};

export const UserInformationView = () => {
  const [user, setUser] = useState({});
  const [anonymous, setAnonymous] = useState({});

  const handleSetAttributes = () => {
    Reteno.updateUserAttributes(USER_TOKEN ?? "", {
      userAttributes: user,
    });

    // If you want to update anonymous:
    // Reteno.updateAnonymousUserAttributes({
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    // });

    if (Platform.OS === "ios") {
      async function getTokenOnIos() {
        // const token = await messaging().getToken();
        // Reteno.setDeviceToken(token);

        setUser((prev) => ({
          ...prev,
          // deviceToken: token,
          userToken: USER_TOKEN,
          userAttributes: userData,
        }));
      }

      getTokenOnIos();
    } else {
      setUser((prev) => ({
        ...prev,
        userToken: USER_TOKEN,
        userAttributes: userData,
      }));
    }
  };

  const handleSetAnonymousAttribute = () => {
    // If you want to update anonymous:
    Reteno.updateAnonymousUserAttributes({
      firstName: anonymousData.firstName,
      lastName: anonymousData.lastName,
    });

    if (Platform.OS === "ios") {
      async function getTokenOnIos() {
        // const token = await messaging().getToken();
        // Reteno.setDeviceToken(token);

        setAnonymous((prev) => ({
          ...prev,
          // deviceToken: token,
          userToken: USER_TOKEN,
          userAttributes: user,
        }));
      }

      getTokenOnIos();
    } else {
      setAnonymous((prev) => ({
        ...prev,
        userToken: USER_TOKEN,
        userAttributes: user,
      }));
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Available options">
          <Button text="Set User Attributes" onPress={handleSetAttributes} />
          <Button
            text="Set Anonymous User Attributes"
            onPress={handleSetAnonymousAttribute}
          />
        </Block>

        {Boolean(Object.keys(user).length) && (
          <Block title="Default user">
            <Text>{JSON.stringify(user)}</Text>
          </Block>
        )}

        {Boolean(Object.keys(anonymous).length) && (
          <Block title="Anonymous user">
            <Text>{JSON.stringify(anonymous)}</Text>
          </Block>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
