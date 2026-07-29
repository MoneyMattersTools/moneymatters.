# MoneyMatters — Content Ledger
Page-by-page record of what content exists, why, and what has been asked to change. Reference this before writing new copy for any page — it is the running memory of tone/content decisions, not just a status tracker.

## Homepage (index.html)
Current: Hero "Do you know your money?" + dual diagnostic choice cards. "How it works" 3-step. "Popular tools" question-framed cards. "Helpful resources" (SEC/IRS/CFPB). Newsletter signup.
Why: primary entry point - leads with the diagnostic choice per the core funnel decision (Section 2), not a feature list.
Changes requested: headline shortened (Round 8). "See what's driving this" link removed - was dead (Round 18). Financial Snapshot dashboard added beside score for logged-in users (Round 16/18), sized/styled to match score panel (Round 18).

## About Us (aboutus.html)
Current: 5-beat scroll story (The Problem / The Insight / The Solution / The Proof / The Invitation) with a scroll-scrubbed signature-dial visual via GSAP ScrollTrigger (Section 31). Beats 1/2/3/5 copy is now the founder narrative (Wall Street background, generational-wealth/entrepreneur gap, free-but-actionable guidance, "getting a hold of your own circumstances," leverage-as-the-client framing) per Section 33 item 14. Beat 4 ("The Proof") folds in the 3-step path, money-flow diagram, and vetting bento-grid unchanged; the principles grid was cut entirely and the FAQ trimmed from 6 to 4 items (Section 33 item 17). The dial visual now animates (translateY/scale) within each short beat's own pinned GSAP timeline, not just the whole-story scrub, so it moves as one motion with the text instead of a separate side animation (Section 33 item 16).
Why: trust-building page, most direct mission statement on the site.
Changes requested: leverage framing added explicitly, duplicate sentence/word-repetition fixed (Round "tone review," Section 25). Fully restructured into the 5-beat scroll story per Section 31 (shipped). Story content replaced with the founder narrative and visual made beat-integrated per Section 33 (shipped, live-verified 2026-07-29).

## Tools (tools.html)
Current: diagnostic CTA cards up top (intro paragraphs trimmed, Section 33 items 8-10), 3 native basic tools grid (descriptions match the Home Page emotional-connection wording, Section 33 item 11), Advanced Tools section (locked, Round 16; intro paragraph cut and descriptions rewritten, Section 33 item 12), MoneyMatters+ pricing card.
Why: functional/utility-first by design (Section 13/14) - not meant to carry heavy persuasive copy.
Changes requested: minor wording tightened (Section 25). Bottom Net Worth footnote removed as unnecessary (Round 18). Full copy trim per Section 33 (shipped, live-verified 2026-07-29).

## MoneyMatters+ (moneymatters-plus.html)
Current: "You have the leverage" hero (subtext rewritten, Section 33 item 30), persuasion tiles rebuilt around emotional/logical angles - stability, debt payoff, family planning, behavioral spending control - replacing the old advisor-fee comparison slider entirely (Section 33 item 31, `scripts/fee-slider.js` deleted). Free vs Plus comparison + FAQ trimmed (Section 33 item 32). Separate members-only view exists for Plan=plus logged-in users (Round 18); its "Priority advisor call" card now reflects a real advisorStatus from /api/session when present (Section 33 item 33) - not yet live-tested against a real Plus-flagged account, see persistent_qa_account memory.
Why: the subscription sales page - explicitly persuasive/cinematic (Section 13/14). Explicitly does NOT compete with or replace advisors (Section 33 item 31) - avoid fee-comparison framing in future copy here.
Changes requested: heading redundancy fixed, "no account required" accuracy corrected (Section 25). Coffee-cost + cited opportunity-cost stat added (Round 17, since removed with the fee-comparison framing in Section 33). Persuasion section fully rebuilt per Section 33 (shipped, live-verified 2026-07-29).

## Advisor Connect (connect-with-advisor.html)
Current: hero (green CTA box below it removed, subtext rewritten to leverage framing, Section 33 items 24-25) + top CTA (now routes straight to the homepage quiz's email-capture step with dedicated "3 minutes here to connect you with the right advisor" copy via `?start=advisor-connect`, skipping the choice screen and the generic Financial Health Score framing - Section 33 item 26, see advisor_connect_quiz_entry_pattern memory), "How it works," "After you request a connection" 4-step, vetting-standard cards, sample advisor profile row (preview text trimmed, Section 33 item 27; specialty label renamed to "Business Owners & Liquidity Events," item 28), "Coming soon" specialty browse cards, bottom CTA note removed (item 29).
Why: explains the advisor-matching process and builds trust in vetting before asking for the intake form.
Changes requested: heading/content mismatch fixed, redundant framing tightened (Section 25). Sample advisor cards added and centered (Rounds 17/18). Hero width checked, found already correct (Round 18). Full copy pass + quiz-entry rewiring per Section 33 (shipped, live-verified 2026-07-29).

## Blog (blogs/blogs-home.html)
Current: 3 real posts live (budgeting, investing, retirement/net worth). Hero renamed "MoneyMatters Blogs." and intro paragraph under "Start here" removed (Section 33 items 21-22).
Why: SEO content pipeline, secondary to the core funnel.
Changes requested: duplicate sentence fixed (Section 25). More posts to come via the marketing agent (separate system), not part of site-code rounds. Header/intro trim per Section 33 (shipped, live-verified 2026-07-29).

## Contact (contact.html, under About Us dropdown)
Current: "Get in Touch" hero (now full-bleed - moved outside the width-capped `.simple-page` `<main>` rather than a vw/negative-margin hack, Section 33 item 18), Discord link, contact form. Advisor-connect section's gold "Real advisors, actually vetted" kicker removed and heading changed to "YOU have the leverage. Advisors are paying to talk with YOU." (Section 33 items 19-20).
Why: genuine inbound-contact page, kept minimal since the diagnostic funnel handles primary conversion elsewhere.
Changes requested: moved into an About Us dropdown rather than top-level nav (Round 9). Hero full-bleed + copy fixes per Section 33 (shipped, live-verified 2026-07-29).

## Privacy Policy (privacy-policy.html)
Current: full data-use disclosure matching the actual built consent model (bucket browsing, situational checklist, score/net-worth-range sharing, location choice, deletion process).
Why: legal/functional accuracy over brevity - precision matters more than punchiness here.
Changes requested: updated repeatedly to track real product changes (pricing, consent model, Net Worth range vs. exact figure). No tone issues found.

## Native tool pages (Budget/Retirement/Investment/Net Worth, Basic + Advanced)
Current: intro copy + live in-browser calculator, "email me results" + "save to dashboard" (session-only).
Why: utility-first, minimal copy by design.
Changes requested: ALL-CAPS emphasis pattern flagged for normalizing (Section 25). "Quick Start" dropdowns deleted sitewide (Round 14). Advanced tools gained real native versions alongside the spreadsheet download (Round 16).
