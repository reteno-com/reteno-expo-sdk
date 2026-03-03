import Reteno from "expo-reteno-sdk";
import { useEffect } from "react";
import { Alert, ScrollView } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const AppInboxMessagesView = () => {
  const handleGetAppInboxMessages = async () => {
    try {
      const data = await Reteno.getAppInboxMessages({});

      if (data) {
        alert(JSON.stringify({ data }));
      }
    } catch (error) {
      alert(JSON.stringify({ error }));
    }
  };

  // NOTE: Only for Android
  //   useEffect(() => {
  //   // Subscribe to unread messages count changes
  //   Reteno.onUnreadMessagesCountChanged();
  //
  //   return () => {
  //     // Unsubscribe from changes in the unread messages count - Android only
  //     Reteno.unsubscribeMessagesCountChanged();
  //     Reteno.unsubscribeAllMessagesCountChanged();
  //   };
  // }, []);
  //

  useEffect(() => {
    // Subscribe to events related to changes in the unread messages count
    const unreadMessagesCountListener = Reteno.unreadMessagesCountHandler(
      (data) => {
        Alert.alert(
          "Unread Messages Count Changed",
          data ? JSON.stringify(data) : data,
        );
      },
    );

    return () => {
      // Remove the subscription when the component unmounts
      unreadMessagesCountListener.remove();
    };
  }, []);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Available options">
          <Button
            text="Get app inbox messages"
            onPress={handleGetAppInboxMessages}
          />
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};
