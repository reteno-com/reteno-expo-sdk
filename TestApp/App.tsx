import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Reteno from "expo-reteno-sdk";
import { FC, useCallback, useEffect, useState } from "react";

const TOKEN = "YOUR_TOKEN";
const USER_TOKEN = "YOUR_USER_TOKEN";

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
  const [state, setState] = useState({
    token: "",
    userId: "",
  });

  const onRetenoPushReceived = useCallback((event: any) => {
    Alert.alert("onRetenoPushReceived", event ? JSON.stringify(event) : event);
  }, []);

  const handleStart = () => {
    Reteno.initialize(TOKEN, true);

    Reteno.setUserAttributes(USER_TOKEN);
    setState({ token: TOKEN, userId: USER_TOKEN });
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
        <Button text="Start SDK" onPress={handleStart} />

        {state.token === "" ? (
          <Text>Press `Start SDK` button to initialize Reteno SDK</Text>
        ) : (
          <View>
            {Object.keys(state).map((s: string, key: number) => (
              <Text key={`State_${key}`}>
                {s}: {state[s]}
              </Text>
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
  },
});
