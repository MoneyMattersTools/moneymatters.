# Supabase Backup-Restore Test — Steps for Ethan to Run

**Status: not yet run.** This is a real gap flagged in SITE_STRATEGY.md's Security & Compliance Checklist — Supabase backups may exist, but nobody has verified a restore actually works. This doc is the procedure to close that gap. I can't run this myself: it requires your Supabase dashboard login, and restore actions are exactly the kind of thing that shouldn't happen without you directly present and in control.

**Before anything else: confirm your plan tier actually includes backups.** Supabase's Free tier has no automatic backups at all. Point-in-time recovery (restore to any moment, not just once a day) is a paid add-on on top of the Pro tier. If you're on Free, there is nothing to test yet — upgrading is the actual prerequisite. Check under Project Settings → Billing, or Database → Backups (if that page shows no backups exist, that confirms it).

**One important caveat on the steps below:** Supabase's dashboard UI changes over time, and I don't have live access to your project to confirm the exact current button/menu labels. Treat the steps below as the *procedure and safety checklist* — the part that stays true regardless of UI changes — and cross-check exact navigation against Supabase's own current dashboard and their official docs (supabase.com/docs) at the time you run this, rather than trusting my labels blindly if something doesn't match what you see.

## Why this matters

If MoneyMatters's Supabase project were ever corrupted, accidentally wiped, or hit by a bad migration, "we have backups" is only true if a restore has actually been proven to work. An unverified backup is a guess, not a safety net. This is a one-time (or occasional) real-world test, not something that needs to happen every round.

## Safety rules — read before starting

1. **Never test a restore against the live production project as your first attempt.** If Supabase's restore flow offers "restore to a new project" (this has existed as a feature on some tiers), use that — it creates a separate copy, so a mistake can't touch real user data. If your plan only supports in-place restore (older/cheaper tiers sometimes work this way), see rule 2.
2. **If only in-place restore is available**, do this during a real low-traffic window (late night, no active users), and take a fresh manual export immediately before you start (see step 1) — so that even if the restore goes wrong, you have a way back to *right now*, not just to whatever backup you're testing.
3. **Tell nobody to use the site during the test window.** A restore that succeeds but rolls back a few hours of real signups/data is still a real problem if users are actively on the site while it happens.
4. **Do this on a day you have time to fully finish it**, not squeezed in before something else — if it goes sideways, you want room to sort it out calmly.

## Steps

1. **Take a fresh manual safety export first**, regardless of what backup you're about to restore. In the Supabase dashboard: Database → Backups (or Settings → Database, depending on current UI) should have a manual "trigger backup" or you can use `pg_dump` against your connection string from a terminal if you have one available. This is your real safety net — confirm it downloaded/completed before proceeding.

2. **Find your available backups.** Database → Backups should list scheduled backups with timestamps. Note how far back they go (this tells you your actual recovery window, which you should know regardless of whether you ever need it).

3. **Start a restore using the newest available backup — not because you need to go back that far, but because it's the fastest way to prove the mechanism works.** Look for a "Restore" action next to a backup entry. If Supabase offers a choice between "restore in place" and "restore to a new project," pick the new-project option per rule 1 above.

4. **Watch it through to completion.** Restores can take anywhere from a few minutes to longer depending on database size — don't assume it's done just because the dashboard stops showing a spinner; look for an explicit success/complete state.

5. **Verify the restored data is actually real**, not just that the process reported success. Pick 2-3 things you can check concretely:
   - Log into the restored project's Table Editor and confirm the `users` table has roughly the row count you expect, and that a specific real record you can recognize (e.g. your own test account) has the right data.
   - Spot-check `advisor_review_requests` and `advisors` the same way.
   - If you restored to a new project, get its connection URL/keys from Project Settings → API and confirm you *could* point the site at it (you don't need to actually switch anything over — just confirm the credentials exist and the API responds, e.g. by hitting `<restored-project-url>/rest/v1/users?limit=1` with the anon key).

6. **Clean up.** If you restored to a new project, you can delete that project once you're satisfied (or keep it a few days as extra insurance, then delete it — Supabase projects on most tiers have a cost, so don't leave an unused one running indefinitely).

7. **Record the result somewhere durable** — even a one-line note ("Ran a restore test on [date], took X minutes, data verified correct") saved in your own notes or this file is enough. The next time this needs to happen, you (or I) will want to know it's been done before and roughly how long it took.

## If something goes wrong

Stop, don't improvise further changes on top of a bad state. Your fresh manual export from step 1 is the way back to where you started. If you're not sure how to apply it, that's a good moment to loop me back in with exactly what you're seeing — screenshots of any error help a lot more than a description.
