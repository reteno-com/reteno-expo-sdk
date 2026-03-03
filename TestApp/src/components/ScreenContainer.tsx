import { FC, PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const ScreenContainer: FC<PropsWithChildren> = ({ children }) => {
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    backgroundColor: "#dedede",
    flex: 1,
    gap: 8,
  },
});
