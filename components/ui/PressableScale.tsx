import React from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = { damping: 15, stiffness: 400 };
const ACTIVE_SCALE = 0.97;

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function PressableScale({ children, style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(ACTIVE_SCALE, springConfig);
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, springConfig);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      style={[animatedStyle, StyleSheet.flatten(style)]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={props.onPress}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
