import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import { NavigationContainer } from "@react-navigation/native";
import { EcommerceView } from "src/views/EcommerceView";

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
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

        <Stack.Screen name="Recommendations" component={RecommendationsView} />
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
  );
}

export default function App() {
  return <RootStack />;
}
