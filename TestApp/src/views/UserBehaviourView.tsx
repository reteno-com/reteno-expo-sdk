import {
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import Reteno from "expo-reteno-sdk";
import { useCallback, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

type LoggedEvent = {
  eventName: string;
  date?: string;
  parameters?: { name: string; value: string }[];
  forcePush?: boolean;
  key?: string;
};

export const UserBehaviourView = () => {
  const [loggedEvents, setLoggedEvents] = useState<LoggedEvent[]>([]);
  const route = useRoute();
  const IN_APP_TRIGGER_EVENT = "IN_APP_TRIGGER_EVENT";

  console.log(route);

  const handleLogEvent = async () => {
    // Use a stable event key so QA can bind one in-app campaign trigger and
    // reliably verify firing behavior on every click.
    const eventName = IN_APP_TRIGGER_EVENT;
    const date = new Date().toISOString();
    const parameters = [
      {
        name: "click_index",
        value: String(loggedEvents.length + 1),
      },
    ];

    const evt = { eventName, date, parameters, forcePush: false };

    const res = await Reteno.logEvent(evt);
    await Reteno.forcePushData();

    if (res.success) {
      setLoggedEvents((prev) => [...prev, evt]);
    }
  };

  const handleForcePushData = () => {
    Reteno.forcePushData();

    setLoggedEvents((prev) => [...prev, { eventName: "FORCE_PUSH" }]);
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
          <Button text="Log in-app trigger event" onPress={handleLogEvent} />
          <Button text="Force push" onPress={handleForcePushData} />
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
