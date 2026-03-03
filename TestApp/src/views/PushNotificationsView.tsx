import Reteno from "expo-reteno-sdk";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const PushNotificationsView = () => {
  const onRetenoPushReceived = useCallback((event: any) => {
    Alert.alert(
      "onPushNotificationReceived",
      event ? JSON.stringify(event) : event,
    );
  }, []);

  const onRetenoPushClicked = useCallback((event: any) => {
    Alert.alert(
      "onPushNotificationClicked",
      event ? JSON.stringify(event) : event,
    );
  }, []);

  const requestPermissions = () => {
    Reteno.registerForRemoteNotifications();
  };

  useEffect(() => {
    async function start() {
      const data = await Reteno.getInitialNotification();

      if (!data) {
        Alert.alert("getInitialNotification", "No data");
      } else {
        Alert.alert(
          "getInitialNotification",
          data ? JSON.stringify(data) : data,
        );
      }
    }

    start();
  }, []);

  useEffect(() => {
    const pushListener =
      Reteno.setOnRetenoPushReceivedListener(onRetenoPushReceived);
    return () => pushListener.remove();
  }, [onRetenoPushReceived]);

  useEffect(() => {
    const pushClickListener =
      Reteno.setOnRetenoPushClickedListener(onRetenoPushClicked);
    return () => pushClickListener.remove();
  }, [onRetenoPushClicked]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Info">
          <Text>
            Notifications will be displayed here as alerts when app is in
            foreground
          </Text>
          <Button text="Request permissions" onPress={requestPermissions} />
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};
