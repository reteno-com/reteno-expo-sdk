import {
  useFocusEffect,
  useRoute,
  useRoutePath,
} from "@react-navigation/native";
import Reteno from "expo-reteno-sdk";
import { useCallback, useState } from "react";
import { Platform, ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const UserBehaviourView = () => {
  const [loggedEvents, setLoggedEvents] = useState([]);
  const route = useRoute();

  console.log(route);

  const handleLogEvent = async () => {
    const eventName = `EVENT_NAME_${loggedEvents.length}_${Date.now()}`;
    const date = new Date().toISOString();
    const parameters = [
      {
        name: "Additional parameter",
        value: "Additional value " + Date.now(),
      },
    ];

    const evt = { eventName, date, parameters, forcePush: false };

    const res = await Reteno.logEvent(evt);

    if (res.success) {
      setLoggedEvents((prev) => [...prev, evt]);
    }
  };

  const handleForcePushData = () => {
    if ((Platform.OS = "ios")) {
      Reteno.forcePushData();

      setLoggedEvents((prev) => [...prev, { eventName: "FORCE_PUSH" }]);
    }
  };

  const handleLogScreenViewEvent = (state: "enter" | "exit") => {
    Reteno.logScreenView(route.key);

    setLoggedEvents((prev) => [
      ...prev,
      { eventName: "LOG_SCREEN_VIEW_" + state, key: route.key },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      handleLogScreenViewEvent("enter");
      return () => {
        handleLogScreenViewEvent("exit");
      };
    }, []),
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Available options">
          <Button text="Log random event" onPress={handleLogEvent} />
          <Button text="[IOS-ONLY] Force push" onPress={handleForcePushData} />
        </Block>

        {Boolean(loggedEvents.length) && (
          <Block title="Logged events">
            {loggedEvents.map((e, k) => (
              <Text key={`LoggedEvent-${k}`}>{JSON.stringify(e)}</Text>
            ))}
          </Block>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
