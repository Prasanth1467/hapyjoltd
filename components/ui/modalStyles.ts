import { StyleSheet } from 'react-native';
import { colors, form, spacing, typography } from '@/theme/tokens';

export const modalStyles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  btn: {
    minWidth: 100,
    minHeight: form.buttonHeight,
    justifyContent: 'center',
  },
  btnSecondary: {
    minWidth: 100,
    minHeight: form.buttonHeight,
    justifyContent: 'center',
  },
  btnTextSecondary: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: form.labelFontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: form.inputRadius,
    paddingHorizontal: form.inputPadding,
    paddingVertical: form.inputPadding,
    fontSize: typography.body.fontSize,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
});
