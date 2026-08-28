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

The wording and the calls to action do not fade. They stay at full opacity,
clickable and focusable, for the whole hero scroll. Because the film grows
across the copy column, an ink scrim rises behind the copy in step with the
expansion (`--e`, not `--h`: the film reaches the copy before a scroll-timed
ramp would be up). The scrim is the page colour, so it is invisible once the
film has faded — it only does work where the sign would otherwise sit under
the text. Verified by hiding the copy, sampling the brightest ground it
actually sits on, and computing contrast for the weakest of its colours
across 21 scroll positions at 1200, 1280, 1440, 1920 and 2560: worst 5.91:1,
clear of AA. Re-measured after the film stopped fading, since it now sits at
full strength behind the copy at the end of the scroll.

`site.js` measures the offset and scale once per resize as `--fx` / `--fk`;
the scroll handler writes only `--h` (0 to 1), and CSS derives `--e`, the
expansion, finishing at `--h` 0.5. The track is 130vh, giving 30vh of pinned
travel.

The film does not fade out. It stays at full opacity and on screen right up
to the moment the pinned section releases and the next one scrolls over it.
It used to fade, back when the copy faded with it; once the copy started
staying, that fade only produced a stretch of empty hero — measured at
1440x900, the sign dimmed for 80px and was then fully absent for another
100px before the trigger strip arrived. The standing background film now
comes in at the handoff (`--brand-in` over `--h` 0.82 to 1.0) instead of
cross-fading with the hero film.

## The standing film

The looping sign sits behind every page as a fixed background. On the home
page it comes up as the hero film fades (`--brand-in`, driven from `--h`);
elsewhere it is simply there.

It uses `site-bg.mp4` — a separate 600x600 / 341 KB encode of the same
ping-pong loop, not the 1 MB hero file — because it renders small and faint.
`site-bg-still.jpg` is its poster, so a browser that refuses autoplay falls
back to a frame of the same grade rather than a brighter one.

It is two fixed layers, because one cannot read on both grounds.
`.sitefilm--ink` screens: its dark scene is a no-op on paper, its lit sign
glows on ink. `.sitefilm--paper` is inverted and multiplied: its now-white
ground is a no-op on paper, its sign reads as a grey ghost. The paper layer
is also desaturated — inverting flips hue, turning the red sphere cyan and
the green script pink — while the ink layer keeps its colour, where that is
the real brand palette. As with the hero film, the blend sits on each fixed
layer itself, not the `<video>`, and `z-index: 1` clears the
`position:relative` sections while staying under the header and call bar.

**The strengths come from contrast maths, not taste.** The binding case is
`steel-soft` on ink, which is only 5.96:1 unaided, so any lift breaks it
fast: at the original grade even 16% opacity failed at 3.83:1. The fix was
to cap the background clip's highlights in the encode (`colorlevels`
`romax=0.50`) so the blend cannot lift the ink far, then set opacity under
the measured ceiling.

Presence is bought in the encode rather than the opacity, since opacity is
pinned by that ceiling. The grade applies a pinned-toe curve
(`curves=all='0/0 0.12/0.01 0.35/0.58 0.65/0.93 1/1'`) between the black
crush and the highlight cap: it lifts the sign's midtones about 44% while
leaving the frame edge at ~5/255, so the square stays invisible, and the
peak stays capped so the contrast maths is unchanged. A plain gamma lift
does not work here — it raises the frame edge to ~33/255 and the rectangle
reappears.

At the encoded peak of 166 the ceilings are paper 0.20 and ink 0.16, so the
shipped values are 0.19 and 0.15. Worst cases, with text sitting on the
sign's brightest core: body on ink 12.1:1, muted on ink 5.98:1, steel-soft
on ink 4.63:1, body on paper 12.76:1, muted on paper 5.09:1, muted on
paper-2 4.57:1. All clear AA. To make it read stronger still, raise the
curve's midpoint — not the opacity.

Under `prefers-reduced-motion` the `<video>` elements are removed outright,
stopping the download and the decode rather than just hiding them.

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
