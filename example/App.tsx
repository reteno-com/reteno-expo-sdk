import Reteno from "expo-reteno-sdk";
import React, { useEffect } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function App() {
  const handleStart = () => {
    Reteno.start("123");
    Reteno.requestPermissions();
  };

  useEffect(() => {
    handleStart();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Module API Example</Text>
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
