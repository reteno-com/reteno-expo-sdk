import Reteno from "expo-reteno-sdk";
import { useCallback, useEffect } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { Block, ScreenContainer } from "src/components";

export const ActionButtonsView = () => {
  const onRetenoPushButtonClicked = useCallback((event) => {
    Alert.alert(
      "onRetenoPushButtonClicked",
      event ? JSON.stringify(event) : event,
    );
  }, []);

  useEffect(() => {
    const pushButtonClickListener = Reteno.setOnRetenoPushButtonClickedListener(
      onRetenoPushButtonClicked,
    );

    return () => pushButtonClickListener.remove();
  }, [onRetenoPushButtonClicked]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Description">
          <Text>Check Action Buttons from Reteno Dashboard</Text>
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};
