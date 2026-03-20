import React, { FC, PropsWithChildren, useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";

type Props = {
  dashed?: boolean;
  label?: string;
  style?: ViewStyle;
  isActive?: boolean;
  isError?: boolean;
};

const Component = React.forwardRef((props: TextComponentProps, ref) => (
  <Body {...props} ref={ref} />
));

const AnimatedText = Animated.createAnimatedComponent(Component);

export const AnimatedCardContainer: FC<PropsWithChildren<Props>> = ({
  dashed,
  label,
  children,
  style,
  isActive = false,
  isError = false,
}) => {
  const rIsActive = useSharedValue(Number(isActive));
  const { theme } = useTheme();

  const rBorderStyles = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      rIsActive.value,
      [0, 1],
      [
        (isError ? theme.error : theme.border) as string,
        theme.active as string,
      ],
    ),
  }));

  const rLabelStyles = useAnimatedStyle(() => ({
    color: interpolateColor(
      rIsActive.value,
      [0, 1],
      [
        (isError ? theme.error : theme.caption) as string,
        theme.darkModeIcon as string,
      ],
    ),
  }));

  useEffect(() => {
    rIsActive.value = withTiming(Number(isActive), animationTimingConfig);
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.container,
        rBorderStyles,
        dashed && { borderStyle: "dashed" },
        style,
      ]}
    >
      {children}
      {label && (
        <AnimatedText
          text={label}
          style={[
            styles.label,
            {
              color: isError ? theme.error : theme.caption,
              backgroundColor: theme.background,
            },
            rLabelStyles,
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    paddingHorizontal: 4,
    position: "absolute",
    top: -12,
    left: 16,
  },
});
