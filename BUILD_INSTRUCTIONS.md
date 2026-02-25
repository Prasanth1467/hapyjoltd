# Building Hapyjo Ltd for clients (Android APK & iOS)

Use these steps to create installable builds you can give to clients.

---

## Standalone production APK (recommended)

The app is configured as a **standalone production build**: no dev client, no Metro, no PC, no QR code. The APK runs fully on-device and works offline-to-online.

### 1. Set Supabase env for EAS (required for auth)

So Supabase auth works in the built app, set EAS Secrets (they are inlined at build time):

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT_REF.supabase.co" --type string
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --type string
```

Or in [expo.dev](https://expo.dev) → your project → **Secrets** → add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 2. Build standalone APK

```bash
eas build --platform android --profile standalone
```

- Produces a single **APK** with JS bundled inside (no localhost, no dev client).
- Download from the build page and share with clients; they install and run with no PC connection.

Use **standalone** for direct client installs; use **production-apk** or **client-android** if you prefer (they are also non–dev-client builds).

---

## Prerequisites

1. **Expo account** – Sign up at [expo.dev](https://expo.dev) and log in.
2. **EAS CLI** – Install and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```

---

## Android: APK for clients

You can build a single **APK** file and send it to clients (e.g. by email, link, or USB). They install it directly on their Android phones.

### Option A – Direct APK to share (no Play Store)

Best when you want to send the app file directly to clients:

```bash
eas build --platform android --profile client-android
```

- Builds an **APK**.
- When the build finishes, EAS gives you a **download link**.
- Share that link (or the downloaded APK) with clients. They open it on their Android device and install.

### Option B – APK for Play Store submission

If you prefer to publish on Google Play and have users install from the store:

```bash
eas build --platform android --profile production-apk
```

Then submit to Play Store (see “Submitting to stores” below).

---

## iOS: App for iPhone/iPad

Apple does **not** allow installing apps from a random file like Android. Clients get the app in one of these ways:

1. **App Store** (recommended) – You publish the app; clients install from the App Store.
2. **TestFlight** – You invite testers; they install via the TestFlight app (good for beta/testing).
3. **Ad hoc** – You build for a fixed list of device IDs (limited to 100 devices per year); not ideal for “any client”.

### Build for App Store (and TestFlight)

You need an **Apple Developer Program** account ($99/year): [developer.apple.com](https://developer.apple.com).

1. In the project folder, run:
   ```bash
   eas build --platform ios --profile client-ios
   ```
2. First time: EAS will ask you to create or select an Apple Developer account and set up credentials. Follow the prompts.
3. When the build finishes, you get an **.ipa** for App Store (and TestFlight) submission.

### Optional: set iOS bundle identifier

If EAS asks for a bundle identifier, add this to `app.json` under `expo`:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.hapyjo.attendance"
}
```

Use the same identifier as your Android package if you want consistency (`com.hapyjo.attendance`).

---

## Build both platforms

To build Android and iOS in one go:

```bash
eas build --platform all --profile client-android
eas build --platform all --profile client-ios
```

Or build each platform with its client profile:

```bash
eas build --platform android --profile client-android
eas build --platform ios --profile client-ios
```

---

## After the build

- **Android (client-android)**  
  - Open the build page on [expo.dev](https://expo.dev) → your project → Builds.  
  - Download the APK and share it, or share the build URL so clients can download and install.

- **iOS (client-ios)**  
  - Use [EAS Submit](https://docs.expo.dev/submit/introduction/) to send the build to App Store Connect (and then publish to the App Store or enable TestFlight):
    ```bash
    eas submit --platform ios --profile production
    ```
  - Or submit from the Expo dashboard: Builds → select the iOS build → Submit.

---

## Summary

| Goal                         | Command                                                    |
|-----------------------------|------------------------------------------------------------|
| **Standalone APK (no dev client)** | `eas build --platform android --profile standalone`   |
| Android APK to give clients | `eas build --platform android --profile client-android`   |
| iOS app (App Store/TestFlight) | `eas build --platform ios --profile client-ios`         |
| Both in one run             | `eas build --platform all` (then choose the right profile per platform or run twice as above) |

Use **standalone** for a single APK that runs fully on-device (no Metro, no PC). Set EAS Secrets for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` so Supabase auth works in production.
