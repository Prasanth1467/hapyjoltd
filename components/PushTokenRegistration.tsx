/**
 * Registers the device for real-time push notifications when the user is logged in.
 * Permissions are taken from the authenticated user (RLS on push_tokens).
 */
import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerPushTokenForUser } from '@/lib/registerPushToken';
import { useAuth } from '@/context/AuthContext';

// Optional: show notification when app is in foreground (default is no banner)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function PushTokenRegistration() {
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      registered.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      if (registered.current) return;
      try {
        await registerPushTokenForUser(user.id);
        if (!cancelled) registered.current = true;
      } catch {
        // ignore (e.g. permission denied, no projectId in dev)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { linkId?: string; linkType?: string };
      if (data?.linkId && data?.linkType === 'issue') {
        // Could navigate to issue screen; app will refetch on focus via Realtime
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}
