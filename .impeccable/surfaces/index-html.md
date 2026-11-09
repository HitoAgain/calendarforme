---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Calendar surface

Scope and mode: the single page of calendarforme. Operate. One owner, Thai, desktop browser on one computer; the task is to read the month at a glance, add or tick entries, and attach images. Must not feel like an office tool or static.

Chosen direction: ปฏิทินฉีก (Thai-Chinese tear-off day calendar), chosen by the owner on the decision page as the pick card. The composition follows `.impeccable/mocks/decision/model-pick.html`.

## Direction contract

THESIS: The calendar's own object is the interface: a red tear-off day pad that you really rip, joined to a full month sheet. It refuses the sidebar-plus-blue-chips arrangement of office calendars.

OWN-WORLD: Thin off-white calendar paper, one flood of calendar red, ink black, and the almanac's green as the third ink. Black-weight Thai serif numerals, plain Thai sans for everything small. Dashed perforation lines rule the sheet. Nothing rounded, no shadows except under a sheet in motion.

STORY: The owner sees today immediately, reads what the month holds, tears forward to look ahead, adds entries and pictures, and ticks duties. It stays theirs and stays lively.

FIRST VIEWPORT: Left column, full height, about a quarter of the width, solid red: weekday, one giant numeral, month and year, then the selected day's entries and images, with the next-up line and month duty count at its foot. Right: month title at 38px with previous, today, next and add buttons; weekday row with weekends red; six rows of big black numerals on dashed rules; today a solid red block; past days struck through; months chooser and backup in a slim strip under the grid.

FORM: Tear-off day calendar, candidate 1 on the ordered list, picked over the assigned candidate 7. seed:e8d6bf7272268f8b. Signature interaction: drag the pad's page downward or press the button and the sheet rips along its perforated top edge and falls, revealing the next day; going back, a sheet drops onto the pad. Red paper scraps burst when a duty is ticked. Month changes slide by view transition. Motion grammar: paper weight, falling with gravity, settling without bounce.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

None.
