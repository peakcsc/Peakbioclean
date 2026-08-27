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
assets/video/   Hero film, re-encoded from the supplied 3D sign clip
```

## Design notes

Palette is sampled from the logo: `#14102E` navy outline, `#3A4A7E` chrome
lettering, `#C4C4C4` concrete disc, `#00E01C` script green. Type is Archivo
(expanded, 800) for display, IBM Plex Sans for body, IBM Plex Mono for labels
and dimensions. The structural vocabulary — registration crosshairs, dimension
lines with end ticks, concrete surfaces — comes from sign shop drawings and
press registration sheets.

The home hero is the 3D sign film, on a continuous loop. The source pushes
the camera in and its first and last frames are very different -- the sign
starts roomy and ends filling almost the whole square -- so a plain `loop`
would hard-cut every six seconds. The shipped clip is therefore a
ping-pong: the source forward, then reversed, with the duplicate frame
removed at both the mid-point and the wrap. Measured on the encoded file,
both joins move *less* than a typical frame-to-frame step (wrap 1.58,
mid-point 0.17, against a median of 3.44), so neither reads as a cut.

The film is sized off the viewport width rather than the hero height, so a
long copy column can never inflate the square into the text -- clearance is
positive at every width from 1200 to 1920, measured at the clip's most
crowded frame, which the loop now reaches on every pass. Below 1200px the
film stacks above the copy. Under `prefers-reduced-motion` the video
element is removed outright (stopping the download, the decode, and the
endless loop) and `hero-still.jpg` is shown instead; that same still is the
`poster`, so a browser that refuses autoplay shows the composed opening
frame rather than a freeze.

Scrolling off the hero opens the sign out: it turns to face you and grows,
holds, then fades, handing straight over to the next section.

There is no square edge because the film is not boxed -- the clip is graded
(`colorlevels` black point lifted to 0.33) so its ground sits below the page
ink, and the film carries `mix-blend-mode: lighten`, which replaces every
dark pixel with the page colour and keeps only the lit sign. A narrow 7%
feather on each side catches the last of the residual haze. Measured across
the film's boundary on a rendered page, the colour step is 8 and 2 -- an
obvious hard edge measures 30+.

Two stacking-context traps are worth knowing about here, because both
silently produce a flat, unblended rectangle. The blend has to sit on
`.hero__film`, not on the `<video>`: the film makes its own stacking context
(z-index, then a transform), which isolates any blend applied inside it.
And `.hero__pin` needs an ink background of its own, because that is the
backdrop the film actually blends against.

`site.js` measures the offset and scale once per resize as `--fx` / `--fk`;
the scroll handler writes only `--h` (0 to 1), and CSS derives `--e`, the
expansion, finishing at `--h` 0.55. The track is 145vh and `--h` reaches 1
exactly as the pin releases, so there is no dead scroll at the end.

## The standing wordmark

`Master Signs & Prints` sits behind every page as a fixed background layer.
On the home page it rises as the hero film fades (`--brand-in`, driven from
`--h`); elsewhere it is simply present.

It is two fixed layers, not one: `.brandmark--paper` multiplies (so it reads
on the light sections) and `.brandmark--ink` screens (so it reads on the dark
ones), each near enough a no-op against the ground it is not meant for. The
blend sits on each fixed layer itself for the same stacking-context reason as
the hero film. `z-index: 1` rather than 0, because the sections are
`position:relative` and would otherwise paint straight over it; it stays
under the header (60) and the call bar (70).

Because it overlays copy, its strength is set by contrast rather than by eye.
At full strength the worst cases are: body text on paper 14.3:1, muted text
on paper-2 5.13:1, body text on ink 11.64:1, muted on ink 6.22:1, and
steel-soft on ink 4.82:1. All clear WCAG AA. The ink layer is `#15112C`
specifically because `#1B1733` pushed steel-soft to 4.46:1, just under.

The seven checkpoints on the home page are a scroll-driven build. A sign is
fabricated in CSS 3D beside the copy as you read down: the setting-out
drawing, the letter returns extruding off the wall in eighteen stacked
layers, the faces fitted, the raceway mounted, then the LEDs igniting --
while the whole scene rotates from a raking view toward front-on. It is one
orchestrated sequence rather than scattered scroll effects, and it is the
"assemble the sign on scroll" idea from the project brain.

`site.js` sets a single custom property, `--p` (0 to 1), from the scroll
position of the steps column; every layer derives its depth, opacity and
angle from that in CSS. `--p` defaults to **1** in the stylesheet, so with
no JavaScript the sign simply renders finished and lit rather than blank.
The scrub only runs at 1000px and up, where the stage is actually sticky
beside the steps -- narrower than that it would animate off-screen, so it
holds the finished state instead. `prefers-reduced-motion` does the same.

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
8. **Hero film** — 14.7 MB source re-encoded to a 990 KB muted MP4, 1200x1200,
   CRF 33, audio stripped, 11.96 s ping-pong loop. If a single play is
   preferred over the loop, drop the `loop` attribute and re-encode the
   source without the split/reverse/concat filter chain.
9. **Turnaround language** — the site says replies are aimed at one business
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
