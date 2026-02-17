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
// import messaging from "@react-native-firebase/messaging";

const USER_TOKEN = Platform.select({
  ios: "e3c23974-49ef-4a2c-88a4-2f4500237840",
  android: "b2539427-a57c-4e6c-af6e-5035b651667c",
});

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
    Reteno.setUserAttributes(USER_TOKEN, {
      phone: "+380994009999",
      languageCode: "ua",
      firstName: "John",
      lastName: "Doe",
    });

    if (Platform.OS === "ios") {
      async function getTokenOnIos() {
        // const token = await messaging().getToken();

        // Reteno.setDeviceToken(token);

        setState((prev) => ({
          ...prev,
          // deviceToken: token,
          userToken: USER_TOKEN,
        }));

        // console.log(">>>", token);
        //
      }

      getTokenOnIos();
    } else {
      setState((prev) => ({ ...prev, userToken: USER_TOKEN }));
    }
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
        {!Object.keys(state).length ? (
          <Text>Press `Start SDK` button to initialize Reteno SDK</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {Object.keys(state).map((s: string, key: number) => (
              <View key={`State-${key}`}>
                <Text style={{ fontWeight: "900" }}>{s}:</Text>
                <Text>{state[s]}</Text>
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
