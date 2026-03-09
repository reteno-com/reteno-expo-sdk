import { useNavigation } from "@react-navigation/native";
import { Platform, View } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const MenuView = () => {
  const { navigate } = useNavigation();
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Block title="Reteno SDK Example">
          <Button
            text="Installation SDK"
            onPress={() => navigate("Installation")}
          />

          <Button
            text="User information"
            onPress={() => navigate("UserInformation")}
          />

          <Button
            text="User behaviour"
            onPress={() => navigate("UserBehaviour")}
          />

          <Button
            text="Push notifications"
            onPress={() => navigate("PushNotifications")}
          />

          <Button
            text="Recommendations"
            onPress={() => navigate("Recommendations")}
          />

          <Button
            text="In-App Messages"
            onPress={() => navigate("InAppMessages")}
          />

          <Button
            text="App Inbox Messages"
            onPress={() => navigate("AppInboxMessages")}
          />

          <Button
            text="Action Buttons"
            onPress={() => navigate("ActionButtons")}
          />

          <Button
            text="Ecommerce events"
            onPress={() => navigate("Ecommerce")}
          />
        </Block>
      </View>
    </ScreenContainer>
  );
};
