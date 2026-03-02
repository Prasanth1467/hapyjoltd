/**
 * Registers the current device's Expo push token with Supabase (push_tokens).
 * Permissions are taken from the authenticated user; RLS ensures user can only
 * insert/update their own token.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

/** Call once when user is authenticated. Requests permission, gets token, upserts into push_tokens. */
export async function registerPushTokenForUser(userId: string): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId ?? undefined,
  });
  const expoPushToken = tokenData.data;
  if (!expoPushToken || !expoPushToken.startsWith('ExpoPushToken[')) return;

  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
    },
    {
      onConflict: 'user_id,expo_push_token',
      ignoreDuplicates: false,
    }
  );
}
