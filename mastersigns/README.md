# Master Signs & Prints — website

Static site. No build step, no dependencies. Open `index.html` or serve the
folder. Deploys as its own Vercel project (`vercel.json` is here), separate
from the Peak Bio Clean site at the repository root.

```
index.html      Home — trigger entry, the handoff argument, process, services,
                ownership matrix, evidence, objections
services.html   Four service groups + what each needs to be quoted + scope split
work.html       Project types, with photo slots ready for approved photography
brief.html      Structured project brief (the primary CTA)
about.html      Founder story, positioning, service area
contact.html    Phone, email, shop, and what to have ready before calling
assets/css/site.css
assets/js/site.js
assets/logo/    Generated from FINAL_COMPLETE_LOGO.pdf
```

## Design notes

Palette is sampled from the logo: `#14102E` navy outline, `#3A4A7E` chrome
lettering, `#C4C4C4` concrete disc, `#00E01C` script green. Type is Archivo
(expanded, 800) for display, IBM Plex Sans for body, IBM Plex Mono for labels
and dimensions. The structural vocabulary — registration crosshairs, dimension
lines with end ticks, concrete surfaces — comes from sign shop drawings and
press registration sheets. The only animation is the hero sign switching on,
once, on load; it is disabled under `prefers-reduced-motion`.

## Before this goes live

The copy was written against the project brain's claim ledger, so it avoids
"all in-house", "we handle every permit", "next-day turnaround", "25 years in
business", "licensed and insured" and similar unverified claims. These items
still need Ricky's confirmation:

1. **Phone** — `754-299-9514` is meeting-captured, not verified. It appears in
   the header, footer, mobile call bar and the `tel:` links on every page.
2. **Email / domain** — `ricky@mastersignsandprint.com` and
   `mastersignsandprint.com` are the stated intent; confirm DNS and mailbox.
3. **Service area** — the site says "Davie, working across Miami-Dade, Broward
   and Palm Beach" and lists corridor cities on About. Confirm coverage.
4. **Legal entity / address** — footer reads "Master Signs & Prints LLC ·
   Davie, Florida". Confirm the exact entity name and whether a street address
   should be published.
5. **In-house vs partner** — `services.html#ownership` states that some
   fabrication, illuminated and electrical work runs through trade partners.
   Confirm the split is accurate.
6. **Client names** — `work.html` names Dunkin' only (cleared in the Aug. 13
   meeting). No logos, no case results, no institutional names are used.
   Anything added needs a release.
7. **Photography** — `work.html` currently uses drawn line diagrams. Each
   `.work__shot` has a comment showing the `<img>` swap once approved photos
   and releases are in hand.
8. **Turnaround language** — the site says replies are aimed at one business
   day "where we can" and never promises next-day production. If Ricky wants a
   firm SLA, it can be stated; it should not be invented here.

## Form

`brief.html` posts through `assets/js/site.js`. Set `ENDPOINT` at the top of the
form section to the CRM intake URL. Until it is set, the form validates and
hands the completed brief to a pre-filled email so no lead is dropped. Note
that the mailto fallback cannot carry the file attachment — the hint on the
field says so, and that limitation disappears once `ENDPOINT` is wired.

No instant price calculator, deliberately: pricing is not standardised enough
to automate, per the project brain.
