# MoneyMatters — Site Strategy
*Source of truth. Supersedes prior homepage/tools copy. Last updated: 2026-07-11.*

## 1. Positioning

**MoneyMatters is a financial diagnostic, not a tool library.**

Old framing: "here's a shelf of calculators, pick one." New framing: "answer a few questions, see where you stand, get pointed at what to do next — a tool, a advisor, or the community." The diagnostic is the product surface; the calculators and advisor network are what it routes you to.

This is the structural fix for the About Us / Privacy Policy contradiction (Section 6) and the reason the homepage rebuild isn't just a copy swap — it's a different entry mechanic.

## 2. Conversion Funnel (locked)
**Dual entry, not a single forced flagship.** Homepage presents both as equal-weight starting points -- user picks one. Design intent: whichever they pick first, the result/email-gate screen surfaces the other diagnostic as the natural next action ("You've seen your health score -- see what you're actually worth"), plus the broader tool library and community. This is the primary return-visit and engagement-depth mechanic -- not a hard cross-sell, a "you'll probably want this next" prompt shown once, at the moment of highest engagement (right after their first result).

Both tools are now in scope for the same build phase -- see Section 9 and BUSINESS_PLAN.md roadmap.

## 3. Homepage Architecture

1. **Hero** -- two cards, above the fold, equal visual weight: "Check your Financial Health Score" / "See your Net Worth." Not a headline + "browse tools" button. First interaction is a choice, then a question.
2. **Result reveal** (post-diagnostic, same session) -- score/number + 1-2 sentence plain-language read on where they stand.
3. **Email gate** -- "Save your result & get your full breakdown" (not "join our newsletter" -- the deliverable, not the list, is the offer).
4. **Cross-engagement prompt** -- immediately after the email gate, one clear nudge toward the *other* diagnostic they didn't pick, framed as a natural next step, not a second ask of the same kind.
5. **Routing block** -- paths surfaced based on result: relevant tool, advisor match (if result signals a real gap), Discord. Not all pushed equally to everyone.
6. **Trust/differentiation strip** -- replaces the old feature-bullet marquee. See Section 4.
7. **Tool library** -- repositioned as secondary: "Want to go deeper on one thing?" Basic tools stay free; Advanced stays paid.
8. **Community teaser** -- Discord, framed as "talk to people figuring this out too," not a generic footer link.
9. **Footer** -- corrected copyright, real nav.

Users who skip both diagnostics can still reach `/tools` directly via nav -- don't force it, just don't lead with it.

## 4. Marquee -- Rewrite (kill the feature-bullet scroll)

Old marquee was a 12-item product-feature list ("pay once," "no subscriptions"). That's not the story anymore -- some tools *do* stay paid, and the pitch is diagnosis + connection, not ownership. Replacing with a shorter, slower-moving strip that carries brand voice instead of a feature dump:

> You can't fix what you can't see. See it first. * Free in under 2 minutes. * No login, no upsell, no catch. * Real advisors, actually vetted. * Your data, your call. * Built by people who've been confused too.

Six items, not twelve. Slower scroll speed. This is copy-ready -- implement as-is or treat as a first draft for the code session.

## 5. Homepage Copy -- Final

**Hero (two equal-weight entry points):**
> ## Where do you actually stand with money?
> Pick a starting point. Takes less than 2 minutes, no signup required.
>
> `[Check my Financial Health Score]`   `[See my Net Worth]`

**Post-diagnostic result (dynamic, score-dependent tone -- draft the "needs work" tier, Health Score path):**
> ## Your Financial Health Score: 58
> You're managing the basics, but a few gaps are costing you more than you think.
> `[See your full breakdown]` *(email gate)*

**Email gate microcopy:**
> Enter your email to unlock your full breakdown and save your result. We'll also send you the next step that actually matters for your situation -- no generic newsletter spam.

**Cross-engagement prompt (shown once, immediately after email gate):**
> ## Now see the other half of the picture
> Your health score shows how you're *doing*. Your net worth shows what you're actually *worth*. Takes 2 more minutes -- we'll keep your info saved.
> `[See my Net Worth]` *(or inverse, if they started with Net Worth)*

**Routing block (example -- advisor-signal branch):**
> ## Talk to someone who can actually help
> Your score flagged [retirement savings pace / debt load / etc.] as the biggest lever. We'll match you with a fee-only, CFP(R)-certified advisor near you -- vetted, fiduciary, no sales pitch required to talk.
> `[Get matched]`

**Tool library intro (replaces "Smart tools for smart money decisions"):**
> ## Want to go deeper on one thing?
> Free calculators for budgeting, investing, retirement, and net worth -- transparent formulas, no signup required to try them.

**Community teaser:**
> ## You're not figuring this out alone
> Join the Discord -- real people working through the same budgeting, investing, and debt questions, in real time.
> `[Join the community]`

## 6. About Us / Privacy Policy -- Contradiction Fix

Both pages currently make promises incompatible with the referral-fee model:
- About Us: "We don't earn referral fees from brokers, banks, or insurers... We don't sell your data."
- Privacy Policy: "We will never sell, rent, or share your personal information with third parties for marketing purposes" and "We do not collect or store any financial data."

**Fix applied below.** Principle used: don't promise "no referral fees" -- promise *vetting standards* and *consent-based sharing*, which is the actually-defensible claim.

### About Us -- replacement paragraph
> ### How we make money (and why it doesn't compromise you)
> MoneyMatters is free to use because we're paid by the advisors in our network -- not by you. When you choose to connect with an advisor, we may receive a referral fee. That fee never affects which advisor you're matched with: every advisor in our network is independently vetted for CFP(R) certification, fee-only compensation, and fiduciary duty, full stop. We don't get paid more for pushing you toward any one advisor, product, or outcome. Your data is only shared with an advisor when you explicitly choose to connect -- never by default, never sold to anyone else.

### Privacy Policy -- replacement sections
> ### Information We Collect
> In addition to newsletter and contact form signups, our diagnostic and calculator tools collect the financial information you enter (income, balances, goals) in order to generate your results and, if you choose, match you with a financial advisor.
>
> ### How We Use Your Information
> We use your information to generate your results, save your progress, send relevant follow-ups, and -- only with your explicit, separate consent -- share it with a financial advisor you choose to connect with. We do not sell your data. We do not share it with advisors, or anyone else, without your consent for that specific purpose.
>
> ### Your Choices
> You can withdraw consent to be matched with an advisor at any time, and you can request deletion of your data by contacting us. Advisor sharing is opt-in per connection -- not a blanket agreement made at signup.

**Not in scope today:** full CCPA/state-disclosure language and the delete-my-data workflow -- those land with the Session +2 data capture build, per your compliance attorney gate before first paid referral.

## 7. Design Differentiation ("doesn't look like every other finance site")

Requirement: unique feel/interface, not just a reskinned template -- carries through to the eventual app. Within your existing guardrails (editorial-modern, no experimental nav):

- **The diagnostic itself is the differentiator**, not a visual gimmick. Most competitors (NerdWallet, Mint-likes, advisor-matching sites) lead with a form or a tool grid. Nobody in this space leads with a *scored, conversational quiz* as the homepage itself. That's the "note it's unique" moment -- happens in the first 10 seconds, not in the color palette.
- Score reveal should feel considered, not like a form-submit refresh -- a single focused transition (score count-up, one illustrated state per score band), reusing your existing abstract SVG curve motif as the visual backbone rather than introducing a new icon system.
- Keep Fraunces/Inter, gold/green/cream -- the *interaction model* is the differentiator, not new type or color.
- This same diagnostic-first pattern should be the app's entry point too -- one flagship interaction, not a dashboard of five tools on first open.

## 8. Copyright Fix (this session -- no code, but flagging exact locations for the fix)

Confirmed via live-site fetch, agency copyright still live on:
- https://www.money-matters.site/tools
- https://www.money-matters.site/blogs/blogs-home

Both link to ambitiousmarketingsolutions.com. Every other page already reads "(c) 2025 MoneyMatters." -- correct. Fix: find-and-replace the footer block on those two pages to match the others. Instructions in chat.

## 9. Open Items / Confirm Before Next Session

- [x] Entry point: both Financial Health Score and Net Worth built as equal-weight web tools, user picks one first (decided -- supersedes earlier single-flagship recommendation)
- [ ] Advanced tools pricing (currently $50 flat) -- pricing strategy session needed, not resolved today
- [ ] Diagnostic question set for Financial Health Score (5-8 questions) and Net Worth inputs -- draft next session alongside the rebuild
- [ ] Confirm score bands / tone copy for all tiers (only "needs work" tier drafted above as example)
- [ ] Creator Partnership Offering doc found in Drive (10% rev share / 25% off code, "Money Matters" pre-pivot messaging) -- confirm if still active; if so it needs to be reconciled with new positioning before any creator posts go live
