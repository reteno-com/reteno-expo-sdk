import Reteno from "expo-reteno-sdk";
import { useCallback, useEffect } from "react";
import { Alert, Platform, ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

const showEvent = (title: string, event: any) =>
  Alert.alert(title, event ? JSON.stringify(event) : "No data");

export const PushNotificationsView = () => {
  const onRetenoPushReceived = useCallback((event: any) => {
    showEvent("onPushNotificationReceived", event);
  }, []);

  const onRetenoPushClicked = useCallback((event: any) => {
    showEvent("onPushNotificationClicked", event);
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
    if (Platform.OS === "android") {
      const pushListener =
        Reteno.setOnRetenoPushReceivedListener(onRetenoPushReceived);

      return () => pushListener.remove();
    }
  }, [onRetenoPushReceived]);

  useEffect(() => {
    const pushClickListener =
      Reteno.setOnRetenoPushClickedListener(onRetenoPushClicked);

    return () => pushClickListener?.remove();
  }, [onRetenoPushClicked]);

  // iOS only
  useEffect(() => {
    if (Platform.OS === "ios") {
      const pushButtonClickListener =
        Reteno.setOnRetenoPushButtonClickedListener(onRetenoPushClicked);

      return () => pushButtonClickListener?.remove();
    }
  }, [onRetenoPushClicked]);

  // Android only — push dismissed
  useEffect(() => {
    const listener = Reteno.setOnRetenoPushDismissedListener((event) =>
      showEvent("onPushDismissed", event),
    );
    return () => listener?.remove();
  }, []);

  // Android only — custom/silent push
  useEffect(() => {
    const listener = Reteno.setOnRetenoCustomPushDataListener((event) =>
      showEvent("onCustomPushReceived", event),
    );
    return () => listener?.remove();
  }, []);

  const handleRequestNotificationPermission = async () => {
    try {
      const granted = await Reteno.requestNotificationPermission();
      Alert.alert(
        "Notification Permission",
        granted ? "Granted" : "Denied",
      );
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    }
  };

  const handleGetNotificationPermissionStatus = async () => {
    try {
      const status = await Reteno.getNotificationPermissionStatus();
      Alert.alert("Permission Status", status ?? "null (iOS)");
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    }
  };

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

        {Platform.OS === "android" && (
          <Block title="Notification Permission (Android)">
            <Button
              text="Request notification permission"
              onPress={handleRequestNotificationPermission}
            />
            <Button
              text="Get permission status"
              onPress={handleGetNotificationPermissionStatus}
            />
          </Block>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
