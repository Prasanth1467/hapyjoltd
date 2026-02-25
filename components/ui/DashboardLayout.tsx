import React from 'react';
import { View, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { colors, layout } from '@/theme/tokens';

interface DashboardLayoutProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: React.ReactNode;
  scroll?: boolean;
}

/**
 * Shared layout wrapper for all dashboards and forms.
 * Enforces: horizontal padding 16px, vertical card spacing 16px, 8px grid alignment.
 */
export function DashboardLayout({ children, scroll = true, ...scrollProps }: DashboardLayoutProps) {
  const contentStyle = {
    paddingHorizontal: layout.screenPaddingHorz,
    paddingVertical: layout.cardSpacingVertical,
    flexGrow: 1,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.fill, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
});
