# MoneyMatters — Design Spec
Full reference for the site redesign. This supersedes prior incremental redesign prompts — build against this document as the single source of truth, not fragments of chat history.

## 1. Design Philosophy

The site should feel alive and reactive as a user engages with it, not static. It should stand out from generic financial sites and from generic AI-generated design defaults - it should NOT read as "another dark-mode template," it should read as distinctly MoneyMatters. Clean and professional throughout, but with real curb appeal: rich data visualization, real imagery, motion, and interaction, not decoration for its own sake. Every page should feel like part of one cohesive system, not a patchwork of separately-styled sections.

The known AI-design failure pattern to explicitly avoid: a near-black background with a single bright accent color and no other distinguishing choices. If a page reads like it could be any dark-mode SaaS product with the logo swapped, it has failed this brief.

## 2. Palette

- Base: deep, slightly desaturated forest green - "a dark living forest," not void-black and not pure grey. Should have depth and warmth, not read as flat/dead black.
- Accent: the existing warm gold, carried through as the counterpoint to green - this pairing (deep green + gold) is the brand's own identity, not a generic dark-mode green-on-black combination.
- Avoid pure black backgrounds entirely. Avoid using green as the *only* differentiating color choice - gold must do real work throughout, not appear only in the marquee dots.

## 3. Typography

- Fraunces (serif, display) + Inter (body) - already established, keep.
- Real scale contrast: headline moments should be large and editorial, not a uniform heading size applied everywhere. Use italic/weight variation deliberately for emphasis words (as already done with "gatekeeping" and "money" in italic green).
- Typography itself should carry personality - it is not a neutral delivery vehicle for copy.

## 4. Signature Visual Motif

The site's one true signature element is the financial health score visualization (radial dial/gauge + rising line), because it is literally the core product experience - "you can't fix what you can't see, see it first."

- This must be a real centerpiece on the homepage hero - large, doing real visual work, with floating annotation details (e.g. "+12 pts," "Solid Ground") - not a small supporting graphic tucked to one side.
- The same visual family should recur as an ambient, lower-key motif across interior pages (About, Tools, Blog, tool pages) - present but not competing with page content, responsive to scroll position and cursor movement, respecting `prefers-reduced-motion`.
- Do not reuse the old pre-redesign abstract SVG curve asset and relabel it as the new signature element - it must be a genuinely new treatment.

## 5. Composition Principles

- Prefer integrated, asymmetric compositions over clean symmetric two-column layouts. Two identical boxes side by side (e.g. two equal-sized choice cards) reads as a coin-flip, not a hierarchy - use asymmetric sizing (one large primary, one smaller secondary) where a hierarchy actually exists.
- Backgrounds can carry texture (e.g. subtle grid texture) rather than being flat gradients.
- The value-strip marquee (scrolling ticker) should be replaced with a bolder, static trust band - a scrolling ticker reads as a template default, not a considered choice.
- Structural devices (numbering, dividers, eyebrows) should encode something true about the content (e.g. an actual sequence/timeline), not decorate arbitrarily.

## 6. Imagery Strategy

- Primary: data and motion graphics tied to the actual product (animated charts, score visualizations, live-style tool previews) - these should be the dominant imagery type sitewide.
- Secondary: real photography of people, mixed in only where it earns its place (e.g. an advisor-connection moment on Contact) - not as the lead visual anywhere.
- Source: free, properly-licensed stock (Unsplash, Pexels) for now. Custom photography/video and paid licensing come later, once real content exists - do not delay the redesign waiting on this.
- No stock-photo hero shots of generic "people looking at laptops" - this is exactly the genericness being designed away from.

## 7. Motion and Interactivity

- Scroll-triggered reveals, cursor-responsive elements (e.g. subtle parallax/drift on the signature motif), hover micro-interactions.
- One well-orchestrated moment (e.g. the hero's signature visual) lands harder than many scattered small effects everywhere - do not over-animate every element on a page.
- Always respect `prefers-reduced-motion` and gate cursor-follow effects behind `pointer: fine` (skip on touch devices).

## 8. Onboarding Gate (functional spec, not just visual)

- Applies to any visitor without a verified-email session, on any page except the homepage (the homepage's own hero already presents the same choice as primary content - showing a modal over identical content is redundant, not additive).
- Presents the two diagnostic choices (Financial Health Score / Net Worth).
- Clearly visible Skip option, dismisses to the normal free site.
- Frequency: shown once ever per device (localStorage flag), not once per browser session - it must not reappear on repeat visits within the same general timeframe. A modal that reappears every time someone reopens their browser reads as exactly the "upsell" pattern the site's own copy promises it does not do.
- Skipped entirely for anyone with a valid verified session cookie.

## 9. Copy Consistency (ongoing requirement, not a one-time fix)

Any messaging claiming "no login," "no signup," or similar must be checked against actual current functionality before each redesign pass ships - the onboarding gate makes blanket "no login" claims false. Current correct language: "Free to start, no cost, ever." Phrases like "no signup wall" for the free tools remain true and can stay. Re-audit this specifically any time gate behavior changes.

## 10. Page-by-Page Requirements

- **Homepage**: signature visual as hero centerpiece (not hidden behind the choice cards or in a corner); asymmetric choice cards; static trust band; a "how it works" section with real structural depth (matching the treatment given to interior pages, not an afterthought).
- **About Us**: mission statement with the cost-comparison visualization, "how we make money" flow diagram, scroll-triggered timeline for "how it works" - already largely built, use as the reference quality bar for depth on other pages.
- **Tools**: native tool showcase with live-style mini previews per tool, single subscription card reflecting locked $5/mo pricing.
- **Blog**: honest topic-preview cards for upcoming content, no fabricated posts.
- **Native tool pages** (Budget/Retirement/Investment/Net Worth): dark theme applied with attention to *readability of dense numeric content* specifically - a moody cinematic treatment is right for narrative pages, but calculator result panels need to remain fast to scan. Check this explicitly, not just visual consistency.
- **Contact**: real photography permitted here specifically (advisor-connection moment).

## 11. Hard Constraints (non-negotiable regardless of creative direction)

- Fully responsive and performant on mobile - verified via real device emulation (CDP `Emulation.setDeviceMetricsOverride`, not `--window-size` screenshot flags, which have produced false positives before) at every stage, not just at the end.
- The diagnostic funnel's actual conversion mechanic (choice -> email -> quiz -> verify -> results) stays functionally identical - redesign presentation only, never the flow logic. Verify via real interaction (actual clicks through the flow), not just visual inspection.
- Do not touch the three native tools' calculation logic or any backend/Netlify Function code - visual/content layer only.
- Page weight: stay well under 1MB per page on a cold, cache-disabled load. Report actual byte counts, not assumptions, any time new imagery/assets are added.
- Accessibility: WCAG AA contrast minimum on every text/background pairing, measured not eyeballed; visible keyboard focus; reduced-motion respected.

## 12. Verification Methodology (process requirement)

- Verify every change against the live deployed URL (money-matters.site) only. Never rely on a local `file://` preview as proof of anything - it cannot reflect backend behavior, can be served from stale browser cache, and has caused real confusion earlier in this project. Confirm every change is committed, pushed, and deployed before reporting it done.
- When claiming something is "comprehensive" or "structurally new," prove it - e.g. via git diff against the pre-change commit, or literal before/after screenshots - rather than asserting it. If a claim turns out to be a re-skin rather than a real structural change, say so plainly rather than describing it as more than it is.
## 13. Hybrid Direction (locked, supersedes prior sections 2/6/7/10 where they conflict)

This section resolves the tension between "cinematic/alive" and "minimal/restrained" - both are wanted, split by page purpose, not blended uniformly everywhere.

### Palette (supersedes Section 2)
Grey base with darker green undertones - a muted, sophisticated grey-green, not a saturated forest green. The "deep living forest" feeling should read as mood/undertone, not as the dominant hue. Gold accent role unchanged.

### Page Scope Split (supersedes Section 10's uniform treatment)
- **Cinematic treatment** (motion, floating annotation cards, the illustrated signature score visual, ambient scroll/cursor reactivity, dramatic large-scale headline typography): Homepage, About Us, Blogs, Contact.
- **Utility-first / restrained treatment** (calm, functional, minimal decoration, no ambient motion competing with content, precise smaller type): Tools listing page AND every individual native tool calculator page (Budget, Retirement, Investment, Net Worth, both Advanced tools). These are working interfaces, not narrative pages - navigation and task completion are the priority here, not atmosphere. This also resolves the earlier open concern about dense numeric content staying scannable in a dark cinematic theme.

### Reference Direction
Pull heavy visual inspiration from minimal.gallery/tag/finance - specifically the restraint, whitespace, and typographic precision of sites like Fey, Runway Financial, Composer, and Acctual. Blend this quality WITH the cinematic motion/floating-card concept already built on the cinematic-treatment pages - this is about craft and polish, not replacing the existing concept. The floating cards, signature dial/line visual, and current site functionality should stay conceptually - refine the execution so it reads as intentional and premium rather than templated.

### Imagery (supersedes Section 6 for tool-explanation contexts)
Real product screenshots are appropriate specifically to explain/showcase the tools (on the Tools page and/or homepage tool-preview sections). On the cinematic pages (About, Blogs, Contact), continue using web-sourced material and existing site assets for photography, video, and data/motion graphics - not app screenshots as primary hero imagery there.

### Typography (supersedes Section 3's uniform guidance)
Keep the large, dramatic headline scale for hero/impact moments on cinematic pages. Restrain scale and decoration elsewhere - body copy, interior sections, and everything on the Tools/tool-calculator pages.

### Creative Latitude
Real creative freedom is intended within this framework - the reference link and this section are guidance on direction and restraint, not a pixel-exact spec. Use judgment on composition and detail while staying inside these boundaries.
## 14. Cinematic Direction Correction (locked, supersedes §13 where they conflict)

Reviewed Ethan's actual favorited references directly (runway.com, hasko.com, oldtomcapital.com, munropartners.com). These are heavy, cinematic, real-photography/video-driven production sites - closer to the original Izanami/Benjamin Hardman references from early in this project than to the light-SaaS restraint (Fey/Acctual/Composer) §13 pointed toward. That earlier steer was a miscalibration - correcting it here.

### Imagery Sourcing (supersedes §13's imagery section)
- Real photography and video are now central, not secondary - source properly-licensed stock video/photography (Pexels Videos, Coverr, Pexels/Unsplash photos - same sources the marketing agent already uses) for cinematic full-bleed hero/section backgrounds on Home, About, Blogs, Contact.
- Do NOT scrape or download video from YouTube directly - this violates YouTube's Terms of Service regardless of stated purpose. A YouTube video may only be used via YouTube's own official embed/iframe player, never downloaded or re-hosted.
- Data/motion-graphics (charts, score visualizations) stay in the mix - blend creatively with real photography/video rather than replacing them. Avoid anything that reads as generic/templated - creative, specific compositions over default patterns.

### Motion/Technical Scope
- Lightweight scroll-linked animation and parallax are in scope, applied where reasonable and only where mobile performance and usability hold up - do not degrade the mobile experience for a desktop-only effect.
- No framework rewrite (no React/Three.js/build-step introduction) - stay within the current vanilla HTML/CSS/JS, no-build-step architecture. This preserves the earlier mobile-app-portability goal (backend as a clean reusable API layer) - a heavy new frontend framework would undermine that.

### Scope Split (confirms §13, unchanged)
Cinematic treatment (now meaning real photography/video + data-viz blended, with lightweight scroll motion) still applies to Homepage, About Us, Blogs, Contact only.
Tools page and all native tool calculator pages stay utility-first/restrained per §13 - apply the updated palette/theme for visual consistency, but stay product-and-function-focused first; do not import heavy cinematic imagery/motion there.

### Page Weight Exception (approved 2026-07-24, amends Section 11)
The homepage hero's desktop video background is an approved exception to the well-under-1MB budget (desktop total ~2.6MB) - this is a deliberate cinematic choice, not an oversight. The hard, non-negotiable line is mobile: mobile must stay fully protected (no video bytes requested at all, poster image only) regardless of desktop weight. Any future cinematic video use follows the same rule - desktop can carry real video weight, mobile never does.

## 15. Round 5 Feedback (locked 2026-07-24)

1. **Onboarding gate verification**: confirm via a genuinely clean session (new Playwright context, zero cookies) that the gate renders correctly on a non-homepage page. Report proof, not assertion - this keeps getting asked because prior "verified" claims didn't match what Ethan could see himself (usually a session/cache issue on his end, but prove it cleanly each time regardless).

2. **Homepage score panel**: confirmed correct as-is - only appears for a verified session with submitted results, never as the default for a fresh visitor. No change needed, this was a session-state misunderstanding, not a design problem.

3. **Remove the decorative line-graph ("loopy lines") visual** from the homepage hero. Replace with empty/clean space by default. If a logged-in user with submitted results is viewing (the state that currently shows the score panel), that same space may show relevant user info/data instead - but for a fresh/anonymous visitor, leave it clean rather than filling it with decoration.

4. **Logo**: use the icon symbol (the hero-icon.png mark) together with the "MoneyMatters" wordmark in the top-left nav - both together, not wordmark alone.

5. **Marquee reverts to rotating/scrolling** (undoes the "static trust band" change from Section 5) - bring back the original full phrase set: "You can't fix what you can't see. See it first." / "Free in under 2 minutes." / "Real advisors, actually vetted." / "Your data, your call." / "Built by people who've been confused too." Use "Free to start, no cost, ever." in place of the old "No login, no upsell, no catch." line specifically, since that claim is no longer accurate post-onboarding-gate.

6. **Palette adjustment**: overall site reads as too dark/too close to black still. Shift the base tone lighter - more "shadowy dark forest," less near-black - while keeping the dark theme and forest identity intact. This is a lightness adjustment, not a hue change.

## 16. Round 6 Feedback (locked 2026-07-24, overrides Section 15 item 1 and Section 8/13's homepage exclusion)

1. **Onboarding gate now applies site-wide, homepage included, no exceptions** - this reverses the earlier "homepage excluded" decision. Any visitor without a valid verified session sees the gate on every page, including the homepage.
2. **Gate must handle two distinct visitor types**, since the login system is passwordless (magic-link email only - there is no username/password to check against):
   - **No prior account**: show the existing diagnostic choice (Financial Health Score / Net Worth).
   - **Has an account but no current valid session** (cleared cookies, new device, etc.) - the system cannot know this until the visitor identifies themselves, so the gate should offer BOTH the new-diagnostic choice AND a clearly separate "Already have an account? Enter your email to get back in" option that sends a fresh magic link to an existing Users record. Do not build a password field - stay within the existing passwordless model.
3. **Extend the earlier "remove decorative line-graph visual" fix to the results-view hero state too** (not just the anonymous choice-step state) - same clean/empty treatment for anonymous visitors.
4. **Newsletter/email subscribe box**: center it and restyle to match the current dark theme - currently an unstyled default embed that clashes with the surrounding design.

## 17. Round 7 Feedback (locked 2026-07-25)

1. **Onboarding gate copy simplification**: replace the current heading/subhead wordiness with just "Choose a place to start" and the tool links/cards below - strip the extra explanatory sentences.
2. **Advisor-review CTA on the results screen** (scoped version, per Ethan's confirmation - see chat): a clear "Review with an advisor, free" call-to-action appears once a user has results. Clicking it opens a short intake form collecting the opt-in situational checklist (Section on advisor snapshot format - inheritance, business sale, etc.) plus location confirmation, and saves a "wants advisor review" request to Airtable. This feeds the existing manual/concierge advisor process - no automated advisor-facing matching UI yet, per the standing MVP-concierge decision.
3. **About Us and other pages: reduce copy length throughout** - less is more, brief and clear. Apply the same discipline to Tools and any other wordy page.
4. **Font size**: moderate increase in body/key copy sitewide for readability - not a dramatic size jump, stay within the "sleek, clean, minimal" identity rather than working against it.
5. **Subscribe button** now links to a new dedicated page explaining subscription value/benefits at each tier - name TBD (see chat). This page should lead with user value/leverage messaging, not just a feature list - the core positioning (user has the leverage, gets free access to vetted advisors) should be emphasized here specifically.
6. **Contact page layout**: fix left-alignment issue - content currently sits too far left, needs better centering/balance.
7. **Homepage hero video**: extend loop length (longer clip and/or slower playback) so the loop point is less noticeable - currently a short ~7s clip that repeats too quickly.

### Round 7 confirmations (2026-07-25)
- Advisor-review CTA: confirmed scope is the intake-form MVP version (item 2 above) - not the full automated marketplace.
- Subscription page name: "MoneyMatters+". "Membership" may work as a section heading within the page.
- Font size: confirmed moderate increase, prioritize balance and readability (avoid too-small text for some users) over dramatic size change.

12. **Navigation**: add "MoneyMatters+" and the new "Connect with an Advisor" page to the primary top navigation bar, alongside Home/Tools/About Us/Blogs - both are real destinations, not secondary links.

## 18. Round 8 Feedback (locked 2026-07-25)

1. **Skip button**: make much smaller, move to the bottom of the gate, remove the border/pill styling - should read as a quiet exit, not an equally-weighted option next to the real choices.
2. **Net Worth Calculator**: still shows the old Google Sheets download UI ("coming soon" placeholder). Build it as a native in-site calculator matching the pattern already used for Budget/Retirement/Investment - this was always the intended end state, the Google Sheets version was an interim placeholder.
3. **Homepage choice cards**: both cards should match the more opaque/filled styling currently only on the left card - the right card currently reads as too see-through/washed out against the video background.
4. **Hero video/scene speed**: slow further - the loop reset is still noticeable. Apply consistently everywhere this forest scene (video or photo) is used across the cinematic pages, not just the homepage.
5. **Homepage headline**: change to "Do you know your money?" (shorter, replaces "Where do you actually stand with money?").
6. **"How it works" section headline**: change to "From unclear to understanding, in three steps." (replaces "...to certain...").
7. **Newsletter box**: still not properly centered/theme-matched after the last fix - needs a real fix this time, verify visually before reporting done, not just via code review.
8. **Swirls/line-graph decorative visual**: still reappearing in the post-verification results flow (after clicking the email link) despite being removed twice already. Find the actual root cause this time - check every hero/results-state variant, not just the ones checked before.
9. **Advisor intake form**: add a free-text field for the user to describe their own specific needs, in addition to the checkbox list. Review and revise the checkbox options - current ones don't cover the majority of real reasons users are likely seeking advisor help; broaden them.
10. **New page: "Connect with an Advisor"** (or similar name) - a real page explaining what the advisor-connection process offers, positioned as the bones for a future advisor directory/ratings page once real advisors are onboarded. Build the structure now, populate later.
11. **Terminology clarity going forward**: "Subscribe" refers to the newsletter signup (Beehiiv embed). The paid tier CTA is "MoneyMatters+" / "Learn more," a separate thing - keep this distinction clear in copy so it does not read as the same button.

12. **Navigation**: add "MoneyMatters+" and the new "Connect with an Advisor" page to the primary top navigation bar, alongside Home/Tools/About Us/Blogs - both are real destinations, not secondary links.

## 19. Round 9 Feedback and Content (locked 2026-07-25)

### Quick fixes
1. Rename nav item "Connect with an Advisor" to "Advisor Connect."
2. The "MoneyMatters+" nav/CTA button should use the same visual formatting/weight as the "Get Connected!" button (matching prominence, not a lesser link style).

### MoneyMatters+ page — additional content to build
Beyond the existing "You have the leverage" hero and "Why the model is different" section, add:
- **What's included** (the $5/month tier, expand from the pricing model already locked): all advanced tools, every new tool as it ships, explainer/how-to videos for each tool, live webinars, advisor Q&A sessions, full community access.
- **Free vs. MoneyMatters+ comparison**: a simple two-column layout - Free (diagnostic, basic tools, browse-only community access) vs. MoneyMatters+ (everything above).
- **FAQ**: cancel anytime / no long-term commitment; does this affect advisor matching (no - that's always free regardless of tier); what counts as a "new tool."

### Advisor Connect page — additional content to build
Beyond the existing process/vetting-criteria/coming-soon structure, add:
- **How matching actually works**, described simply and positively for an end user (not the internal bucket-mechanics framing): "We ask a few questions about your situation, then match you with a vetted advisor who actually specializes in it - not just whoever's next in line."
- **Vetting standard, stated plainly**: CFP-certified, fee-only, fiduciary - every advisor, no exceptions.
- **What happens after you request a connection**: short numbered sequence - you share a bit more context -> our team reviews and matches you -> the advisor shares their background with you first -> you decide whether to take the meeting, no pressure either way.
- **Trust reinforcement**: no cost, no obligation, you can stop at any point.

## 20. Round 9 Confirmation (locked 2026-07-25)

- Keep the Get Connected/Contact page. Move it into a dropdown under the "About Us" nav item, rather than a standalone top-level nav item - top-nav "Get Connected!" CTA button now points to MoneyMatters+ instead.

## 21. Round 10 Feedback (locked 2026-07-25)

1. **Add a persistent "Sign In" link to the primary nav** - separate from the onboarding gate. Clicking it opens the same passwordless magic-link flow (enter email, get a link) already built into the gate, but must be reachable at any time, not just on a first, ungated visit.
2. **Add a specific opt-in checkbox for sharing preliminary results with advisors**: a new, separate consent checkbox (distinct from the situational-details checklist) letting the user choose whether their Financial Health Score and Net Worth figure specifically are shared with advisors to aid matching. Off by default - explicit opt-in, not opt-out. Update Privacy Policy language to reflect this specific, separate consent.
3. **Community infrastructure, built ahead of traffic** (not content, just structure): Discord server structure is manual/Ethan's action (see chat) - no code change needed here from Claude Code.
4. **Blog / SEO**: get real posts live. Attempt to post the originally-planned blog content first; if that content has issues (missing, unusable, etc.), draft new short posts specifically for SEO purposes rather than leaving the "coming soon" placeholder live. Separately, do a full technical SEO pass sitewide: meta titles/descriptions on every page, sitemap.xml, robots.txt, structured data/schema markup where relevant (e.g. FAQ schema on FAQ content), proper heading hierarchy, alt text on all images. Fix what is missing or wrong.
5. **Testing**: thoroughly test the email/notification system across every place the site sends email (diagnostic verification, advisor-review confirmation, sign-in magic link once built) and the full onboarding flow end to end, for a genuinely new user - confirm every step is smooth, not just individually functional.

### Round 10 addition: advisor-review confirmation email (2026-07-26)
`request-advisor-review.mjs` currently only writes to Airtable - it should also send a simple confirmation email via Resend (same account/domain already configured for the diagnostic verification email, no new service). Keep it minimal for MVP: confirm the request was received, set expectations (team reviews and follows up), no need for anything fancier yet. This resolves the open question from item 5 - item 5's "advisor-review confirmation" email now exists to test, build it as part of this round.

## 22. Round 11 Feedback (locked 2026-07-26)

1. **About Us dropdown arrow**: too small relative to surrounding lettering - increase size to match.
2. **Advisor Connect page**: sections currently look too visually similar to each other - vary layout/composition between sections (not every section should use the same card grid pattern).
3. **"Coming Soon" badge spacing**: too tight on the Advisor Connect page - increase padding.
4. **Advisor tracking**: do NOT build a new site-facing dashboard yet. Add a `Status` field (Requested / Matched / Meeting Taken) to the existing Advisor Review Requests Airtable table instead - this gives real tracking with no new build. A user-facing ratings/self-select-advisor directory is a documented future phase (ties to the existing "Browse advisors directly - Coming Soon" section) - do not build now, revisit once real advisors and real completed matches exist to seed it.
5. **Blog content pipeline**: prompt the existing marketing agent (separate system, not part of this site rebuild) to generate additional pre-written SEO blog drafts beyond the current 3 live posts - this is a marketing-agent task, not a Claude Code site-build task.
6. **MoneyMatters+ copy - make the value proposition land harder**: illustrate the $5/month cost against realistic savings (e.g. compare to what a percentage-based advisor fee would cost on real dollar amounts, or everyday cost comparisons). Blend emotional appeal (confidence, control, peace of mind) with logical ROI argument. Real persuasive copywriting, not a feature list.
7. **Add imagery/video/live visualization to MoneyMatters+ and Advisor Connect pages** - both currently under-decorated relative to the rest of the cinematic pages. These two pages now join the cinematic-treatment group (Section 13/14) alongside Home/About/Blogs/Contact - Tools and the tool calculators remain the only utility-first pages.
8. **Gold-dot-plus-eyebrow-text header pattern**: this reads as a common templated/AI-site convention. Keep the concept but redesign the visual treatment to feel more custom and specific to MoneyMatters, not a default pattern.

## 23. Round 12 Feedback (locked 2026-07-26)

1. **Imagery repetition sitewide**: Advisor Connect and About Us/Contact currently use the same stock photo. Audit the whole site for repeated images and diversify - source distinct photos/video per page/section from the same free-licensed stock sources already in use (Pexels, Unsplash, Coverr). Original and varied over reused, throughout.
2. **MoneyMatters+ page - condense the dollar-comparison chart to one small section**, not the page's main focus. Build out additional persuasion angles alongside it, blending logical and emotional appeal subtly rather than leaning on one chart to do all the work:
   - Loss-aversion framing (what ongoing confusion/inaction costs, distinct from the AUM-fee comparison)
   - Simplicity/low-commitment framing (cancel anytime, no lock-in, no long-term contract)
   - Identity/aspiration framing (the kind of person who has their financial life handled - confidence, control, peace of mind)
   - Reinforce that advisor matching is free regardless of tier - this should not read as bundled into the $5 ask
   - Do NOT fabricate social proof - no invented testimonials, review counts, or user numbers. Real social proof gets added once it exists, not before.

## 24. Round 13 Feedback (locked 2026-07-26)

1. **Footer disclaimer spacing**: currently rendering as a two-column text layout, causing the inline "About page" link to break awkwardly mid-sentence between columns. Switch to single-column flow (or a wider max-width single block) - readability over compression.
2. **Real mobile Safari review needed**: iPhone Safari specifically shows spacing issues not caught by prior CDP/Chrome-based mobile emulation. CDP device-metrics emulation approximates viewport size but is still Chrome's rendering engine, not Safari/WebKit - some spacing bugs are WebKit-specific and won't surface in Chrome emulation. Do a genuinely careful pass across the whole site at mobile widths, and flag explicitly if anything found is likely Safari/WebKit-specific rather than a general responsive bug, since that changes how it should be tested going forward.
3. **Full end-to-end funnel timing test**: walk through the complete real user journey in one continuous session - land on site -> complete a diagnostic -> receive and click verification email -> land back verified -> submit the advisor-connect intake form. Time each step and the whole sequence. Report where real friction or slowness exists (not just "it works") - the goal is landing-to-advisor-request speed and efficiency, not just functional correctness.

## 25. Tone/Content Review — Page by Page (started 2026-07-26)

Review criteria for every page: consistency, clarity, avoid "AI-sounding" generic phrasing, cut length where the same meaning fits in fewer words. Mission to reinforce throughout, explicitly where natural: MoneyMatters empowers ordinary people to understand and control their own finances, and gives them real leverage/information edge in conversations with advisors - advisors work for the user, not the other way around.

### About Us (reviewed)
1. Vary word repetition of "serious" between the hero headline and the "Why we exist" section.
2. The phrase "independently vetted for CFP(R) certification, fee-only compensation, and fiduciary duty" appears verbatim twice on this page (Vetted-not-sold card + How We Make Money section) - reword one instance.
3. Break the "How we make money" paragraph into shorter, more scannable sentences/lines rather than one dense block.
4. Add an explicit line stating the leverage framing directly - the advisor works for the user, not the reverse - this is currently only implied through transparency/vetting language, not stated.
5. "Built on real principles" section uses finance jargon (zero-based budgeting, compound-interest modeling, standard net-worth accounting) without translation, inconsistent with the plain-spoken voice elsewhere on the page - simplify or add a brief plain-language gloss per term.

### Tools (reviewed)
1. "Start here" heading immediately followed by "Start with a 2-minute diagnostic" - redundant repetition of "Start," vary wording.
2. "Want your full financial picture instead?" - "instead" reads awkwardly (unclear what it is instead of). Simplify to "Want your full financial picture?"
Note: this page intentionally stays functional/utility-first, not persuasive - correct per Section 13/14, no mission language needed here.

### MoneyMatters+ (reviewed)
1. Two headings stacked back to back with near-duplicate meaning: "Why people choose MoneyMatters+" immediately followed by "Why the model is different" - consolidate to one, remove the redundant leftover.
2. Possible accuracy issue: "the diagnostic and every basic tool are free, no account required" - confirm this is still accurate given the site-wide onboarding gate now requires email verification to reach full results. Correct the claim if it no longer holds.

### Advisor Connect (reviewed)
1. The section intro line "You see who they are before anything else happens" previews Step 3's own text almost verbatim ("You see who they are and how they work before anything else happens") directly below it - redundant, tighten one.
2. Real bug, not just wording: a heading literally labeled "How we make money" is followed by unrelated copy ("No cost. No obligation. Stop at any point.") that does not explain revenue at all - looks like the wrong heading or missing/swapped content. Needs a real content fix.

### Blog (reviewed)
1. "No jargon, no gatekeeping — just the same transparent approach as the tools themselves" appears twice verbatim on the same page (hero subhead + "Start here" section intro) - vary one instance.

### Contact (reviewed) - no issues found, appropriately concise.

### Privacy Policy (reviewed) - no issues found, accurate and appropriately precise for the genre.

### Native tool pages (spot-checked via Basic Budget Tool, check all)
1. Mid-sentence ALL-CAPS emphasis ("See WHERE your money is going relative to HOW it should be going") is a stylistic holdover inconsistent with the more refined voice established elsewhere on the site - normalize to standard sentence case with italics/bold for emphasis instead. Check Retirement/Investment/Net Worth tool intros for the same pattern.

## 26. Round 14 Feedback — Real User Testing (locked 2026-07-26)

### Bugs (fix these first, real functional breaks)
1. **Onboarding redirect bug**: after a user enters their email, they are being routed to the newsletter/blog page instead of back to the main site/tools. Trace the actual post-email-submission redirect logic and fix - this breaks the core funnel.
2. **Broken logo link on tool pages**: clicking the MoneyMatters logo on the Basic Budget Tool page returns an error instead of navigating home. Audit every internal link sitewide for correctness, specifically checking relative-path depth across the three folder levels in this repo (root pages, blogs/blogs-home.html at one level deep, individual-tools/basic-tools/* and individual-tools/advanced-tools/* at two levels deep) - this is the exact failure class flagged as a known risk in the last session's handoff notes.
3. **FAQ accordions currently close each other**: opening one question should not collapse another - all opened questions should stay open, pushing remaining content down, not replacing it.

### Onboarding clarity
4. Make the quiz's "what happens next" clearer at each step - the flow should feel airtight and self-explanatory, not just functionally correct.

### Style
5. **Remove em-dashes sitewide**, restructuring sentences around periods, colons, or shorter clauses instead - this applies everywhere, not just headers (same category as the earlier gold-dot-eyebrow fix, reads as a generic AI-writing tell). This is a full copy pass, not a find-and-replace.

### MoneyMatters+ visuals
6. Add real visuals to reduce the page's text-heaviness: screenshots of the Advanced Budget and Advanced Investment tools (both the original spreadsheet version and the in-browser native version, side by side or toggled). For the private Discord group and advisor call sessions - neither exists yet - use simple illustrative/conceptual visuals (not fabricated screenshots of things that don't exist), clearly evocative rather than literal.

### Net Worth privacy refinement
7. **Change the Net Worth sharing consent from an exact figure to a range bucket**: $0-250k, $250k-500k, $500k-1mm, $1mm-5mm, $5mm+. Users are unlikely to be comfortable sharing an exact number even opted-in - a range preserves the matching signal without the specific figure. Update the checkbox UI, the underlying data field, and the Privacy Policy language (currently says "Net Worth figure specifically" - needs to say "Net Worth range").

### Tool results email (scoped version - see chat for the larger dashboard idea, deferred separately)
8. Add a "email me these results" option on the Basic Budget Tool (and the same pattern extends naturally to Retirement/Investment/Net Worth) - a simple one-time email via the existing Resend setup, no new backend persistence required.

### Explicitly deferred, not part of this round
9. Basic Budget Tool has known logic/function issues - flagged for a future round, do not address now.
10. Live dashboard/"financial snapshot" view showing saved Budget/Net Worth results on login (same treatment as the Financial Health Score currently gets) - this requires real backend persistence for tools that are currently stateless/anonymous by design. Scope as its own future round, not part of Round 14.

## 27. Round 15 Feedback (locked 2026-07-26)

1. **Eyebrow/kicker pattern still not fully fixed**: the homepage still shows a small gold dash/line before the eyebrow text (e.g. "— Your Financial Health Score"). Remove the dash/rule entirely - do not replace it with any line/underline device. Instead, use the gold color as the text color itself, and change/enlarge the font treatment for emphasis. Apply consistently sitewide - audit every page, since About Us's version of this element has already drifted to a different (green, no-dash) treatment independently. One consistent final treatment across all pages.
2. **Advisor Connect - add a placeholder-but-real-feeling advisor list**: a scrollable section showing advisor cards with name/specialty/rating elements, clearly usable even though no real advisors are onboarded yet (use clearly-labeled placeholder/sample entries, not fabricated as real people). Add a "Connect with an Advisor" button at the top of the page that takes the user directly into the existing intake flow.
3. **MoneyMatters+, Advisor Connect, and About Us still read as too text-heavy**: add live/interactive visualization or scroll/interaction-driven movement to these three pages specifically, consistent with the cinematic treatment already established elsewhere (Section 13/14) - reduce the sense of walls of text, not by cutting content further but by giving it more visual/interactive structure.

## 28. Round 16 Feedback (locked 2026-07-26)

### Financial Snapshot Dashboard (new scope, reverses the Round 14 deferral)
1. For logged-in/verified users, the homepage's existing score panel EXPANDS to also show additional submitted results (Net Worth, Budget, Retirement, Investment) alongside the current Financial Health Score - this is purely additive. The tree video backdrop, current score display, and overall homepage visual design and layout must NOT be removed, replaced, or restructured. Add new info to the existing panel, do not redesign it.
2. Add a "Submit" button on every tool/quiz (Financial Health Score already has this via the diagnostic flow) that: (a) emails the user a confirmation of their results, and (b) saves the result to their account record so it populates the dashboard. This requires real backend persistence for Budget/Retirement/Investment/Net Worth, which were previously stateless by design - this is the scope expansion flagged in Round 14 item 10, now explicitly in scope.
3. Dashboard also tracks advisor engagement (requested / matched / meeting taken - reuses the Status field already on Advisor Review Requests).
4. **Tiered dashboard**: basic dashboard for free users, an advanced dashboard with additional analysis/functionality for MoneyMatters+ users.
5. **Tier-gating dependency**: no payment processor exists yet. Build tier-gating logic against a simple manual Airtable flag (e.g. a "Plan" field on the Users table, manually settable to free/plus for testing) rather than waiting for Stripe. This flag gets replaced with real Stripe-driven tier assignment in a future round, not rebuilt from scratch.

### Advanced Tools
6. **Advanced Budget and Advanced Investment tools need real native in-browser versions built** (same pattern as the basic tools) - currently spreadsheet-only. Keep the downloadable spreadsheet version available alongside the new native version, not replacing it - offer both.
7. Add an Advanced Tools section to the Tools page, visible to all visitors but gated to MoneyMatters+ for actual access (visible-but-locked is intentional - it should attract free users toward upgrading, not be hidden entirely). Uses the same manual tier flag from item 5.

### Bugs / cleanup
8. Homepage's "See what's driving this" link under the score does nothing - remove it entirely.
9. "Join the community" link should point to the Contact page, where Discord is clearly linked - fix the link target.
10. Delete all "Quick Start" dropdown info from every tool page - tools should be intuitive without an explainer dropdown.

### Noted for later, not this round
11. Plan for a private Discord channel/space specifically for MoneyMatters+ members - future work, tied to real Stripe tier-gating.
12. Traffic/marketing brainstorm (SEO, social, paid ads, other acquisition channels) - flagged as a tracked priority item, not part of this build round. See SITE_STRATEGY.md Next Steps.


## 29. Round 17 Feedback (locked 2026-07-27)

1. **Sample advisor profile cards**: center the row/group on the page - currently left-aligned.
2. **About Us - scroll-to-reveal storytelling format**: restructure so content reveals progressively as the user scrolls, telling the mission as a story rather than static sections all visible at once. Real creative latitude here within the existing cinematic-page treatment (Section 13/14).
3. **Logged-in state should show the user's name/email in the nav**, not just a generic "Sign In" link once authenticated - important groundwork for distinguishing MoneyMatters+ members later.
4. **Testing methodology improvement**: create one persistent real test account (not a fresh disposable inbox each time) to reuse across future verification passes - more efficient than re-registering every round.
5. **Dashboard layout**: move the financial snapshot info to the right of the score (not below/separate), in larger lettering.
6. **Mobile-app portability discipline reminder**: continue keeping all business logic server-side in Netlify Functions, never in frontend JS - this remains a hard constraint as more features get added (ref Section 11).
7. **First-account-created popup**: after a user verifies their email and creates their account for the first time (not on every login), show a one-time popup adding them to a running "community" counter framed around building something new together (e.g. "Building the MoneyMatters community, one story at a time" - refine wording). This also serves as a lightweight growth-tracking proxy.
8. **Early-user incentive (operational, not a build item)**: plan to manually grant the first N signups free MoneyMatters+ access for a limited time (via the existing manual Plan flag from Section 28) in exchange for product feedback. No code change needed - this uses the tier flag already being built.
9. **MoneyMatters+ persuasion copy**: add a coffee-cost comparison and a real, cited statistic on the cost of poor financial decisions/opportunity cost of inaction - do not invent numbers, source and cite something real and defensible.
10. **Google Analytics (GA4)**: add the following tag to the <head> of every page sitewide:
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LZXJ5S59FQ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-LZXJ5S59FQ");
</script>

### Explicitly deferred to a future round, not part of this one
11. Goal-based onboarding (asking users their specific goals per category during the quiz, then showing the financial snapshot relative to those goals, guiding them toward advisor connect/tools/blog content) - good idea, real scope, needs its own dedicated round rather than folding into an already-large one.

## 30. Round 18 Feedback (locked 2026-07-27)

1. **Dashboard sizing**: enlarge to fill more of the right-side space, and match the visual weight/typography treatment of the score panel on the left (larger numbers, similar hierarchy) - currently reads smaller/lighter than its counterpart.
2. **Remove the bottom "Want your full financial picture? The Net Worth Calculator..." line from the Tools page** - extra, not needed.
3. **Footer**: increase spacing between the social media icons and the disclaimer text below - currently too cramped.
4. **Advisor Connect hero image**: stretch full-width like the hero treatment on other pages - currently boxed/contained, inconsistent with the rest of the site.
5. **New page variant: MoneyMatters+ for already-subscribed logged-in users.** Once a user is logged in AND has Plan=plus (the manual flag from Section 28), show a different version of the MoneyMatters+ page - not the sales pitch, but the actual full offering: advanced tools access, exclusive community links, exclusive advisor call booking, new tools as they ship, newsletter archive, etc. Build this now against the manual flag so it is ready before real Stripe billing exists.
6. **About Us scroll redesign**: hold for a follow-up round - real story-arc/scroll-scrubbed treatment needed (likely GSAP ScrollTrigger, free CDN include, does not violate no-build-step architecture), copy to be drafted collaboratively in chat first per the new page-by-page writing process (see below), not handed to Claude Code as a generic brief.

## 31. About Us â€” Cinematic Scroll Story (locked 2026-07-27)

Replaces the current static-sections About Us content. Real scroll-scrubbed narrative via GSAP ScrollTrigger (free CDN include: https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js + ScrollTrigger plugin - script tag only, no build step, no framework change). The signature dial/score visual is the through-line: faint and unfilled during "The Problem," gradually filling and sharpening through each beat, fully resolved and glowing by "The Invitation." Respect prefers-reduced-motion (fall back to simple fade-ins, no scroll-scrubbing, per Section 7/11's existing accessibility requirements). Keep all text as real readable HTML in the DOM at load (not JS-injected-only), for SEO per Section 26 item 4's technical SEO work - motion is presentational, not a content-delivery mechanism.

### Beat 1 â€” The Problem
Headline: "Most of this industry makes money by keeping you confused."
Body: "Financial advice has a cost problem hiding behind a complexity problem. Firms profit whether their advice helps you or not. The people who need clarity most are usually told they need more money before they can get it."
Visual state: dial faint, unfilled, static.

### Beat 2 â€” The Insight
Headline: "You don't need a finance degree. You need to see clearly."
Body: "Understanding where you stand with money isn't complicated. It's been made to feel that way. The formulas behind every real financial decision are public. Nobody owns them."
Visual state: dial begins tracing its outline as the user scrolls.

### Beat 3 â€” The Solution
Headline: "So we built the opposite."
Body: "A free diagnostic that tells you the truth in two minutes. Tools with every formula visible, not a black box. Advisors vetted before they ever see your name, paid the same whether they help you or not."
Visual state: dial fills in, line graph begins climbing.

### Beat 4 â€” The Proof
Headline: "How it actually works."
Body: reuse existing "How it works" 3-step content (See where you stand / Go deeper for free / Level up when ready) and the "How we make money" flow diagram, restructured as scroll beats rather than a static block.
Visual state: dial fully filled, line graph complete, gold accent settles in.

### Beat 5 â€” The Invitation
Headline: "You lead this conversation. Not the advisor."
Body: "Know your number. Know your gaps. Walk into any conversation with an advisor already understanding your own situation; not hoping they'll explain it to you. That's the leverage this is built to give you."
CTA: "Start your Financial Health Score ->"
Visual state: dial glowing/settled, steady state.

Existing content not covered above (vetting-standard cards, "Built on real principles" grid, FAQ) folds into Beat 4 as additional scroll sub-sections rather than being cut - reduce/tighten wording per the ongoing "less is more" standard, do not delete substance.

## 32. Round 19 Feedback (locked 2026-07-27)

1. **About Us dropdown**: enlarge the dropdown arrow/indicator (currently too small). Add social media icons near the top of the page too, not just in the footer.
2. **Dashboard boxes should size to their content**: $100,000 and $0 currently occupy the same fixed box size, leaving large numbers cramped and small numbers wasting space - let box height/width adapt to the actual number length rather than a fixed size.
3. **Advisor Connect sample profile row**: remove the manual scrollbar entirely. Replace with continuous slow auto-rotation, matching the exact speed of the top marquee ticker, so it reads as ambient motion rather than something the user has to scroll.
4. **About Us scroll story - two real refinements needed**:
   - Content should not all be visible/displayed at once - it should progressively reveal as the user scrolls, gated to actual scroll distance (more scroll required per beat, likely via pinning each beat briefly), not all rendered and just sitting there while the dial animates.
   - The text itself should have more of a "living" quality as it reveals (e.g. a soft blur-to-focus or staggered per-line/word fade-in), not just appearing as static text next to the moving visual - the dial's motion currently feels more alive than the words do.

## 33. Round 20 Feedback â€” Full Page-by-Page Copy Pass (locked 2026-07-27)

### Housekeeping
0. Clean up old scratchpad screenshots at the end of every verification round going forward (see chat instruction). Check current scratchpad size and clean the backlog now.

### Home Page
1. Rename dashboard section label from "Your dashboard" to "Your Financial Snapshot."
2. Dashboard card sizing already fixed in Section 32 - confirm still correct after this round's other Home page changes.
3. Slow the background video/imagery loop further - target ~20 seconds before it noticeably loops, not the current speed.
4. "From unclear to understanding, in three steps" section: increase font size to fill more space and improve legibility.
5. Tool card description copy changes (for emotional connection, less clinical):
   - Investment tool: "Does your strategy match your goals?" (drop the word "investment" from the question)
   - Budget tool: "Where is your money going?"
   - Retirement tool: "Is retirement possible?"
6. Newsletter/email signup box: still appears slightly off-center - fix precisely, verify visually not just via CSS read.
7. Footer: align the social media icons in line with the other footer text/nav row, not offset below it.

### Tools Page
8. Delete all text between the "Financial Tools" header and the "Start here" label (keep "Start here").
9. Delete all text between the "2-minute diagnostic" header and the two tool choice links.
10. Change the gold eyebrow text above the tools grid to "Interactive and Informative," and the header below it to "Go Deeper, Invest in You." Delete the paragraph text between that header and the tool cards themselves.
11. Update the three basic tool card descriptions to match the Home Page wording from item 5 above (Budget/Retirement/Investment).
12. Delete the text under the "Advanced Tools" header. Update descriptions:
    - Advanced Budget: "Track the money you don't realize you're spending"
    - Advanced Investment: "Not investment advice. Non-Guru Guidance"
13. MoneyMatters+ pricing card on this page will need an update once subscription offerings are finalized - not part of this round, noted for later.

### About Us Page (full rebuild of the story content, mechanism from Section 31/32 stays)
14. Replace the current 5-beat copy with a version of this founder narrative (expand as appropriate, keep this core language and meaning):
"MoneyMatters' founder is a current Wall Street native who believes simple financial guidance shouldn't only be for those born into access to it. He has watched people with generational wealth throw it away, and new entrepreneurs build empires, neither getting advice from the right people at the right time. Fed up with the lack of free, quality information delivered in a way that is not just educational but actionable, MoneyMatters began taking shape. The MoneyMatters team wants to build the tools you need, with your feedback. Getting a hold of your own circumstances is the only place to start. Rather than walking into an advisor's office with a pile of paperwork and no clear starting point, MoneyMatters keeps you organized and gives you leverage as the client. After all, isn't the advisor supposed to work for you, not the other way around?"
15. The reveal mechanism itself (scroll-gated pinning, word-by-word blur-to-focus) is correct and stays - map this new story text into that existing beat structure.
16. Imagery should move WITH the scroll/text as one integrated motion, not as a separate element animating independently to the side - the visual and the text should feel like one continuous scene, not two things happening near each other.
17. Content below "The Proof" and "The Invitation" beats (vetting cards, principles grid, FAQ, etc.) stays, but simplify significantly - current block styling reads as too busy/dense. Trim to only what earns its place.

### Contact Page
18. Hero forest background image should stretch full-width across the page (currently appears contained/boxed).
19. Delete the gold "Real advisors, actually vetted" line.
20. Change the "When you're ready for more than a tool..." heading to: "YOU have the leverage. Advisors are paying to talk with YOU."

### Blog Page
21. Change hero header from "Financial tips, tools, and real-world advice, for everyone" to "MoneyMatters Blogs."
22. Delete the text below "Start here."
23. Delete the text below the "useful email" newsletter header - apply this sitewide, everywhere this newsletter block appears, not just on the Blog page.

### Advisor Connect Page
24. Delete the green box text/section below the header area.
25. Update the text below the "Advisor Connect" header to: "Vetted, fee-only, fiduciary advisors who pay to talk to YOU, before they even see your name. Matching is free for you and begins by clicking below."
26. "Connect with an Advisor" button (both the top CTA and any other instance on this page) links directly into the Financial Health Score quiz question flow - skip the homepage/choice-step screen entirely, land straight on the first quiz question. Frame this specific entry point with its own copy: "3 minutes here to connect you with the right advisor" (or a close variant), distinct from the generic diagnostic framing used elsewhere on the site.
27. Delete the text below the "What a match looks like" header.
28. "Business owners & equity events" specialty label changes to "Business Owners & Liquidity Events."
29. Delete the text at the bottom, under the "Ready to get matched?" section.

### MoneyMatters+ Page
30. Update the text under the "MoneyMatters+" header to: "Providing the tools to inspire a community of individuals like you to take control. MoneyMatters+ is a commitment to you that costs less than a cup of coffee to get your family on track to financial flourishing."
31. Replace the current persuasion content (fee-comparison slider and tiles) - the advisor-fee comparison is the wrong angle, MoneyMatters does not compete with or replace advisors, it connects users to them. Rebuild this section around emotional + logical appeal: stability, debt payoff, planning for children, psychological/behavioral spending control, and similar real angles. Real creative latitude here.
32. "What you get" and "Free vs. Plus" comparison sections stay as-is in substance, just trim excess wording - less is more.
33. Begin work on the logged-in + subscribed member view of this page (a live dashboard/repository of MoneyMatters+ perks) - this was flagged as started in Section 30 item 5, confirm current state and continue building it out.


## 34. Round 21 Feedback (locked 2026-07-28)

1. **About Us scroll visual â€” replace the circle/dial metaphor with a "walking a path" visual.** As the user scrolls through the founder-narrative beats, the visual should read as a path/journey being walked (e.g. a winding trail or road receding into the distance, progress markers along it), not an abstract filling circle. Text per beat should be larger and centered along/over that path, not positioned separately beside it - text and path should read as one continuous scene per Section 33 item 16's "integrated motion" principle, which stays in force.
2. **Remove the scroll-pin/reveal mechanism specifically from the final "Invitation" beat** - that section should render normally (static, no pinning/gating), while beats 1-4 keep the scroll-scrubbed treatment.
3. **Investigate and fix the unexplained white line artifact on the left edge of the homepage** - report the root cause, not just a visual patch.
4. **Confirm the scratchpad/screenshot cleanup practice from a prior round is still holding** - check current scratchpad size and clean up if it has grown again.
5. **Full site access-level/page-logic review**: go through every page and every visitor state (anonymous, verified-free, verified-Plus) together as one system, not as isolated features layered in separately over many rounds. Confirm: the first-account welcome popup fires only once, correctly, for genuinely new accounts; the Plus-only MoneyMatters+ dashboard view is gated correctly and does not leak to free accounts; the early-user free-Plus incentive (manual Plan flag) is applied consistently wherever Plus status is checked sitewide, not just on the pages built most recently. Report any inconsistency found, not just a pass/fail per page.

## 35. Round 22 Feedback (locked 2026-07-28)

1. **About Us scroll visual - not working live, despite being reported verified last round.** Re-investigate from scratch, do not assume the prior fix holds. New creative direction, more specific than before: this should read as walking down a forest trail - visuals on BOTH sides of the text (not a single backdrop), deep-forest themed (trees, depth, dappled light), text should be prominent and legible (not crowded at the top of the viewport), and each beat's text should stay on screen noticeably longer before the scroll transitions to the next one - current pacing feels rushed.
2. **Advisor Connect - returning-user shortcut.** If a visitor has already completed the Financial Health Score diagnostic (has a verified session with a score on file), the "Connect with an Advisor" button/path should skip the quiz entirely and go straight to the advisor-intake submission form (situational checklist + location). After submission, show a clear confirmation: "Thanks for your submission - the MoneyMatters team will be in touch soon!"
3. **MoneyMatters+ (public/unsubscribed) page**: move the "Free vs. MoneyMatters+" comparison section up, directly under the main header - users should see the core differences immediately, with the rest of the page's detail below it.
4. **Footer text overlap bug** (screenshot in chat: "Discord"/community text overlapping the "Privacy Policy" nav link). Fix this specific instance, and do a broader sitewide sweep for any other overlapping text/element collisions that a visual pass might catch but a code read would miss.
5. **Comprehensive Supabase submission testing, sitewide**: using the persistent QA account, confirm every info-submission point on the site (diagnostic email verification, sign-in magic link, advisor-review intake + confirmation email, deletion request, tool-result saves, newsletter signup) is actually reading from and writing to Supabase correctly end to end - not just the functions spot-checked during the migration itself. Real evidence per submission type, not a general pass/fail.

## 36. Round 23 Feedback â€” About Us Scroll Mechanic Redesign (locked 2026-07-28)

### Root cause redirection (read this before touching code)
The GSAP ScrollTrigger pin-and-swap approach has now failed three rounds running (missing first beat, incorrect vertical centering, disappear/reappear happening too fast, content not visible when scrolling back up). Stop attempting to fix this mechanic further - replace it entirely with a simpler, standard pattern:

- **No pinning.** Beats live in normal document flow, one after another, like a regular long page - each beat's content stays exactly where it is once revealed and gets pushed up the page naturally by whatever scrolls in after it, exactly like ordinary page content.
- **One-time reveal, not a toggle.** As each beat scrolls into view for the first time (scrolling down), it plays its reveal animation (text fades/sharpens in, its path segment animates in - "the forest path becomes alive and moving" as this specific beat enters). Once revealed, it stays fully visible - no re-triggering, no disappearing.
- **Scrolling back up shows already-revealed content statically** - the reveal animation only ever plays once, going down. Scrolling up must never re-hide or re-play anything; everything already seen just sits there as normal static content.
- **This applies to Beats 1-4** (Problem/Insight/Solution/Proof, matching the same "reveal once on the way down" rule). Beat 4 ("The Proof," including "How it actually works" and everything folded into it per Section 31) and everything below should be fully visible/scrollable normally, in both directions, once reached - no gating at all past that point.
- **Beat 5 ("The Invitation") stays fully static already, per Section 34 item 2 - unaffected by this change.**

### Visual direction (refined)
- Forest path imagery on BOTH sides of the text (not a single backdrop) - dark, alive, deep-forest themed (trees, depth, dappled light), matching the site's established forest motif.
- The path/scene should feel like movement is happening as the user scrolls down through it (parallax, drifting light, subtle depth motion) - but once revealed and static, it should not keep animating/looping - it settles, matching the one-time-reveal rule above.
- Text should be large, legible, and clearly centered in the viewport - not crowded at the top.
- Slow down the transition pacing noticeably - the current speed reads as abrupt, not cinematic.

### Specific bugs to fix as part of this rebuild
1. Beat 1 ("The Problem") does not render/appear at all currently - confirm it exists and displays correctly in the new implementation.
2. Vertical centering - beat text has been rendering too high in the viewport; center it properly.

## 37. Round 22 (resend) + Round 24 Feedback (locked 2026-07-29)

### Round 22 items, not yet sent (see Section 35 for original detail) - still apply as written:
1. Advisor Connect returning-user shortcut (situational-checklist form directly for already-diagnosed users) - superseded by item 6 below, see that item instead.
2. Footer text overlap bug fix + sitewide overlap sweep.
3. Comprehensive Supabase submission testing sitewide, per-submission-type evidence.

### Round 24 - new items
4. **Test account cleanup**: delete disposable mail.tm test accounts from the users table, keep mm-qa-persistent@web-library.net. Establish a clear test-data naming/tagging convention going forward.
5. **Homepage dashboard - "MoneyMatters+ Overview" panel**: move it to the right of the financial snapshot cards (not below/overlapping them). Do not duplicate the snapshot numbers (Net Worth/Budget/Investment) already shown elsewhere on the dashboard - for now, this panel just shows "Coming Soon!" as a placeholder. Future content (not this round): advisor call booking info, Plus call sign-ups, direct messages from the Plus team, links to new tools as they ship - the real Plus member perks.
6. **Advisor Connect page - "Connect with an Advisor" button routing, corrected/clarified**: this button should go directly to the "Free Advisor Review" situational-checklist page (the one with the "What should your advisor know?" checkboxes), not to the homepage - confirm and fix, this may be a real routing bug since it is currently landing on the homepage. This applies as the button's behavior generally, superseding the earlier returning-user-only framing from Section 35 item 2 - go straight to the checklist page from this button, full stop.
7. **Free Advisor Review page - text sizing**: checkbox labels and the surrounding text are too small - increase size generally to better fill the page.
8. **About Us scroll - one more refinement on an otherwise-approved rebuild**: have the trees/forest imagery itself show subtle movement/parallax as the user scrolls (not fully static photography) - reinforcing the "walking a path through a living forest" concept. Keep the one-time-reveal, no-replay-on-scroll-up behavior exactly as just verified - this is a visual enhancement only, not a mechanic change.

## 38. Round 25 Feedback (locked 2026-07-29)

1. **About Us scroll - sharper visual direction, referencing the Firewatch game website's parallax model** (multi-layer depth: foreground trees, midground trees, background sky/light, each moving at a different rate as the user scrolls, creating real forward-motion depth) - not two static side panels. Text should sit integrated within this layered scene, on the path itself, not beside it. "The Problem" (and each beat) should start higher in the viewport on load, not low with empty space above.
2. **Storytelling copy - shorten every large/heading-level text specifically** (these are what users actually read) - less is more, tighten aggressively. Body copy can stay closer to current length if needed for clarity, but headings are the priority to cut.
3. **Homepage layout - crowding on the left edge**: allow text/blocks more breathing room, do not force everything against the left margin - let content use more of the available width. Fix the real overlap bug where the "MM+ Overview" box sits on top of the Net Worth card instead of beside it cleanly.
4. **Cursor-follow glow effect ("mini flashlight") missing on the Tools page** - add it there, and audit every other page to confirm it is present and consistent everywhere it is supposed to be.
5. **Tool result pre-fill for signed-in users**: when a signed-in user (free or Plus) who has previously submitted a tool revisits that same tool, pre-fill the form with their last-submitted figures (pulled from the same saved data used for the dashboard/email-confirmation record) so they can adjust specific fields and re-submit rather than re-entering everything from scratch.
6. **Rotating marquee banner audit**: review every phrase currently live for accuracy against the site as it exists today, replace anything untrue or misleading. New candidate phrases to consider working in: "Lost in the dark?", "Find your value", "Giving YOU control", "Financial clarity" - blend with what is already accurate rather than discarding everything.
7. **Supabase RLS (Row Level Security) policy audit** - flagged by a friend, take seriously. Confirm RLS is enabled on all tables, confirm what policies (if any) exist, and confirm the security model is sound given all current app access goes through server-side functions using the service_role key (which bypasses RLS) - explain clearly whether RLS matters in the current architecture or is a moot point given service_role usage, and whether enabling proper RLS policies is still worth doing as defense-in-depth regardless. Report findings plainly, do not just say "reviewed, looks fine."
8. **Financial Health Score quiz - tighten questions**: fewer words per question/answer, same meaning preserved. Where it fits naturally, frame questions/answers to evoke genuine emotional resonance rather than reading as clinical/neutral.
9. **Post-quiz review pop-up**: after completing any quiz/tool, show a simple 1-5 star rating plus an optional comment field, specific to that quiz/tool (not a generic sitewide survey) - this is for gathering real feedback on what users like/want, and may be used later (not this round) to incentivize engagement with free Plus access or free advanced-tool access once the product is charging.
