import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Application from "expo-application";
import { Platform, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { EcommerceView } from "src/views/EcommerceView";
import {
  ActionButtonsView,
  AppInboxMessagesView,
  InAppMessagesView,
  InstallationView,
  MenuView,
  PushNotificationsView,
  RecommendationsView,
  UserBehaviourView,
  UserInformationView,
} from "src/views";

const Stack = createNativeStackNavigator();
const appConfig = require("./app.json");

function VersionBadge() {
  const insets = useSafeAreaInsets();
  const iosBuildNumber = appConfig?.expo?.ios?.buildNumber;
  const appVersion = appConfig?.expo?.version;
  const version =
    Platform.OS === "ios"
      ? iosBuildNumber ?? Application.nativeBuildVersion
      : Application.nativeApplicationVersion ?? appVersion;

  return (
    <View
      pointerEvents="none"
      style={[styles.versionBadge, { top: insets.top + 8 }]}
    >
      <Text style={styles.versionText}>{version ?? "unknown"}</Text>
    </View>
  );
}

function RootStack() {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Menu"
            component={MenuView}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Installation" component={InstallationView} />
          <Stack.Screen
            name="UserInformation"
            component={UserInformationView}
            options={{ headerTitle: "User Information" }}
          />

          <Stack.Screen
            name="UserBehaviour"
            component={UserBehaviourView}
            options={{ headerTitle: "User Behaviour" }}
          />

          <Stack.Screen
            name="PushNotifications"
            component={PushNotificationsView}
            options={{ headerTitle: "Push Notifications" }}
          />

          <Stack.Screen
            name="Recommendations"
            component={RecommendationsView}
          />
          <Stack.Screen
            name="InAppMessages"
            component={InAppMessagesView}
            options={{ headerTitle: "In-App Messages" }}
          />
          <Stack.Screen
            name="AppInboxMessages"
            component={AppInboxMessagesView}
            options={{ headerTitle: "App Inbox Messages" }}
          />

          <Stack.Screen
            name="ActionButtons"
            component={ActionButtonsView}
            options={{ headerTitle: "Action Buttons" }}
          />

          <Stack.Screen
            name="Ecommerce"
            component={EcommerceView}
            options={{ headerTitle: "Ecommerce Events" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <VersionBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  versionBadge: {
    position: "absolute",
    right: 8,
    backgroundColor: "#111111cc",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 999,
  },
  versionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <RootStack />
    </SafeAreaProvider>
  );
}
