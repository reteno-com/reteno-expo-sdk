import Reteno from "expo-reteno-sdk";
import { InboxMessage } from "expo-reteno-sdk/build/types";
import { useEffect, useState } from "react";
import { Platform, ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const AppInboxMessagesView = () => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [count, setCount] = useState(0);

  const handleGetAppInboxMessages = async () => {
    try {
      const data = await Reteno.getAppInboxMessages({});

      if (data.messages) {
        const freshMessages: InboxMessage[] = data.messages
          .filter((m: InboxMessage) => m.isNew)
          .sort(
            (x: InboxMessage, y: InboxMessage) =>
              new Date(x.createdDate).getTime() -
              new Date(y.createdDate).getTime(),
          );
        setMessages(freshMessages);
      }
    } catch (error) {
      alert(JSON.stringify({ error }));
    }
  };

  const handleReadLastInboxMessage = async (ids: string | string[]) => {
    try {
      console.log(">>>", ids);
      // TODO: should be parsed inside module
      const data = await Reteno.markAsOpened(ids);

      if (data) {
        setMessages((prev) => {
          if (prev.length === 1) return [];
          return prev
            .filter((p) => p.isNew)
            .sort(
              (x: InboxMessage, y: InboxMessage) =>
                new Date(x.createdDate).getTime() -
                new Date(y.createdDate).getTime(),
            );
        });
      }
    } catch (error) {
      alert(JSON.stringify({ error }));
    }
  };

  const handleReadAllInboxMessages = async () => {
    try {
      const data = await Reteno.markAllAsOpened();

      if (data) {
        setMessages([]);
      }
    } catch (error) {
      alert(JSON.stringify({ error }));
    }
  };

  // NOTE: Only for Android
  useEffect(() => {
    const unreadMessagesCountListener = Reteno.onUnreadMessagesCountChanged(
      (data) => {
        setCount(data.count);
      },
    );

    return () => {
      if (Platform.OS === "android") {
        // Unsubscribe from changes in the unread messages count - Android only
        Reteno.unsubscribeMessagesCountChanged();
        Reteno.unsubscribeAllMessagesCountChanged();
      } else {
        // Remove the subscription when the component unmounts
        unreadMessagesCountListener.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Subscribe to events related to changes in the unread messages count
    let unreadMessagesCountListener: any;
    if (Platform.OS === "ios") {
      unreadMessagesCountListener = Reteno.onUnreadMessagesCountChanged(
        (data) => {
          setCount(data.count);
        },
      );
    }

    return () => {
      if (Platform.OS === "ios") {
        // Remove the subscription when the component unmounts
        unreadMessagesCountListener.remove();
      }
    };
  }, []);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Available options">
          <Button
            text="Get fresh app inbox messages"
            onPress={handleGetAppInboxMessages}
          />

          {Boolean(messages.length) && (
            <>
              <Button
                text="Read last"
                onPress={() => {
                  if (Platform.OS === "ios") {
                    handleReadLastInboxMessage([messages[0].id]);
                  } else {
                    handleReadLastInboxMessage(messages[0].id);
                  }
                }}
              />

              <Button text="Read all" onPress={handleReadAllInboxMessages} />
            </>
          )}
        </Block>
        <Block title={`Messages: ${count}`}>
          {messages.map((m) => (
            <Text key={`Message-${m.id}`}>{JSON.stringify(m)}</Text>
          ))}
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};
