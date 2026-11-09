---
name: ปฏิทินของฉัน (calendarforme)
description: A red tear-off day pad joined to a full month sheet, on thin calendar paper.
colors:
  calendar-red: "#d0021b"
  red-deep: "#a50015"
  almanac-green: "#2e7d4f"
  ink: "#14110f"
  paper: "#f7f3e8"
  paper-bright: "#fffdf6"
  paper-hover: "#eee7d5"
  muted-ink: "#6b6356"
  rule: "#b9b0a0"
  pad-soft: "#ffe7ea"
  pad-rule: "#ff9aa6"
typography:
  display:
    fontFamily: "Noto Serif Thai, Leelawadee UI, serif"
    fontSize: "clamp(112px, 25vh, 216px)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: "lnum"
  headline:
    fontFamily: "Noto Serif Thai, Leelawadee UI, serif"
    fontSize: "38px"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  day-numeral:
    fontFamily: "Noto Serif Thai, Leelawadee UI, serif"
    fontSize: "clamp(24px, 4.3vh, 36px)"
    fontWeight: 900
    lineHeight: 1.25
    fontFeature: "lnum"
  title:
    fontFamily: "Noto Serif Thai, Leelawadee UI, serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 1.3
  pad-line:
    fontFamily: "Noto Sans Thai, Leelawadee UI, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  body:
    fontFamily: "Noto Sans Thai, Leelawadee UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Noto Sans Thai, Leelawadee UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  chip:
    fontFamily: "Noto Sans Thai, Leelawadee UI, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: "21px"
rounded:
  none: "0px"
  mark-round: "50%"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "28px"
components:
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.calendar-red}"
    textColor: "#ffffff"
  tear-button:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "5px 14px"
  tear-button-hover:
    backgroundColor: "{colors.red-deep}"
  month-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "34px"
  month-tab-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "7px 10px"
    height: "42px"
  day-today:
    backgroundColor: "{colors.calendar-red}"
    textColor: "#ffffff"
    typography: "{typography.day-numeral}"
    rounded: "{rounded.none}"
  pad-page:
    backgroundColor: "{colors.calendar-red}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
---

# Design System: ปฏิทินของฉัน (calendarforme)

## Overview

**Creative North Star: "The Tear-Off Pad (ปฏิทินฉีก)"**

The interface is the calendar object itself: a Thai-Chinese tear-off day pad, flooded in calendar red, bound by an ink strip, and joined to a full month sheet printed on thin off-white paper. Everything reads as print and paper: black-weight Thai serif numerals, plain Thai sans for everything small, dashed perforation lines ruling the sheet, square corners, flat ink.

Density is a printed wall calendar's: the month must be read at a glance, so numerals are large and black, entries are single-line chips under them, and the chrome is reduced to outline buttons and a slim month strip. Life comes from paper behaviour rather than decoration: the page lifts under the hand, rips along its perforation and falls with weight, scraps burst when a duty is ticked, months slide by.

It rejects the office calendar: no sidebar-plus-blue-chips arrangement, no rounded cards, no elevation. Light theme only, by decision.

**Key Characteristics:**
- One flood of calendar red (the pad page, today), ink black, thin paper, almanac green as the third ink.
- Black-weight (900) Thai serif numerals; Thai sans 400/600/700 for all small text.
- Dashed perforation lines as the sheet's rules and the pad's tear edge.
- Square corners everywhere; the only circle is the activity mark.
- Flat at rest; one drop shadow, only under a sheet in motion.
- Motion with paper weight: falls with gravity, settles without bounce.

## Colors

Printed-calendar inks on warm paper: one saturated red, ink black, a small almanac green, and a family of paper tones.

### Primary
- **Calendar Red** (calendar-red): the pad page on every selected day, today's block in the grid, weekend weekday labels and weekend numerals, the duty mark, the progress ticks that are done, the primary button on hover, text selection, confetti scraps.
- **Deep Red** (red-deep): hover on red paper (tear button, pad actions, add rows), image remove hover, error text.

### Secondary
- **Almanac Green** (almanac-green): the activity mark only. It is the third ink; it never floods a surface.

### Neutral
- **Ink** (ink): text, the pad binding and foot, the 2px grid head rule, outline button strokes, primary button fill, current month tab, toast, lightbox, dialog head band, focus outline.
- **Paper** (paper): page background, form inputs, image tiles.
- **Bright Paper** (paper-bright): the entry dialog sheet.
- **Paper Hover** (paper-hover): hover and drop-target fill on day cells and month tabs.
- **Muted Ink** (muted-ink): past-day numerals (struck through) and the backup links.
- **Rule** (rule): the dashed day rules, the pad's page-edge stack, scrollbars.
- **Pad Soft** (pad-soft) and **Pad Rule** (pad-rule): secondary text and hairline rules on the red pad.

### Named Rules
**The One Flood Rule.** Calendar red floods exactly two things: the pad page and today's cell. Elsewhere it is ink-sized (weekend numerals, duty marks, ticks). Never introduce another red surface.

**The Shape-and-Ink Rule.** Duties are red squares, activities green circles. Kind is always carried by shape as well as colour; on the red pad both marks turn white and keep their shapes.

## Typography

**Display Font:** Noto Serif Thai 700/900 (with Leelawadee UI, serif)
**Body Font:** Noto Sans Thai 400/600/700 (with Leelawadee UI, sans-serif)

**Character:** A heavy, inky Thai serif for every number and title, like a printed almanac; a plain Thai sans for everything you read in passing. Self-hosted in `fonts/` (variable woff2, thai and latin subsets, OFL 1.1), so the app needs no internet.

### Hierarchy
- **Display** (900, clamp(112px, 25vh, 216px), 1.05, -0.02em, lining numerals): the single giant day numeral on the pad. 88px on narrow screens.
- **Headline** (900, 38px, 1.3): the month title. 28px on narrow screens.
- **Day Numeral** (900, clamp(24px, 4.3vh, 36px), 1.25, lining numerals): grid day numbers. Days outside the month drop to 700 at 0.6x; 20px on narrow screens.
- **Title** (900, 26px, 1.3): dialog headings.
- **Pad Line** (sans 600, 22px; weekday at 18px): month-and-year and weekday on the pad.
- **Body** (400, 15px, 1.6): base text, pad entries (titles at 600).
- **Label** (600, 14px): buttons, weekday row, month tabs, field labels, toast, links.
- **Chip** (600, 13.5px, 21px): entry chips in day cells, ellipsised to one line.

### Named Rules
**The Serif Is for Numbers Rule.** The serif carries numerals and titles only, always at 900 (700 for receding numerals). Everything small is the sans at 600.

## Layout

Two columns at full viewport height (min 660px): the pad at clamp(300px, 24vw, 360px) on the left, the month sheet filling the rest. The sheet is a four-row grid: bar (title and actions), weekday row, a 7 by 6 day grid that takes all remaining height, and a slim strip (month tabs left, backup links right). Day cells have no vertical rules; only dashed horizontal rules under each cell and a 2px ink rule over the grid.

The pad stacks: ink binding (14px), the red page (head with weekday, numeral, month line and tear button; scrollable body of entries, add row and a three-column image gallery), a striped page-edge stack whose height shrinks as the range runs out, and an ink foot with the next-up line, month progress ticks and count.

Spacing is tight and small-stepped (2, 4, 8, 14, 20, 28px); sheet padding 18px 28px 10px, pad body 0 20px.

At 760px and below the pad folds into a header (numeral beside weekday and month line, body capped at 40dvh, gallery in four columns), grid rows become 64px, and chips collapse to their marks only.

## Elevation & Depth

Flat. Depth is conveyed by paper behaviour, stacking order and ink weight: the page-edge stack under the pad, a 14px ink band heading the dialog, a scrim behind dialogs (ink at 50%). Selected and drop-target day cells use a 2px inset ring, which is a stroke, not elevation.

### Shadow Vocabulary
- **Falling sheet** (`filter: drop-shadow(0 14px 18px rgb(20 17 15 / .35))`): only on the wrapper of a page tearing off and falling. It sits on the wrapper so the perforation mask cannot clip it.

### Named Rules
**The Paper in Motion Rule.** Nothing at rest casts a shadow. The only shadow in the world is under a sheet that is falling.

## Shapes

Square corners throughout (0px), including inputs. Strokes are 1.5px solid ink on controls, 1.5px dashed currentColor on anything that belongs to the pad's paper (tear button, add row, add-image tile), 2px dashed white for the pad's top perforation, 1px dashed rule between days. The tearing sheet's top edge is cut into a 14px by 7px zigzag by a mask. The one circle is the activity mark (50%), which is native to the world: it is the kind distinction.

## Components

### Buttons
Printed and plain: outline rectangles of ink that fill solid on hover.
- **Shape:** square (0px), 40px tall, 1.5px ink stroke; icon-only buttons are 40px squares.
- **Outline:** transparent with ink text; hover fills ink with paper text; active presses down 1px.
- **Primary:** ink fill with paper text; hover turns calendar red with white text.
- **Disabled:** stroke and text fade to pale paper greys.
- **Tear (on the pad):** transparent, white text, 1.5px dashed white stroke; hover fills deep red and sinks 3px.
- **Link:** muted ink, underlined at 3px offset; hover to ink.

### Day Cell (signature)
- Numeral top-left in the day-numeral style; first image as a square thumb top-right; chips below.
- Weekends red; past days muted and struck through (2px); outside-month days smaller and paler; days before the range struck and disabled.
- Hover: paper-hover fill and the numeral lifts 1px. Selected: 2px inset ink ring. Today: solid red block, white numeral, white chips and marks, with a red-and-white double ring when also selected. "+N" overflow tag bottom-right.

### Chips
- One line, 600 13.5px, with an 8px mark (red square for duties, green circle for activities); done chips are struck and 70% opacity. New chips pop in from 8px below.

### Tear-Off Pad (signature)
- Red page, white text, dashed perforated top under the ink binding; the head lifts 3px and tilts 0.4deg on hover and is the drag handle.
- Weekday line carries " · วันนี้" in 700 on today.
- Entries: hairline pad-rule list with checkbox (duties) or mark (activities), title, note in pad-soft, 28px square edit and remove actions.
- Dashed add row and add-image tile; image tiles square with an ink remove corner.

### Month Tabs
- Label-style text, 34px tall, no stroke; hover paper-hover; current month solid ink with paper text.

### Inputs / Fields
- **Style:** paper fill, 1.5px ink stroke, square, 42px min height.
- **Focus:** global 2px ink outline at 2px offset (white on the pad, paper on ink surfaces).
- **Error:** red stroke plus 1px inset red ring, deep-red message text.

### Dialog
- Bright paper sheet, 14px ink band on top over a 2px dashed perforation, slides down 28px into place.

### Toast
- Ink bar centred at the bottom, paper text, underlined pink undo action; rises 14px in.

### Motion
- Easing is paper-settle (cubic-bezier(.16, 1, .3, 1)) for everything that settles. The tear falls 760ms on a gravity curve with a slight sway and rotation, with scraps bursting from the rip; going back, a sheet drops onto the pad (460ms). Ticking a duty bursts red and ink scraps. Month changes slide 7% by view transition. All motion is removed under reduced motion.

## Do's and Don'ts

### Do:
- **Do** keep calendar red as a flood only on the pad page and today's cell.
- **Do** carry entry kind by shape and colour together: red square for duties, green circle for activities.
- **Do** set every numeral and title in Noto Serif Thai 900 with lining numerals; set small text in Noto Sans Thai 600.
- **Do** use dashed strokes for anything that is part of the paper (perforations, day rules, pad add controls) and 1.5px solid ink for controls on the sheet.
- **Do** let motion behave like paper: fall with gravity, settle on cubic-bezier(.16, 1, .3, 1), never bounce, and drop it under reduced motion.

### Don't:
- **Don't** round corners; the activity mark is the only circle.
- **Don't** add shadows to anything at rest; the falling sheet's drop shadow is the only one.
- **Don't** use the office-calendar arrangement of a sidebar with blue rounded event chips.
- **Don't** add a dark theme; the world is light only, by decision.
