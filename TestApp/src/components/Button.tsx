import { FC } from "react";
import { Text, TouchableOpacity } from "react-native";

type Props = {
  text: string;
  onPress: () => void;
};

export const Button: FC<Props> = (props) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      activeOpacity={0.75}
      style={{
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#ededed",
      }}
    >
      <Text>{props.text}</Text>
    </TouchableOpacity>
  );
};
