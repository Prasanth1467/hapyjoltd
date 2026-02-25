import React from 'react';
import { View, ScrollView, ScrollViewProps } from 'react-native';
import { layout } from '@/theme/tokens';

interface ScreenContainerProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: React.ReactNode;
  /** If true (default), content is in a ScrollView. If false, just a padded View. */
  scroll?: boolean;
  /** Extra class for the inner content container */
  contentClassName?: string;
}

/**
 * Wraps screen content with consistent padding (16px). Use for main screens and forms.
 */
export function ScreenContainer({
  children,
  scroll = true,
  contentClassName = '',
  ...scrollProps
}: ScreenContainerProps) {
  const contentStyle = { paddingHorizontal: layout.screenPaddingHorz, paddingVertical: layout.cardSpacingVertical, flexGrow: 1 };

  if (scroll) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <View className={contentClassName}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 ${contentClassName}`} style={contentStyle}>
      {children}
    </View>
  );
}
