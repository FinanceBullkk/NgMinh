# Migrate to Singapore (lower VN latency)

Goal: cut VN↔server latency. Move Supabase **and** the Vercel function to **Singapore**
(`ap-southeast-1` / Vercel `sin1`) so compute + DB are co-located and ~35ms from Vietnam
(vs Tokyo ~80ms). Supabase region is **immutable** → create a NEW project in Singapore and
cut over. The 7 migrations are region-portable (no localhost/ports), so schema rebuild is
just `supabase db push`.

> Do the steps in order. App stays on the old (Tokyo) project until step 7 (env swap), so
> there is no downtime until you choose to cut over.

## 0. Prereqs
- Supabase CLI logged in (`supabase login`); free tier allows 2 projects (old + new OK).
- Vercel access to project `ng-minh`.
- Decide data path (step 4): **fresh** (recommended — current prod data is just test rows)
  or **copy** (pg_dump) if you have real data to keep.

## 1. Create the Singapore project
Supabase dashboard → New project → **Region: Southeast Asia (Singapore)** → Postgres **17**
(matches `supabase/config.toml` db.major_version). Note the new **project ref**.

## 2. Push the schema (7 migrations)
```bash
# from repo root
supabase link --project-ref <NEW_SG_REF>      # re-link CLI to the SG project
supabase db push                               # applies 001..007 in order
```
Applies enums → tables → indexes → RLS → triggers → new-user sentiment seed → weight.
Run once (DDL not idempotent).

## 3. Get SG credentials
Dashboard (SG project) → Settings → API: **Project URL** (`https://<NEW_SG_REF>.supabase.co`),
**Publishable key** (`sb_publishable_…`), **service_role** secret (`sb_secret_…`).

## 4. Data — FRESH (chosen)
No data copy. The current prod data is test-only, so start clean: after step 6 you create
the manager user (the seed trigger adds 3 sentiments), then re-enter the few employees/notes
by hand in the app. (No pg_dump, no auth.users copy.)

## 5. Pin the Vercel function to Singapore
Create `vercel.json` at repo root (this is the one allowed use — region pinning, NOT
`output: standalone`):
```json
{ "regions": ["sin1"] }
```
Or dashboard: Project → Settings → Functions → **Function Region → Singapore (sin1)**.
Do this **with** the env swap (step 7) — pinning to sin1 while the DB is still in Tokyo would
be slower, so change them together.

## 6. Provision the manager account
SG dashboard → Authentication → Users → Add user → email + password → tick **Auto Confirm
User**. Verify the trigger seeded 3 `sentiment_options` for the user.

## 7. Cut over Vercel env (the switch)
Vercel → Settings → Environment Variables → update for **Production** (and Preview):
| Var | New value |
|-----|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<NEW_SG_REF>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | SG `sb_publishable_…` |
| `SUPABASE_SERVICE_ROLE_KEY` | SG `sb_secret_…` (server-only, Sensitive) |

Then **Redeploy** (env is build-time inlined for the `NEXT_PUBLIC_*` ones). If you added
`vercel.json`, committing + pushing it triggers the redeploy and applies sin1 together.

## 8. Auth URLs (SG project)
SG dashboard → Authentication → URL Configuration: **Site URL** =
`https://ng-minh.vercel.app`; add it to **Redirect URLs**; add preview pattern
`https://*-<team>.vercel.app` if used.

## 9. Verify
- Login works on https://ng-minh.vercel.app (new SG project).
- Click around Roster/Feed/Settings — should feel snappier (1 short VN↔SG round trip/page).
- `x-vercel-id` on a dynamic response should show `sin1` as the function region.
- RLS isolation intact; `/settings/export` returns data when authed.

## 10. After it's confirmed good
- Regenerate local types if schema drifted: `npm run gen:types` (while linked to SG).
- Pause/delete the old Tokyo project to avoid confusion (keep a final export first).
- Update `docs/deployment-guide.md` "Live deployment" block (region = Singapore, new ref).

## Rollback
Env vars are the switch. To revert: set the 3 Vercel env vars back to the Tokyo project +
remove/relax `vercel.json` region (or set `hnd1`) → redeploy. Old project untouched until
step 10, so rollback is instant.

## Notes
- Data path = **fresh** (chosen). Manager account is re-created in step 6.
- Free tier = 2 projects max; if already at 2, pause an unused one before creating SG.
