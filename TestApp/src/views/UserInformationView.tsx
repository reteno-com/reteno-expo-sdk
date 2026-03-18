import Reteno from "expo-reteno-sdk";
import { useState } from "react";
import { Platform, ScrollView } from "react-native";
import { Block, Button, Input, ScreenContainer } from "src/components";

const USER_TOKEN = Platform.select({
  ios: "a81fbb6e-f1d4-4c5b-a06f-fcff840aa0ae",
  android: "2b5a1816-a8c0-40f9-a858-86a39901c920",
});

const USER_DATA = {
  phone: "+380990000000",
  email: "test@mail.com",
  timeZone: "Europe/Kyiv",
  languageCode: "en-UA",
  firstName: "Barney",
  lastName: "Stinson",
  address: {
    region: "Ukraine",
    town: "Kyiv",
    address: "25 Random st.",
    postcode: "01001",
  },
  fields: [{ key: "272604", value: "UA" }],
};

export const UserInformationView = () => {
  const [user, setUser] = useState(USER_DATA);

  const changeField = (key: string, value: string) => {
    setUser((prev) => ({ ...prev, [key]: value }));
  };

  const changeAddressField = (key: string, value: string) => {
    setUser((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [key]: value,
      },
    }));
  };

  const handleSetAttributes = (disableFields = true) => {
    const data = {
      userAttributes: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        languageCode: USER_DATA.languageCode,
        timeZone: USER_DATA.timeZone,
        address: user.address,
        fields: disableFields ? [] : user.fields,
      },
    };

    Reteno.updateUserAttributes({
      externalUserId: USER_TOKEN ?? "",
      user: data,
    });

    if (Platform.OS === "ios") {
      async function getTokenOnIos() {
        // const token = await messaging().getToken();
        // Reteno.setDeviceToken(token);
      }

      getTokenOnIos();
    } else {
      // ...
    }
  };

  const handleSetAnonymousAttribute = (disableFields = true) => {
    const data = {
      firstName: user.firstName,
      lastName: user.lastName,
      languageCode: USER_DATA.languageCode,
      timeZone: USER_DATA.timeZone,
      address: user.address,
      fields: disableFields ? [] : user.fields,
    };

    // If you want to update anonymous:
    Reteno.updateAnonymousUserAttributes(data);

    if (Platform.OS === "ios") {
      async function getTokenOnIos() {
        // const token = await messaging().getToken();
        // Reteno.setDeviceToken(token);
      }

      getTokenOnIos();
    } else {
      // ...
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Block title="User data">
          <Input
            onChangeText={(s: string) => changeField("firstName", s)}
            placeholder="First name"
          />
          <Input
            onChangeText={(s: string) => changeField("lastName", s)}
            placeholder="Last name"
          />
          <Input
            onChangeText={(s: string) => changeField("phone", s)}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
          <Input
            onChangeText={(s: string) => changeField("email", s)}
            placeholder="Email"
            keyboardType="email-address"
          />
          <Input
            onChangeText={(s: string) => changeAddressField("region", s)}
            placeholder="Region"
          />
          <Input
            onChangeText={(s: string) => changeAddressField("town", s)}
            placeholder="Town"
            keyboardType="email-address"
          />
          <Input
            onChangeText={(s: string) => changeAddressField("address", s)}
            placeholder="Address"
          />
          <Input
            onChangeText={(s: string) => changeAddressField("postcode", s)}
            placeholder="Postcode"
            keyboardType="phone-pad"
          />
        </Block>

        <Block title="Send">
          <Button
            text="Default User Attributes"
            onPress={handleSetAttributes}
          />

          <Button
            text="Default User Attributes (with `fields`)"
            onPress={() => handleSetAttributes(false)}
          />

          <Button
            text="Anonymous User Attributes"
            onPress={handleSetAnonymousAttribute}
          />

          <Button
            text="Anonymous User Attributes (with `fields`)"
            onPress={() => handleSetAnonymousAttribute(false)}
          />
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};
