import {
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import Reteno from "expo-reteno-sdk";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Block, Button, Input, ScreenContainer } from "src/components";

type LoggedEvent = {
  eventName: string;
  date?: string;
  parameters?: { name: string; value: string }[];
  forcePush?: boolean;
  key?: string;
};

type EventParameter = { name: string; value: string };

export const UserBehaviourView = () => {
  const [loggedEvents, setLoggedEvents] = useState<LoggedEvent[]>([]);
  const [eventName, setEventName] = useState("IN_APP_TRIGGER_EVENT");
  const [parameters, setParameters] = useState<EventParameter[]>([
    { name: "click_index", value: "1" },
  ]);
  const route = useRoute();

  console.log(route);

  const changeParameter = (
    index: number,
    key: keyof EventParameter,
    value: string,
  ) => {
    setParameters((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    );
  };

  const addParameter = () => {
    setParameters((prev) => [...prev, { name: "", value: "" }]);
  };

  const removeParameter = (index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogEvent = async () => {
    const date = new Date().toISOString();
    const filledParameters = parameters.filter((p) => p.name);

    const evt = {
      eventName,
      date,
      parameters: filledParameters,
      forcePush: false,
    };

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
        <Block title="Event to log">
          <Input
            value={eventName}
            onChangeText={setEventName}
            placeholder="Event name"
          />

          {parameters.map((p, i) => (
            <View
              key={`Parameter-${i}`}
              style={{ flexDirection: "row", gap: 8 }}
            >
              <View style={{ flex: 1 }}>
                <Input
                  value={p.name}
                  onChangeText={(v) => changeParameter(i, "name", v)}
                  placeholder="Param name"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={p.value}
                  onChangeText={(v) => changeParameter(i, "value", v)}
                  placeholder="Param value"
                />
              </View>
              <Button text="✕" onPress={() => removeParameter(i)} />
            </View>
          ))}

          <Button text="Add parameter" onPress={addParameter} />
        </Block>

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
