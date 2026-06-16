import Reteno from "expo-reteno-sdk";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Block, Button, Input, ScreenContainer } from "src/components";
import { USER_TOKEN, useUser } from "src/UserContext";

export const UserInformationView = () => {
  const { user, setUser } = useUser();
  const [clearMarketId, setClearMarketId] = useState(false);
  const marketId = clearMarketId ? "" : user.marketId || undefined;

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

  const handleSetAttributes = async (disableFields = true) => {
    const data = {
      userAttributes: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        languageCode: user.languageCode,
        timeZone: user.timeZone,
        marketId,
        address: user.address,
        fields: disableFields ? [] : user.fields,
      },
    };

    try {
      await Reteno.updateUserAttributes({
        externalUserId: USER_TOKEN,
        user: data,
      });
      console.log("[Reteno] updateUserAttributes: success");
    } catch (error) {
      console.error("[Reteno] updateUserAttributes: error", error);
    }

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

  const handleSetAnonymousAttribute = async (disableFields = true) => {
    const data = {
      firstName: user.firstName,
      lastName: user.lastName,
      languageCode: user.languageCode,
      timeZone: user.timeZone,
      marketId,
      address: user.address,
      fields: disableFields ? [] : user.fields,
    };

    // If you want to update anonymous:
    try {
      await Reteno.updateAnonymousUserAttributes(data);
      console.log("[Reteno] updateAnonymousUserAttributes: success");
    } catch (error) {
      console.error("[Reteno] updateAnonymousUserAttributes: error", error);
    }

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

  const handleSetMultiAccountAttributes = async () => {
    try {
      await Reteno.updateMultiAccountUserAttributes(
        {
          externalUserId: USER_TOKEN,
          user: {
            userAttributes: {
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              email: user.email,
              languageCode: user.languageCode,
              timeZone: user.timeZone,
              marketId,
              address: user.address,
              fields: user.fields,
            },
          },
        },
        "account_suffix_demo",
      );
      console.log("[Reteno] updateMultiAccountUserAttributes: success");
    } catch (error) {
      console.error("[Reteno] updateMultiAccountUserAttributes: error", error);
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
            value={user.firstName}
            onChangeText={(s: string) => changeField("firstName", s)}
            placeholder="First name"
          />
          <Input
            value={user.lastName}
            onChangeText={(s: string) => changeField("lastName", s)}
            placeholder="Last name"
          />
          <Input
            value={user.phone}
            onChangeText={(s: string) => changeField("phone", s)}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
          <Input
            value={user.email}
            onChangeText={(s: string) => changeField("email", s)}
            placeholder="Email"
            keyboardType="email-address"
          />
          <Input
            value={user.marketId}
            onChangeText={(s: string) => changeField("marketId", s)}
            placeholder="Market ID"
            editable={!clearMarketId}
          />
          <View style={styles.checkboxRow}>
            <Switch value={clearMarketId} onValueChange={setClearMarketId} />
            <Text>Clear marketId (send empty string)</Text>
          </View>
          <Input
            value={user.address.region}
            onChangeText={(s: string) => changeAddressField("region", s)}
            placeholder="Region"
          />
          <Input
            value={user.address.town}
            onChangeText={(s: string) => changeAddressField("town", s)}
            placeholder="Town"
            keyboardType="email-address"
          />
          <Input
            value={user.address.address}
            onChangeText={(s: string) => changeAddressField("address", s)}
            placeholder="Address"
          />
          <Input
            value={user.address.postcode}
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

          <Button
            text="Multi-Account User Attributes"
            onPress={handleSetMultiAccountAttributes}
          />
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
});
