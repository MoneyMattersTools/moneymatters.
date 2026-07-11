# MoneyMatters — Business Plan
*Source of truth. Last updated: 2026-07-11.*

## Model

Lead-generation platform for CFP(R) fee-only, fiduciary financial advisors. Free diagnostic + calculators + education + community capture qualified leads with financial data already attached. Expansion path: tax advisors, legal counsel, insurance providers -- full financial-professional referral suite.

## Revenue

- Advisor listing fees
- Per-lead fees
- Revenue share on successfully onboarded clients

Users pay nothing for base tools. Advanced tools remain paid during the transition (Advanced tools: $10 each. Subscription: $10/month (all advanced tools + webinars + free advisor sessions, tiers TBD)).

## Value Exchange

| Party | Gets |
|---|---|
| Users | Free diagnostic, free tools, education, curated vetted-advisor network |
| Advisors | Qualified leads with financial context already captured |
| MoneyMatters | Referral fees + revenue share |

## Target Segments

Anxious early-career (22-30), Overwhelmed parents (30-45), Retirement-anxious mid-career (40-55), First-time homebuyers (25-40), Debt-stressed (any age), Retirees (60+), General curious (fallback)

## Advisor Vetting (non-negotiable)

CFP(R) certified + fee-only + fiduciary standard. Local geographic matching to users.

Beta advisors: founder's existing network, approached via direct outreach; cold outreach automation via marketing agent in a later phase.

## Compliance

Solicitor regulations apply once referral fees are collected. Compliance attorney consult required before first paid referral. Budget: $1.5-3K, triggered at Phase 1 revenue.

State privacy compliance (CCPA, VCDPA, CPA, etc.) -- likely under thresholds given early scale, but disclosures built in as best practice from day one (see SITE_STRATEGY.md Section 6 for interim Privacy Policy fix; full disclosure language lands with the data-capture build).

## Entity

Delaware LLC (registration in progress). IP ownership confirmed clean and sole -- prior licensee relationship (Xavier Rimpel) formally terminated, all Money Matters IP and assets reverted to founder.

## Technical Stack

Netlify Functions + Airtable backend (Airtable chosen specifically for non-technical inspectability). Frontend rebuild in progress, see SITE_STRATEGY.md for the homepage/conversion architecture driving that build.

## Community

Discord -- live, not yet seeded. Skool -- planned after 200+ engaged newsletter subscribers.

## Roadmap (session sequence, per dual-entry decision in SITE_STRATEGY.md Section 2)

1. Homepage rebuild in code + Financial Health Score AND Net Worth as dual-entry web diagnostics + Netlify Functions/Airtable backend + email capture flow
2. Basic Budget web tool + advisor-share consent UI
3. Advisor directory placeholder + first blog post live
4. Remaining tool rebuilds, podcast landing page, About/Privacy final versions, "How we make money" transparency page
