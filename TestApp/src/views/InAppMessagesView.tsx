import Reteno from "expo-reteno-sdk";
import { useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const InAppMessagesView = () => {
  const [didStop, setDidStop] = useState(true);

  useEffect(() => {
    Reteno.setInAppLifecycleCallback();

    const beforeInAppDisplayListener = Reteno.beforeInAppDisplayHandler(
      (data) =>
        Alert.alert(
          "Before In-App Display",
          data ? JSON.stringify(data) : "No data received",
        ),
    );
    const onInAppDisplayListener = Reteno.onInAppDisplayHandler((data) =>
      Alert.alert(
        "On In-App Display",
        data ? JSON.stringify(data) : "No data received",
      ),
    );
    const beforeInAppCloseListener = Reteno.beforeInAppCloseHandler((data) =>
      Alert.alert(
        "Before In-App Close",
        data ? JSON.stringify(data) : "No data received",
      ),
    );
    const afterInAppCloseListener = Reteno.afterInAppCloseHandler((data) =>
      Alert.alert(
        "After In-App Close",
        data ? JSON.stringify(data) : "No data received",
      ),
    );
    const onInAppErrorListener = Reteno.onInAppErrorHandler((data) =>
      Alert.alert(
        "On In-App Error",
        data ? JSON.stringify(data) : "No data received",
      ),
    );

    // Remove listeners when component unmounts
    return () => {
      beforeInAppDisplayListener.remove();
      onInAppDisplayListener.remove();
      beforeInAppCloseListener.remove();
      afterInAppCloseListener.remove();
      onInAppErrorListener.remove();

      // Remove the in-app lifecycle callback if it exists (only for Android)
      // Reteno.removeInAppLifecycleCallback();
    };
  }, []);

  useEffect(() => {
    const addInAppMessageCustomDataListener =
      Reteno.onInAppMessageCustomDataHandler((data) =>
        Alert.alert(
          "Custom Data Received",
          data ? JSON.stringify(data) : "No custom data received",
        ),
      );

    return () => {
      addInAppMessageCustomDataListener.remove();
    };
  }, []);

  const handleInAppMessagesStatus = async (isPaused: boolean) => {
    try {
      await Reteno.pauseInAppMessages(isPaused);
      Alert.alert("Success", "Pause state changed");
      setDidStop((prev) => !prev);
    } catch (error) {
      Alert.alert("Error", error);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Available options">
          <Button
            text={didStop ? "Start messages" : "Stop messages"}
            onPress={() => handleInAppMessagesStatus(didStop)}
          />

          <Button
            text={"Skip messages"}
            onPress={() => Reteno.setInAppMessagesPauseBehaviour("skip")}
          />

          <Button
            text={"Postpone messages"}
            onPress={() => Reteno.setInAppMessagesPauseBehaviour("postpone")}
          />
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};
