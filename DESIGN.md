---
name: Crate Digger
description: A daily music trivia game dressed as a run of LP sleeves, where the rarest correct answer scores the most.
colors:
  ink: "#16130f"
  ink-2: "#221e18"
  ink-3: "#39332a"
  paper: "#f3ecdd"
  paper-dim: "#cfc5b1"
  paper-mute: "#a89e8a"
  field-ochre: "#e4ae1f"
  on-ochre: "#16130f"
  on-ochre-mute: "#3d300c"
  field-vermilion: "#bf3a22"
  on-vermilion: "#fffaf5"
  on-vermilion-mute: "#f3ecdd"
  field-cobalt: "#2b57a6"
  on-cobalt: "#f3ecdd"
  on-cobalt-mute: "#dfe6f4"
  tier-white-label: "#f3ecdd"
  tier-b-side: "#e4ae1f"
  tier-album-track: "#7ea6de"
  tier-radio-edit: "#a89e8a"
  tier-miss: "#8c8272"
  back-ink: "#3d362c"
  back-mute: "#5b5245"
  back-faint: "#6c6151"
  back-rule: "#d8ceba"
  focus: "#f3ecdd"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(3.75rem, 15vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  display-score:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(5rem, 30vw, 8.5rem)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.005em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 62"
  numeral:
    fontFamily: "Archivo, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.33
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  label-wide:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  body-lead:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Libre Franklin, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  section: "56px"
  sleeve-pad: "6cqw"
  crate-pad: "7cqw"
components:
  button-ink:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label-wide}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-ink-hover:
    backgroundColor: "{colors.field-ochre}"
    textColor: "{colors.on-ochre}"
  button-field-ochre:
    backgroundColor: "{colors.field-ochre}"
    textColor: "{colors.on-ochre}"
    typography: "{typography.label-wide}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "56px"
  button-field-vermilion:
    backgroundColor: "{colors.field-vermilion}"
    textColor: "{colors.on-vermilion}"
    typography: "{typography.label-wide}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "56px"
  button-field-cobalt:
    backgroundColor: "{colors.field-cobalt}"
    textColor: "{colors.on-cobalt}"
    typography: "{typography.label-wide}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "56px"
  button-outline:
    textColor: "{colors.paper}"
    typography: "{typography.label-wide}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "56px"
  button-outline-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  answer-line:
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 0 8px"
  sleeve-ochre:
    backgroundColor: "{colors.field-ochre}"
    textColor: "{colors.on-ochre}"
    rounded: "{rounded.none}"
    padding: "{spacing.sleeve-pad}"
  sleeve-vermilion:
    backgroundColor: "{colors.field-vermilion}"
    textColor: "{colors.on-vermilion}"
    rounded: "{rounded.none}"
    padding: "{spacing.sleeve-pad}"
  sleeve-cobalt:
    backgroundColor: "{colors.field-cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.none}"
    padding: "{spacing.sleeve-pad}"
  back-cover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
  disc-label:
    backgroundColor: "{colors.tier-white-label}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  nav-link:
    textColor: "{colors.paper-dim}"
    typography: "{typography.label}"
    height: "44px"
---

# Design System: Crate Digger

## Overview

**Creative North Star: "The Hard-Bop Sleeve"**

Every daily set is a new LP. The prompt is a front cover: one flat field of pack color, a catalog line in small print, and the subject stacked huge in condensed grotesque. The results are the back cover on cream paper stock, with a tracklist and liner notes. Around the sleeves is a warm ink board, the record-store bin they sit in. The system is a print object first and an interface second, so it looks like offset ink, not like screens: flat fields, hard edges, no light, no glass.

Density is low on the cover and tight in the small print. One monumental line of type owns each sleeve, while everything functional (catalog numbers, track counts, labels, captions) is pushed into small uppercase Franklin with open tracking, the way a label prints its fine print. Depth comes only from one flat field overlapping another: the record disc slides out from under the sleeve, and the front cover peeks out behind the back cover. The interface ships in one dark scheme on purpose, with no light/dark switch.

The signature is the disc. On every answer, a vinyl record slides out from under the sleeve on a long ease-out, and its center label is printed with the points and the tier. The record motif repeats at small scale as the tier marks, which are drawn as center labels: the fuller the label, the rarer the pull.

**Key Characteristics:**
- Flat color fields with no box-shadows, no glass, and no gradients except the vinyl's own grooves.
- One field color per pack (General ochre, Hip-Hop vermilion, Pop cobalt), carried by a tone class that rebinds `--field`, `--on`, and `--on-mute`.
- Archivo used only at the ends of its width axis: condensed 900 for monuments, expanded 800 for titles and buttons.
- Libre Franklin small print for catalog lines and labels, with tabular numerals everywhere numbers sit in fixed slots.
- Square corners on every rectangle; the only curves are records.

## Colors

A warm ink ground and cream paper, with three saturated print fields and a small tier ladder that reads as record labels.

### Primary
- **Sleeve Ochre** (field-ochre): the General pack's field and the house signal color. Outside a pack it carries the home page's text selection and the hover of its "Play today's General" button, which is a General action. Text on it is ink (on-ochre), with a dark olive-brown (on-ochre-mute) for its small print.

### Secondary
- **Press Vermilion** (field-vermilion): the Hip-Hop pack's field. Text on it is a near-white warm cream (on-vermilion, 5.3:1), and its small print is the house cream (on-vermilion-mute, 4.6:1). Mute is always the dimmer of the pair.

### Tertiary
- **Label Cobalt** (field-cobalt): the Pop pack's field. Text on it is cream (on-cobalt), small print a cool pale blue (on-cobalt-mute).

### Neutral
- **Bin Ink** (ink): the page ground, the `theme-color`, button text on paper, and the center hole of every tier mark.
- **Raised Ink** (ink-2): the one tonal step up, used for the "More genres" test-pressing tile in the crate.
- **Rule Ink** (ink-3): hairline borders and dividers on the ink ground, and the scrollbar thumb. Decorative only; it never carries text.
- **Cream Paper** (paper): primary text on ink, the face of ink buttons, the back cover's paper stock, and the focus ring.
- **Faded Paper** (paper-dim): body copy and secondary text on ink, and the resting color of nav links.
- **Worn Paper** (paper-mute): small print, captions, placeholders, and the denominator in "3/6" on ink.

### Back-cover stock
- **Back Ink** (back-ink): the verdict sentence under the score on the back cover.
- **Back Mute** (back-mute): catalog line, side numbers (A1 to B3), prompt text, stat labels, and liner notes on paper.
- **Back Faint** (back-faint): the "/ 540" denominator, struck-through wrong answers, and "No answer".
- **Back Rule** (back-rule): the hairline between tracklist rows.

### Tier ladder
- **White Label** (tier-white-label), **B-Side** (tier-b-side), **Album Track** (tier-album-track, a soft sky blue), **Radio Edit** (tier-radio-edit), **Miss** (tier-miss): used only for tier marks and the disc's center label. Each mark sits on ink, either the page ground or a small ink chip on the back cover.

### Named Rules
**The One Field Per Sleeve Rule.** A sleeve is one flat field of its pack color, edge to edge. Pack color is applied by the `tone-*` class, never hard-coded, so every component that says "field" follows the pack.

**The Ink and Paper Rule.** Ink is the board; paper is reserved for objects printed on stock: the back cover, disc center labels, the test-pressing label, and the face of ink buttons. Never use paper as a generic card surface.

**The Label Ladder Rule.** Tier colors appear only on tier marks and disc labels. They are not UI accents, link colors, or status colors.

**The Pack Alert Rule.** Each pack has an `--alert` color for the low-clock warning on the ink board: ochre for General, a lifted vermilion (#e0563b) for Hip-Hop, and a pale cobalt (#8fb2e6) for Pop. All three pass 3:1 or better on ink at clock size. Text selection follows the pack too: field on ink, inverted on the sleeve.
## Typography

**Display Font:** Archivo (variable, with the `wdth` axis loaded), falling back to sans-serif
**Body Font:** Libre Franklin, falling back to system-ui and sans-serif

**Character:** Archivo is pushed to both extremes of its width axis, so a squeezed, stacked 900 slams against a stretched 800, the way jazz-era sleeves set one tight word against one wide one. Libre Franklin plays the record label's fine print: plain, upright, and spaced out in small caps.

### Hierarchy
- **Display** (900, 62% width, uppercase, clamp(3.75rem, 15vw, 6rem), line height 0.88): the home hero and policy page titles (clamp(3rem, 12vw, 5rem) there). On sleeves the same voice is sized by container width: the cover subject is fitted to the longest word and the text length, capped at `min(…cqw, 6rem)`; crate sleeve names are sized from the name length; the intro cover is `min(26cqw, 6rem)`.
- **Display Score** (900, 62% width, clamp(5rem, 30vw, 8.5rem), line height 0.8, tabular): the final score on the back cover, with its "/ 540" denominator at 0.32em.
- **Numeral** (900, 62% width, 2.25rem, tabular): the fixed Track, Clock, and Score slots during play. Smaller condensed numerals (1.5rem to 1.875rem) carry points in rows and stats.
- **Headline** (800, 125% width, uppercase, 1.5rem): section titles such as "Liner notes".
- **Title** (800, 125% width, uppercase, 1.25rem, line height 1.25): the matched answer on the reveal. Tracklist answers and the example answers use the same voice at 1rem or 0.875rem.
- **Label Wide** (800, 125% width, uppercase, 1rem to 1.125rem): every button, the wordmark (0.875rem), the cover lead "Name a" (clamp(0.95rem, 4.6cqw, 1.6rem)), and the typed answer (1.375rem).
- **Body Lead** (400, 1.125rem, line height 1.375): the home pitch and the pack blurb, held to 40 to 44ch.
- **Body** (400, 1rem, line height 1.625): liner-notes paragraphs and policy pages, held to about 46ch.
- **Body Small** (400, 0.875rem to 0.9375rem): rules, helper text, reveal notes, the footer. Tracklist prompts drop to 0.8125rem and the back-cover liner notes to 0.75rem.
- **Label** (600, 0.6875rem, letter spacing 0.08em, uppercase, line height 1.35): the "smallprint" voice for catalog lines, slot labels, form labels, captions, tier names, and nav links. Inside the disc and test pressing it scales with the container (2.6cqw to 4.4cqw).

### Named Rules
**The Two Widths Rule.** Archivo is never set at its default width. Condensed (62%, 900) is for monuments and numbers; expanded (125%, 800) is for titles, answers, and buttons. Both are always uppercase.

**The Label Voice Rule.** Each pack sets its cover subject and pack name in its own Archivo voice, the `.voice` class driven by `--voice-*` tokens on the tone: General is condensed 62% at 900, upright. Hip-Hop is extended 125% at 900, like a rap logo. Pop is condensed 72% at 800, italic. Cover type is fitted with the pack's `glyph` width (0.46, 0.9, 0.52 em), and words never break, including at hyphens.
**The Fixed Slots Rule.** Every number that changes in place (track, clock, score, points, issue number, date, stats) is tabular, so values change without the layout moving.

**The Small Print Rule.** Supporting information goes into the Label voice, not into lighter or smaller body text. Placeholders are the exception: they drop to sentence-case Franklin 1rem so the empty answer line reads as an invitation, not a title.

## Layout

The play and results screens are a single column capped at 34rem and centered, so on a phone the sleeve spans the full viewport width with no gutter while the controls below it keep a 16px gutter (the gutter drops to 0 at 640px and up, where the column floats). The sleeve is a square (`aspect-ratio: 1`) and a size container, so all type and padding on it are in `cqw` units (6cqw padding during play, 7cqw on crate sleeves). The catalog line is pinned to the top of the sleeve and the cover type to the bottom (`margin-top: auto`).

The home page is capped at 76rem with a 16px gutter (32px at 640px and up). The hero is one column on mobile and a 1.25fr / 1fr grid aligned to the bottom at 768px. The crate is a horizontal snap scroller of sleeves at 82% width on mobile, a 2-column grid at 640px, and a 4-column grid at 1024px, with a 12px gap. Policy pages use a 42rem column.

Spacing follows Tailwind's 4px scale. Common steps: 12px inside slot rows and between crate sleeves, 24px between blocks within a screen, 32px to 40px between hero parts, and 56px to 64px between home sections, each section opened by a 1px ink-3 rule. Touch targets are at least 44px (nav links and the clock switch) and 48px to 56px for buttons.

## Elevation & Depth

The system is flat. There are no box-shadows anywhere, and no translucency or blur. Depth is expressed by a few physical overlaps, each one standing for a real object:

- **Disc under sleeve:** the sleeve sits at `z-index: 10`; the disc on the reveal is pulled up 14% of the column width so it starts tucked behind the sleeve's bottom edge, then slides out.
- **Front cover behind back cover:** on the results screen, a full-size block of the pack field sits behind the paper back cover, offset 12px right and 12px up, so the front sleeve peeks out at the top and right edges.
- **Tonal step:** the one raised surface on ink is ink-2, used for the test-pressing tile.

The vinyl surface is the one gradient: a repeating radial groove pattern (#0c0a07 to #1b1813 every 3px) with two faint paper-colored rings at 33% and 70% of the radius.

### Named Rules
**The Overlap-Only Rule.** Depth comes only from one flat field overlapping another, and every overlap is a real object (a disc, a front cover). No shadows, glows, blurs, or glass.

**The Crate Rule.** At 64rem and wider the home sleeves lean into each other: each overlaps the one before it by 0.875rem, at alternating heights. The one you point at or focus comes forward and lifts 0.5rem. At 80rem and wider, the play screen goes landscape. The record rests just proud of the sleeve's right edge and slides out sideways on a result, with the controls in their own column.
**The Groove Exception Rule.** Gradients exist only as the vinyl's grooves. No gradient ever fills a sleeve, button, or background.

## Shapes

Rectangles are square-cornered: sleeves, the back cover, buttons, the answer line, rules, and the clock switch's track and thumb all have a 0 radius. Circles are reserved for records: the vinyl disc, its center label, the test-pressing label, the tier marks, and the small ink chip that holds a tier mark on paper. Lines are hard: 1px rules on ink (ink-3) and on paper (back-rule, or ink under "Tracklist"), a 1px `currentColor` rule above the status line on crate sleeves, and a 2px cream underline for the answer that thickens to 4px on focus. Icons are 20px line drawings with a 2px stroke and square caps.

### Named Rules
**The Square and Circle Rule.** Everything is a square or a circle. If it is not a record, it has no rounded corners.

## Components

### Buttons
Flat ink-and-paper blocks with an expanded uppercase label. They press down rather than lift.
- **Shape:** square corners (0px), no border on filled buttons.
- **Ink button** ("Dig", "Next track", "Play today's General"): cream paper face, ink label, 48px tall, 20px side padding, often with a trailing 20px arrow. Hover fills it with the pack field and its on-color (ochre on the home page); 150ms color transition.
- **Field button** ("Drop the needle", "Share the tracklist"): the pack field with its on-color, 56px tall, 1.125rem label, full width on mobile with the label and icon pushed to opposite ends. It has no hover color change.
- **Outline button** ("Practice"): transparent on ink, 2px cream border, cream label, 56px tall. Hover fills it with paper and turns the label ink.
- **Press:** filled buttons translate down 1px on `:active`.
- **Focus:** the global ring, a 2px solid cream outline offset 3px. On a field surface (`.on-field`), the ring takes the field's on-color.

### Inputs / Fields
The answer is a title line, not a box.
- **Style:** transparent on ink, no border except a 2px cream underline, 8px bottom padding, typed text in the expanded label voice at 1.375rem, caret in the text color.
- **Focus:** the underline thickens to 4px (padding drops to 6px so the text holds still). The outline ring is suppressed for this input only.
- **Placeholder:** worn paper, sentence-case Franklin at 1rem medium, normal tracking.
- **Label:** a Label-voice "Your answer" above, in worn paper.

### Navigation
- **Back link** ("Crate"): Label voice in faded paper with a 16px left arrow, 44px tall, no underline; hover brightens to cream.
- **Wordmark:** "Crate Digger" in the expanded voice at 0.875rem, top left on the home page, with today's date in the Label voice at the right.
- **Footer links:** body small in faded paper, hover to cream. Links use a 1px underline offset 0.2em where underlined.

### Clock switch
A `role="switch"` in the Label voice: "Clock", a 28 by 16px square track with a 1px `currentColor` border and a 10px square thumb that slides 12px on a 200ms ease-out, then "30s" or "Off" in a fixed-width tabular slot.

### Sleeve (signature)
A square of the pack field, used as crate tiles on the home page and as the front cover during play.
- **Catalog line:** Label voice in the field's mute color, split left and right ("Crate Digger / Pop · Chart Material" against "No. 001 / Track 1 of 6", or a CRT-0n number on the crate).
- **Cover type:** the prompt split into a small expanded lead ("Name a") and a condensed 900 subject that fills the width without breaking words, balanced across lines.
- **Crate tile:** status line at the bottom behind a 1px rule. Hover lifts the tile 4px (200ms ease-out); press returns it.
- **Entrance:** each new prompt slides in from 10% to the right while fading in (420ms ease-out).

### Vinyl Disc and Tier Marks (signature)
- **Disc:** 58% of the column width, grooved vinyl, slid out from under the sleeve by translating from -62% and rotating from -50deg over 640ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Its center label fills the inner 42% in the tier color, with the points in condensed 900 tabular at 17cqw and the tier name in small print. The result text below rises 8px into place (360ms, after a 260ms delay).
- **Tier marks:** 18px record labels drawn as a 1.5px ring in the tier color with an ink spindle hole. White Label is a nearly full label, B-Side a smaller solid label, Album Track a half label, Radio Edit an empty ring, and Miss a cross. On paper they sit in a small round ink chip.
- **Reduced motion:** the disc, sleeve, and rise entrances become a 160ms linear fade, and the low-clock blink stops.

### Back Cover
The results card on paper stock, with 20px padding (28px at 640px), the front-cover field offset behind it, and a catalog line reading "Side B". It holds the display score, a one-line verdict, a "Tracklist" heading over a 1px ink rule, and six rows on a 2rem / 1fr / auto grid: side number (A1 to B3), prompt and answer, then points and tier mark. A four-column stat row and liner notes in 0.75rem back-mute close it.

### Clock slots
A three-column row between 1px ink-3 rules: Track, Clock, and Score, each a Label-voice term over a condensed 2.25rem tabular value. At 5 seconds or less the clock turns ochre and blinks at 1s in hard steps.

## Do's and Don'ts

### Do:
- **Do** give every pack exactly one field color through a `tone-*` class, and use `--field`, `--on`, and `--on-mute` in components so they follow the pack.
- **Do** set monuments and numbers in Archivo 900 at 62% width and titles and buttons in Archivo 800 at 125% width, always uppercase.
- **Do** put catalog lines, labels, and captions in the Label voice (Franklin 600, 0.6875rem, 0.08em tracking, uppercase).
- **Do** use tabular numerals for any number that changes in place.
- **Do** size type and padding on a sleeve in `cqw` so the cover scales as one object.
- **Do** express depth by overlapping flat fields that stand for real objects: a disc under a sleeve, a front cover behind a back cover.
- **Do** run entrances on `cubic-bezier(0.16, 1, 0.3, 1)` and give each one a reduced-motion fade.
- **Do** keep the 2px cream focus ring (offset 3px), switching to the on-color on field surfaces.

### Don't:
- **Don't** use box-shadows, glows, blurs, or translucent glass.
- **Don't** use gradients anywhere except the vinyl grooves.
- **Don't** round the corners of any rectangle; circles are only for records and their labels.
- **Don't** set Archivo at its default width, or set either display voice in mixed case.
- **Don't** put two field colors on one sleeve or tint a sleeve with a gradient.
- **Don't** use tier colors as general UI accents.
- **Don't** use paper as a generic card surface; it is the back-cover stock and the record label.
- **Don't** add a light theme; the system ships one dark scheme by design.
