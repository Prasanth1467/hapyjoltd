# UMUGWANEZA LTD – Audit & Build Docs

Use these docs to build the UMUGWANEZA web app on the **same Supabase DB** as Hapyjo (mobile app), with a theme that matches the existing site. **Vehicle sync** keeps the same fleet visible in both Hapyjo (mobile) and UMUGWANEZA (web) via the same database.

**Terminology:** Use **"Operators"** (not "Driver" or "Driver–Machine") for machine operators in UI and docs.

**Demo:** Use these docs as the checklist when doing the demo run-through.

---

| File | Purpose |
|------|--------|
| **00_EXPLANATION.md** | Why same DB, what “sync” means (schema + vehicle sync), schema strategy (umugwaneza vs public), auth coexistence. |
| **01_AUDIT_A_TO_Z.md** | Full audit: schema, vehicle sync, RLS, overlap prevention, reports, CSV, security, production checklist. |
| **02_REPLIT_MASTER_PROMPT.md** | One long prompt to paste into Replit Core to build the full app (theme, schema, vehicle sync, grocery, rental, reports). |
| **03_STEPS_TO_BUILD.md** | Ordered steps: DB (including vehicle sync) → auth → theme → grocery → rental → dashboard → reports → CSV → production. |

**Recommended order:** Read 00 → 01, then use 02 for Replit (or as spec), and 03 to implement or verify step by step.
