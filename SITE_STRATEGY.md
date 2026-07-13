# MoneyMatters — Site Strategy
*Source of truth. Supersedes prior homepage/tools copy. Last updated: 2026-07-11.*

## 1. Positioning

**MoneyMatters is a financial diagnostic, not a tool library.**

Old framing: "here's a shelf of calculators, pick one." New framing: "answer a few questions, see where you stand, get pointed at what to do next — a tool, a advisor, or the community." The diagnostic is the product surface; the calculators and advisor network are what it routes you to.

This is the structural fix for the About Us / Privacy Policy contradiction (Section 6) and the reason the homepage rebuild isn't just a copy swap — it's a different entry mechanic.

## 2. Conversion Funnel (locked)

Land, choose one: Financial Health Score OR Net Worth (pick 1). First question in that flow is email — framed as "enter your email to receive your full results," not a generic newsletter ask. Remaining diagnostic questions follow. On submit, a verification email is sent with a link back to the site; clicking it verifies the email, auto-creates an account, and unlocks the full result plus every other tool (no separate signup step — the verification IS the account creation). From there: community CTA (Discord) and the other diagnostic are surfaced as natural next steps. End goal of the whole sequence: advanced tool / subscription purchase, and advisor connection — recommended either from the vetted list directly or via community-sourced good experiences.

Both tools are in scope for the same build phase — see Section 10 and BUSINESS_PLAN.md roadmap.

**Technical note:** this is a passwordless "magic link" auth pattern — standard, not unusual, but it's a real build item (token generation, expiry, Airtable account record, session handling on return) rather than a copy change. Flagging so it's scoped correctly for Session +1, not treated as a quick add.

## 3. Homepage Architecture

1. Hero — two cards, above the fold, equal visual weight: "Check your Financial Health Score" / "See your Net Worth." First interaction is a choice.
2. Email question — first question in the flow, framed as "enter your email to get your full results," not a generic signup.
3. Remaining diagnostic questions.
4. Verification screen — "Check your email to see your results." Email contains a link back to the site.
5. Return visit (post-click) — email verified, account auto-created, full result unlocked, no separate password/signup step.
6. Next-step prompts — the other diagnostic, the broader tool library, and Discord, surfaced together once verified, not sequentially forced.
7. Routing toward monetization — advanced tool/subscription upsell and advisor match (from vetted list or community-sourced recommendation) surfaced based on result and engagement, not on every screen.
8. Trust/differentiation strip — replaces the old feature-bullet marquee. See Section 4.
9. Footer — corrected copyright, real nav.

Users who skip both diagnostics can still reach the tools page directly via nav — don't force it, just don't lead with it.

**Access model (confirmed):** About Us, Tools, and Blog stay public and crawlable — no auth wall, no gating, ever. Only community access, saved results on return visits, and advisor connection require a completed diagnostic with a verified email.

## 4. Marquee — Rewrite (kill the feature-bullet scroll)

Old marquee was a 12-item product-feature list ("pay once," "no subscriptions"). That's not the story anymore — some tools *do* stay paid, and the pitch is diagnosis + connection, not ownership. Replacing with a shorter, slower-moving strip that carries brand voice instead of a feature dump:

> You can't fix what you can't see. See it first. ● Free in under 2 minutes. ● No login, no upsell, no catch. ● Real advisors, actually vetted. ● Your data, your call. ● Built by people who've been confused too.

Six items, not twelve. Slower scroll speed. This is copy-ready — implement as-is or treat as a first draft for the code session.

## 5. Homepage Copy — Final

Hero (two equal-weight entry points):
> Where do you actually stand with money?
> Pick a starting point. Takes less than 2 minutes.
>
> [Check my Financial Health Score]   [See my Net Worth]

Email question (first question in the flow):
> Enter your email to get your full results. We will send you a link — no password needed.

Verification screen (after diagnostic questions submitted):
> Almost there. Check your email and click the link to see your results.

Post-verification result (dynamic, score-dependent tone — draft the "needs work" tier, Health Score path):
> Your Financial Health Score: 58
> You are managing the basics, but a few gaps are costing you more than you think.
> [See what is driving this]

Next-step prompt (shown on the verified results page, all three together, not sequential):
> See your Net Worth too | Join the community | Explore all tools

Advisor CTA (shown when result signals a real gap, or after meaningful engagement):
> Talk to someone who can actually help
> We will match you with a fee-only, CFP-certified advisor, vetted for fiduciary duty — or see who the community recommends.
> [Get matched]  [See community recommendations]

Advanced tool / subscription CTA (shown post-engagement, not on first visit):
> Want the full picture, ongoing? [See advanced tools]

Tool library intro (replaces "Smart tools for smart money decisions"):
> Want to go deeper on one thing?
> Calculators for budgeting, investing, retirement, and net worth — transparent formulas.

Community teaser:
> You are not figuring this out alone
> Join the Discord — real people working through the same budgeting, investing, and debt questions, in real time.
> [Join the community]

## 6. About Us / Privacy Policy — Contradiction Fix

Both pages currently make promises incompatible with the referral-fee model:
- About Us: *"We don't earn referral fees from brokers, banks, or insurers... We don't sell your data."*
- Privacy Policy: *"We will never sell, rent, or share your personal information with third parties for marketing purposes"* and *"We do not collect or store any financial data."*

**Fix applied below.** Principle used: don't promise "no referral fees" — promise *vetting standards* and *consent-based sharing*, which is the actually-defensible claim.

### About Us — replacement paragraph
> ### How we make money (and why it doesn't compromise you)
> MoneyMatters is free to use because we're paid by the advisors in our network — not by you. When you choose to connect with an advisor, we may receive a referral fee. That fee never affects which advisor you're matched with: every advisor in our network is independently vetted for CFP® certification, fee-only compensation, and fiduciary duty, full stop. We don't get paid more for pushing you toward any one advisor, product, or outcome. Your data is only shared with an advisor when you explicitly choose to connect — never by default, never sold to anyone else.

### Privacy Policy — replacement sections
> ### Information We Collect
> In addition to newsletter and contact form signups, our diagnostic and calculator tools collect the financial information you enter (income, balances, goals) in order to generate your results and, if you choose, match you with a financial advisor.
>
> ### How We Use Your Information
> We use your information to generate your results, save your progress, send relevant follow-ups, and — only with your explicit, separate consent — share it with a financial advisor you choose to connect with. We do not sell your data. We do not share it with advisors, or anyone else, without your consent for that specific purpose.
>
> ### Your Choices
> You can withdraw consent to be matched with an advisor at any time, and you can request deletion of your data by contacting us. Advisor sharing is opt-in per connection — not a blanket agreement made at signup.

**Not in scope today:** full CCPA/state-disclosure language and the delete-my-data workflow — those land with the Session +2 data capture build, per your compliance attorney gate before first paid referral.

## 7. Design Differentiation ("doesn't look like every other finance site")

Requirement: unique feel/interface, not just a reskinned template — carries through to the eventual app. Within your existing guardrails (editorial-modern, no experimental nav):

- **The diagnostic itself is the differentiator**, not a visual gimmick. Most competitors (NerdWallet, Mint-likes, advisor-matching sites) lead with a form or a tool grid. Nobody in this space leads with a *scored, conversational quiz* as the homepage itself. That's the "note it's unique" moment — happens in the first 10 seconds, not in the color palette.
- Score reveal should feel considered, not like a form-submit refresh — a single focused transition (score count-up, one illustrated state per score band), reusing your existing abstract SVG curve motif as the visual backbone rather than introducing a new icon system.
- Keep Fraunces/Inter, gold/green/cream — the *interaction model* is the differentiator, not new type or color.
- This same diagnostic-first pattern should be the app's entry point too — one flagship interaction, not a dashboard of five tools on first open.

## 8. Copyright Fix (this session — no code, but flagging exact locations for the fix)

Confirmed via live-site fetch, agency copyright still live on:
- https://www.money-matters.site/tools
- https://www.money-matters.site/blogs/blogs-home

Both link to ambitiousmarketingsolutions.com. Every other page already reads © 2025 MoneyMatters. — correct. Fix: find-and-replace the footer block on those two pages to match the others. Instructions in chat.

## 9. Liquidity-Event Landing Pages (secondary track, SEO/traffic feeder — not core focus)

Not a pivot — mass-market diagnostic-first mission stays primary, this is a bolt-on top-of-funnel layer. High-net-worth "moment" audiences (recently sold a business, inheritance, NIL/pro athlete money, seed-funded founders) are lower-volume but high-intent and high-value-per-referral, worth capturing without redesigning the site around them.

**Mechanic:** dedicated landing pages per moment type, copy pre-framed to that situation, routing into the same core diagnostic funnel (no new mechanic). Requires: advisor specialization tags in Airtable (equity comp, business-sale tax, athlete finances, inheritance/estate) so these leads route to advisors who actually handle that work.

**Content:** four evergreen SEO posts to start (one per moment type), owned by the marketing agent once it has a MoneyMatters-specific brief — separate session, not touching the agent today.

**Not resolved yet:** exact landing page URLs/copy, and whether these leads justify a different (higher) referral fee tier given deal size — worth a pricing pass once the core funnel is live and generating data.

## 10. Open Items / Confirm Before Next Session

- [x] Entry point: both Financial Health Score and Net Worth built as equal-weight web tools, user picks one first
- [x] Funnel order: email-first (magic link), verification creates account, unlocks full results + all tools
- [x] Advanced tools pricing: $10 each. Subscription: $10/month (all advanced tools + webinars + free advisor sessions). Tiering/expanded inclusions to be built out as more content exists.
- [ ] Diagnostic question set for Financial Health Score (5–8 questions) and Net Worth inputs — draft next session alongside the rebuild
- [ ] Confirm score bands / tone copy for all tiers (only "needs work" tier drafted above as example)
- [ ] Liquidity-event moment landing pages (Section 9): confirm URLs/copy, advisor specialization tags, referral fee tier
- [ ] Advisor recommendation mechanic: "from vetted list" is straightforward; "from community good experiences" implies some way to surface Discord sentiment/reviews on-site — needs a lightweight design (manual curation vs. built feature) before Session +1 scopes it as code
- [ ] Creator Partnership Offering doc found in Drive (10% rev share / 25% off code, "Money Matters" pre-pivot messaging) — confirm if still active; if so it needs to be reconciled with new positioning before any creator posts go live
