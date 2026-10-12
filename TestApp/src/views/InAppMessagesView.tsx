import Reteno from "expo-reteno-sdk";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Alert, Platform, ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";
import {
  clearLinkEvents,
  getLinkEventsSnapshot,
  subscribeToLinkEvents,
} from "src/linkEventsStore";

let isInAppMessagesPaused = false;

export const InAppMessagesView = () => {
  const [didStop, setDidStop] = useState(isInAppMessagesPaused);
  const linkEvents = useSyncExternalStore(
    subscribeToLinkEvents,
    getLinkEventsSnapshot,
    getLinkEventsSnapshot,
  );

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
      if (Platform.OS === "android") {
        Reteno.removeInAppLifecycleCallback();
      }
    };
  }, []);

  const handleInAppMessagesStatus = async (isPaused: boolean) => {
    try {
      await Reteno.pauseInAppMessages(isPaused);
      isInAppMessagesPaused = isPaused;
      setDidStop(isPaused);
      Alert.alert("Success", "Pause state changed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", message);
    }
  };

  const handlePushInAppPause = async (isPaused: boolean) => {
    try {
      await Reteno.pausePushInAppMessages(isPaused);
      Alert.alert("Success", `Push-triggered in-app ${isPaused ? "paused" : "resumed"}`);
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    }
  };

  const handleLogEcomEventOrderDelivered = async () => {
    await Reteno.logEcomEventOrderDelivered({ externalOrderId: "ORDER-999" });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Link event source">
          <Text>
            Trigger an in-app link or tap a push link. The semantic source is
            shown as inAppMessage or pushNotification; inapp_source remains the
            in-app display trigger on Android.
          </Text>
          {linkEvents.length ? (
            linkEvents
              .slice()
              .reverse()
              .map((event, index) => (
                <Text key={`${event.receivedAt}-${index}`} selectable>
                  Source: {event.data.source ?? "not provided"}
                  {"\n"}In-app display source: {event.data.inapp_source ?? "not provided"}
                  {"\n"}URL: {event.data.url ?? "not provided"}
                  {"\n"}Received: {event.receivedAt}
                  {"\n"}Payload: {JSON.stringify(event.data.customData ?? {}, null, 2)}
                </Text>
              ))
          ) : (
            <Text>No link events received yet</Text>
          )}
          <Button text="Clear link events" onPress={clearLinkEvents} />
        </Block>

        <Block title="Available options">
          <Button
            text={didStop ? "Start messages" : "Stop messages"}
            onPress={() => handleInAppMessagesStatus(!didStop)}
          />

          <Button
            text={"Skip messages"}
            onPress={() => Reteno.setInAppMessagesPauseBehaviour("skip")}
          />

          <Button
            text={"Postpone messages"}
            onPress={() => Reteno.setInAppMessagesPauseBehaviour("postpone")}
          />

          <Button
            text="LogEcomEventOrderDelivered()"
            onPress={handleLogEcomEventOrderDelivered}
          />
        </Block>

        {Platform.OS === "android" && (
          <Block title="Push-triggered In-App (Android)">
            <Button
              text="Pause push-triggered in-app"
              onPress={() => handlePushInAppPause(true)}
            />
            <Button
              text="Resume push-triggered in-app"
              onPress={() => handlePushInAppPause(false)}
            />
            <Button
              text="Behaviour: Skip"
              onPress={async () => {
                try {
                  await Reteno.setPushInAppMessagesPauseBehaviour("skip");
                } catch (e: any) {
                  Alert.alert("Error", String(e?.message ?? e));
                }
              }}
            />
            <Button
              text="Behaviour: Postpone"
              onPress={async () => {
                try {
                  await Reteno.setPushInAppMessagesPauseBehaviour("postpone");
                } catch (e: any) {
                  Alert.alert("Error", String(e?.message ?? e));
                }
              }}
            />
          </Block>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
