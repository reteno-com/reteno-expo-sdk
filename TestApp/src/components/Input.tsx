import React, { FC, PropsWithChildren, useCallback, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

type InputProps = TextInputProps;

export const Input: FC<InputProps> = (props) => {
  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[styles.input, { color: "#121212" }]}
        cursorColor={"#ededed"}
        autoCorrect={false}
        autoComplete="off"
        autoCapitalize="none"
        textAlign="center"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "100%",
    textAlign: "center",
  },
  container: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ededed",
    borderRadius: 8,
  },
});
