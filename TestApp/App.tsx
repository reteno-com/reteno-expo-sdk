import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Reteno from "expo-reteno-sdk";
import { FC, useCallback, useEffect, useState } from "react";
import {
  LogEventPayload,
  LogScreenViewPayload,
} from "expo-reteno-sdk/src/types";
// import messaging from "@react-native-firebase/messaging";

const USER_TOKEN = Platform.select({
  ios: "b17cf99f-6bc8-449a-9da3-4aae73121cab",
  android: "2b5a1816-a8c0-40f9-a858-86a39901c920",
});

const user = {
  phone: "+380990000003",
  email: "emailtest3@gmail.com",
  timeZone: "Europe/Kyiv",
  languageCode: "en-UA",
  firstName: "Ted",
  lastName: "Mosby",
  address: {
    region: "Ukraine",
    town: "Kyiv",
    address: "42 Random st.",
    postcode: "4815162342",
  },
  fields: [{ key: "custom_field", value: "Custom Value" }],
};

type ButtonProps = {
  text: string;
  onPress: () => void;
};

const Button: FC<ButtonProps> = (props) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      activeOpacity={0.75}
      style={{
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#ededed",
      }}
    >
      <Text>{props.text}</Text>
    </TouchableOpacity>
  );
};

export default function App() {
  const [state, setState] = useState({});

  const onRetenoPushReceived = useCallback((event: any) => {
    Alert.alert(
      "onPushNotificationReceived",
      event ? JSON.stringify(event) : event,
    );
  }, []);

  const handleStart = () => {
    Reteno.registerForRemoteNotifications();
  };

  const handleSetAttribute = () => {
    // Reteno.updateUserAttributes(USER_TOKEN ?? "", user);

    // If you want to update anonymous:
    Reteno.updateAnonymousUserAttributes({
      firstName: "Ted",
      lastName: "Mosby",
    });

    if (Platform.OS === "ios") {
      async function getTokenOnIos() {
        // const token = await messaging().getToken();
        // Reteno.setDeviceToken(token);

        setState((prev) => ({
          ...prev,
          // deviceToken: token,
          userToken: USER_TOKEN,
          userAttributes: user,
        }));
      }

      getTokenOnIos();
    } else {
      setState((prev) => ({
        ...prev,
        userToken: USER_TOKEN,
        userAttributes: user,
      }));
    }
  };

  const handleLogEvent = () => {
    const event: LogEventPayload = {
      eventName: "TestCustomEvent",
      date: new Date().toISOString(),
      parameters: [{ name: "CustomName", value: "Custom Value" }],
    };

    Reteno.logEvent(event);

    setState((prev) => ({
      ...prev,
      customEvents: JSON.stringify(event),
    }));
  };

  const handleLogScreenViewEvent = () => {
    Reteno.logScreenView(
      "DashboardScreen-ae88afd0-74a0-460d-ab73-c546f4b7eeb6",
    );

    setState((prev) => ({
      ...prev,
      logScreenView: JSON.stringify(
        "DashboardScreen-ae88afd0-74a0-460d-ab73-c546f4b7eeb6",
      ),
    }));
  };

  const handleForcePushData = () => {
    Reteno.forcePushData();

    setState((prev) => ({
      ...prev,
      forcePushData: true,
    }));
  };

  useEffect(() => {
    const l = Reteno.addPushNotificationListener(onRetenoPushReceived);

    return () => {
      l.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={{ alignItems: "center", gap: 8 }}>
        <Text>Reteno installation SDK</Text>

        <Button text="Request push permissions" onPress={handleStart} />
        <Button text="Set UserID" onPress={handleSetAttribute} />

        <Text>Log events</Text>
        <Button text="Log custom event" onPress={handleLogEvent} />
        <Button text="Log screen view" onPress={handleLogScreenViewEvent} />
        <Button text="Force push data" onPress={handleForcePushData} />

        {!Object.keys(state).length ? (
          <Text>Press `Start SDK` button to initialize Reteno SDK</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {Object.keys(state).map((s: string, key: number) => (
              <View key={`State-${key}`}>
                <Text style={{ fontWeight: "900" }}>{s}:</Text>
                <Text>{JSON.stringify(state[s])}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
