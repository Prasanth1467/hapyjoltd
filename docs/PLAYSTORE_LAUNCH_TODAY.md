# Play Store launch – complete guide (launch today)

One doc with everything: checklist, image specs (your icon is already useful), and whether testing is mandatory.

---

## Is testing with testers mandatory before going live?

**No. It is not mandatory.**

- You **can** publish directly to **Production** and your app will go live for everyone (in the countries you chose).
- **Internal testing** and **Closed testing** are **optional**. Use them if you want a small group to try the app before the whole world sees it.
- **Summary:** Launch today = create app → fill Store listing + App content + Content rating + Pricing & distribution → upload your AAB to **Production** → Submit for review. No tester track required.

Your friend might mean:

- **Option A:** “Test the app yourself before submitting” → **Yes, recommended** (run through login, main screens, no crash).
- **Option B:** “Use Google’s Internal/Closed testing track” → **Optional**, not required for going live.

---

## 1. Images and graphics (what you need)

### App icon (you already have this)


| Asset        | Size             | Format                       | Your file                                         | Status                                  |
| ------------ | ---------------- | ---------------------------- | ------------------------------------------------- | --------------------------------------- |
| **App icon** | **512 × 512 px** | PNG, 32-bit, no transparency | `assets/images/hapyjo_playstore_icon_v2_512.png`  | Use this for Play Console store listing |
| (High-res)   | 1024 × 1024      | PNG                          | `assets/images/hapyjo_playstore_icon_v2_1024.png` | Useful for app; store accepts 512       |


**Your existing icon is useful and valid** – use `hapyjo_playstore_icon_v2_512.png` for the Play Store “App icon” field. No need to create a new icon unless you want a different design.

### Feature graphic (you need to create or have this)


| Asset               | Size              | Format      | Notes                                                                                  |
| ------------------- | ----------------- | ----------- | -------------------------------------------------------------------------------------- |
| **Feature graphic** | **1024 × 500 px** | PNG or JPEG | Banner at top of your store page. Create with app name/logo or a simple branded strip. |


- No mandatory text; can be logo + solid or gradient background.
- If you don’t have a designer: use Canva/Figma with 1024×500 canvas, put your logo and “Hapyjo” text, export PNG.

### Screenshots (you need to create these)


| Device     | Minimum                 | Size (example)              | Notes                                                                  |
| ---------- | ----------------------- | --------------------------- | ---------------------------------------------------------------------- |
| **Phone**  | At least **2**          | 320–3840 px on shorter side | Capture real app screens (login, home, vehicles, notifications, etc.). |
| 7" tablet  | 1 if you support tablet | 1200 × 1920 px              | Only if “Tablet” is selected in device categories.                     |
| 10" tablet | 1 if you support tablet | 1600 × 2560 px              | Same as above.                                                         |


- Use an emulator or real device: run the app, open the main screens, take screenshots. No placeholders or fake UI.
- Add short captions in the Play Console if you want (optional).

### Quick image checklist

- **App icon:** Upload `assets/images/hapyjo_playstore_icon_v2_512.png` (your icon is useful – use it).
- **Feature graphic:** Create 1024×500 PNG/JPEG (branded banner).
- **Screenshots:** At least 2 phone screenshots from the real app.

---

## 2. Store listing (all fields in one place)


| Field                  | Limit       | What to put                                                                                                                               |
| ---------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **App name**           | 30 chars    | e.g. **Hapyjo** or **Hapyjo Ltd**                                                                                                         |
| **Short description**  | 80 chars    | One line: what the app is (e.g. “Field attendance, vehicles, expenses and reports for your team.”)                                        |
| **Full description**   | 4000 chars  | What it does, who it’s for (drivers, supervisors, accountants), main features (sites, vehicles, trips, expenses, reports, notifications). |
| **App icon**           | 512×512 PNG | `assets/images/hapyjo_playstore_icon_v2_512.png`                                                                                          |
| **Feature graphic**    | 1024×500    | Your 1024×500 banner                                                                                                                      |
| **Screenshots**        | ≥2 phone    | Real app screens                                                                                                                          |
| **Privacy policy URL** | Required    | Public URL to your privacy policy (host on your site or use a generator).                                                                 |


---

## 3. App content (Policy) – avoid rejection

Fill every section that appears under **Policy → App content**:


| Section                    | What to do                                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Privacy policy**         | Same URL as in Store listing. Required.                                                                                                                                                                                |
| **App access**             | “All functionality requires login” (or similar). If reviewers need access: “Provide test credentials” and add e.g. [test@yourcompany.com](mailto:test@yourcompany.com) / TestPassword123 (create a real test account). |
| **Ads**                    | “No, my app does not contain ads” (unless you do).                                                                                                                                                                     |
| **Data safety**            | Declare data you collect: e.g. Email, Location, Device ID (for push). Say if shared (e.g. with Supabase), optional/required. Be accurate – wrong answers cause rejections.                                             |
| **Content rating**         | Run the questionnaire (work/business app → usually low rating). Submit and get certificate.                                                                                                                            |
| **Target audience**        | Select age groups (e.g. 18+ if work-only).                                                                                                                                                                             |
| **News app**               | No (unless it is).                                                                                                                                                                                                     |
| **COVID-19**               | No (unless it is).                                                                                                                                                                                                     |
| **Financial**              | No (or declare if you have payments).                                                                                                                                                                                  |
| **Health**                 | No (or declare).                                                                                                                                                                                                       |
| **Government/Official**    | No (or declare).                                                                                                                                                                                                       |
| **User-generated content** | No (or declare if users post content).                                                                                                                                                                                 |
| **Data deletion**          | If users can delete account in app, describe how. If not: “Users can request deletion by contacting [email].”                                                                                                          |


---

## 4. Pricing & distribution

- **Free or paid:** Choose one.
- **Countries:** Select (e.g. Rwanda only or all).
- **Device categories:** Phone (and Tablet if you support it).
- Confirm compliance with programme policies.

---

## 5. Build and release (today)

1. **Build AAB (production):**
  ```bash
   eas build --platform android --profile production
  ```
2. **Submit to Play Console:**
  ```bash
   eas submit --platform android --profile production --latest
  ```
   Or download the AAB from EAS and upload manually in **Release → Production**.
3. **In Play Console:** Create new **Production** release → upload AAB → add release notes (e.g. “Initial release – 1.0.0”) → **Review release** → **Start rollout to Production**.
4. **Review:** First review often 1–7 days. After approval, the app is live.

---

## 6. Pre-submit checklist (launch today)

- EAS secrets set: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Store listing: name, short + full description, **icon (your 512px is useful)**, feature graphic 1024×500, ≥2 screenshots, privacy policy URL
- App content: Privacy policy, App access (+ test account if needed), Ads, **Data safety**, **Content rating**, Target audience, other declarations
- Pricing & distribution: free/paid, countries
- Production release: AAB uploaded, release notes, submit for review

---

## 7. Tester question again

- **Mandatory to use Internal/Closed testing?** **No.** You can go straight to Production and launch today.
- **Mandatory to test the app yourself before submitting?** Not enforced by Google, but **strongly recommended** (quick smoke test: install build, login, open main screens, confirm no crash).

Use this doc as your single reference for launching today; your existing icon is useful – use the 512px asset for the store.