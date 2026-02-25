import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, layout, cardShadow } from '@/theme/tokens';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, className = '', ...props }: CardProps) {
  return (
    <View
      style={[styles.card, style]}
      className={className}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.cardRadius,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
});
