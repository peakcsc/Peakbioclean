# GEO / AI-Search Analysis — peakbioclean.com
Framed per Google: "optimizing for generative AI search is still SEO." This is a
structural/heuristic audit of what's controllable in code, built by directly
applying the same checklist used on nativescreens.com.

**Important honesty note:** the Native Screens version of this document included
a *live, by-hand test of 5 real AI-assistant queries* from a real location, which
is what actually proved its central finding (review count is the gate). I don't
have live web/AI-query access in this environment, so this document is a
structural audit only — not a measured citation rate. The conclusion below
(reviews and authority signals are the bottleneck) is the same conclusion every
public study on this topic reaches, and it's consistent with Peak Bio-Clean's
starting point being even further behind than Native Screens' was (0 reviews vs.
their 7).

## GEO Readiness Score (heuristic): ~70/100
Technically the site is in strong shape — stronger than Native Screens' was
before its GEO work, since the per-page FAQ/Quick-Facts pattern was built in
from this pass rather than added later. The gap is the same one Native Screens
had: authority/brand signals.

---

## 1. Technical Accessibility — STRONG
- Real static HTML pages for every route (no hash-routing SPA problem — a
  previous site-wide fix). AI crawlers that read raw HTML get full content with
  no JS dependency. ✓
- robots.txt explicitly allows GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot,
  Claude-User, PerplexityBot, Google-Extended, CCBot. ✓
- Sitemap referenced, with lastmod dates. ✓

## 2. Structural Readability — STRONG
- Clean H1→H2→H3 hierarchy on every page (a prior pass removed dead code that
  was producing duplicate H1s). ✓
- Question-based FAQ headings on every service/county/city page (not just the
  homepage), matching how people ask AI assistants. ✓
- Short paragraphs, lists, Quick Facts boxes. ✓

## 3. Passage-Level Citability — STRONG
- Every service/county/city page now front-loads a direct, quotable answer
  sentence in the first ~40 words ("Peak Bio-Clean provides crime scene cleanup
  across all of Florida, available 24/7...") before the longer brand/positioning
  prose. ✓
- FAQ answers are self-contained and quotable. ✓
- Homepage has a single quotable entity sentence near the top for an AI to lift
  ("Peak Bio-Clean is a licensed, insured, and bondable biohazard remediation
  company..."). ✓
- GAP: no cost guide with specific price ranges, unlike Native Screens' cost
  guides. This is a deliberate choice, not an oversight — biohazard cleanup cost
  varies far more (insurance-dependent, situation-dependent) than screen
  enclosure pricing, and a fabricated or misleading range would be worse than
  none. If you want to commit to even a rough range (e.g. "$500–$5,000+
  depending on scope and insurance coverage"), tell me the real numbers and I'll
  add a cost guide.

## 4. Authority & Brand Signals — WEAK (the real problem, same as Native Screens)
- Visible "Last updated" dates on every subpage. ✓ (already ahead of where
  Native Screens started)
- Person/founder schema + named owner (Parker Peak) on the homepage. ✓ (already
  ahead of where Native Screens started — this was added in their second pass)
- Brand mentions: essentially none yet. No Wikipedia/Wikidata (normal, low
  priority for a local SMB), no Reddit/YouTube/LinkedIn mentions found, no
  directory citations yet (BBB, Yelp, Nextdoor, chamber of commerce).
- **Reviews: 0.** This is the dominant lever. Native Screens' live test showed
  AI answers cite businesses with 44–240 reviews and skip ones with 7. Starting
  at 0 means this is priority #1, full stop.
- GBP: not yet verified (confirmed directly by the business owner). Nothing
  about local AI-answer visibility or the Maps pack can move until this is done.

## 5. Multi-Modal — ADEQUATE
- Has logo, hero video, technician photo, certification badges. ✓
- GAP: no original charts/infographics, no YouTube video, no public photo
  gallery. This is genuinely harder for this industry than for a home-services
  business — you can't publish before/after crime-scene photos the way a screen
  company publishes before/after pool cages. A short, tasteful "who we are / how
  we work" video (team, equipment, a residential exterior, not scene photos)
  would be the safe equivalent.

---

## Schema status (already strong)
LocalBusiness + Person/founder (homepage), Service + FAQPage + BreadcrumbList
(every service/county/city page), BlogPosting + FAQPage + BreadcrumbList (blog).
Valid across all 241 pages.
- NOT added: Review + aggregateRating. Deliberately withheld — would require
  fabricating reviews that don't exist, which violates Google's structured-data
  policies and would be dishonest. Add this the moment real reviews exist.

## llms.txt
Present at /llms.txt, upgraded with a business-facts block and differentiators
matching the Native Screens version's structure. Per Google's AI optimization
guide this is ignored by Google Search specifically (no help, no harm there) but
may help other AI crawlers that read it directly.

---

## Top 5 Highest-Impact GEO Changes (biggest first)
1. **GET GBP VERIFIED.** Everything else in this list is blocked or weakened
   until this happens.
2. **REVIEWS 0 → 15+.** The single highest-leverage action available, same
   conclusion as the Native Screens audit, and more urgent here since you're
   starting from zero instead of 7. (review-kit.md)
3. **BUILD CITATIONS.** Bing Places, Apple Business Connect, Yelp, BBB, Nextdoor
   with identical NAP. Strongest AI-visibility correlate after reviews.
   (citations-directory-listings.md)
4. **GET THE 241 PAGES INDEXED.** They're live now; verify in Search Console and
   submit the sitemap so Google actually crawls them — none of this work matters
   until it's indexed. (google-search-console-setup.md)
5. **BUILD REFERRAL-PARTNER RELATIONSHIPS.** Your own earlier competitor
   research found this is the #1 acquisition channel in this niche — and it
   doubles as an authority/brand-mention signal (funeral homes, property
   managers, and victim advocates linking to or mentioning you) once those
   relationships exist.

## What I could not measure
- No live AI-query testing, no DataForSEO/SE Ranking connection, so no
  tool-measured or live-tested per-platform citation rate — unlike the Native
  Screens GEO-ANALYSIS, which included a live 5-query test.
- Competitor mention/review velocity not pulled from any API.
