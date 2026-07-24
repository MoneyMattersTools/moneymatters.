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
