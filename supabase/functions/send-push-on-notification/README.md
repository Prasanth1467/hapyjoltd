# send-push-on-notification

Sends real-time push notifications to mobile devices when a row is inserted into `public.notifications`. Targets users by `target_role` (from `profiles`); permissions are taken from users.

## Deploy

```bash
supabase functions deploy send-push-on-notification
```

## Database Webhook (required)

After deploying, add a **Database Webhook** in Supabase so this function runs on every notification insert:

1. **Dashboard** → **Database** → **Webhooks** → **Create a new webhook**
2. **Name:** e.g. `notification_insert_push`
3. **Table:** `public.notifications`
4. **Events:** tick **Insert**
5. **Type:** **Supabase Edge Functions**
6. **Function:** `send-push-on-notification`
7. Save

No auth header is required for webhook-triggered invocations; the payload includes the new row.
