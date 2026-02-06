import Reteno from "expo-reteno-sdk";
import { addPushNotificationListener } from "expo-reteno-sdk/ExpoRetenoSdkModule";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function App() {
  const [didInitialize, setInitialized] = useState(false);

  const handleStart = () => {
    Reteno.initialize("79707ac8-c6e6-4f06-ac00-769b4332bd6f");
  };

  const handleUpdateUserAttributes = () => {
    Reteno.setUserAttributes("1e0fe1e3-9f91-43ea-9d72-f788e9aa794f");
    setInitialized(true);
  };

  const onRetenoPushReceived = useCallback((event: any) => {
    Alert.alert("onRetenoPushReceived", event ? JSON.stringify(event) : event);
  }, []);

  useEffect(() => {
    const listener = addPushNotificationListener(onRetenoPushReceived);

    return () => listener.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Module API Example</Text>
        <Button title="Start SDK" onPress={handleStart} />
        <Button
          title="Update user attributes"
          onPress={handleUpdateUserAttributes}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
  },
  view: {
    flex: 1,
    height: 200,
  },
};
