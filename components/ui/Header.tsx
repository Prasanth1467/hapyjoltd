import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, layout, typography } from '@/theme/tokens';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function Header({ title, subtitle, leftAction, rightAction }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {leftAction && <View style={styles.leftAction}>{leftAction}</View>}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: layout.screenPaddingHorz,
    paddingVertical: layout.grid,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftAction: { marginRight: 12 },
  titleWrap: { flex: 1, minWidth: 0 },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightAction: { marginLeft: 12 },
});
