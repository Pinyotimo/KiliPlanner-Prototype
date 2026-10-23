# KiliPlanner palette

The documented instance of the palette. Every colour in the app comes from
here (directly, or through a token in `src/index.css` that points at a value
in here). Nothing in the product picks a colour by eye.

The colour work is **computed, not eyeballed**. The scripts under `tools/`
re-derive every number on this page from the ramps and re-run the data-viz
validator; the validator's verdicts are quoted under each table.

---

## Surfaces

The surface a mark is measured against. The validator needs these.

| Mode | Chart surface | App background | Card |
|------|---------------|----------------|------|
| Light | `#fcfeff` | `oklch(0.968 0.008 h)` | `oklch(0.995 0.005 h)` |
| Dark  | `#161c22` | `oklch(0.175 0.013 h)` | `oklch(0.222 0.015 h)` |

`h` is the active accent's hue, so the surfaces shift with the theme.

---

## Categorical hues — the five service families

The map is an **all-pairs** form: any two pins can sit side by side, so every
pair of family colours has to clear the colourblind and normal-vision floors,
not just neighbouring ones.

The eight per-category hues the app started with could not do that.
Red/orange and aqua/pink collapsed into each other under simulated
colour-vision deficiency, and re-stepping all eight did not rescue them
either — eight hues cannot clear the all-pairs test in a lightness band this
narrow. So the categories fold into five service families, and each family
takes one hue. The specific category is always carried by its icon and its
label, never by colour alone.

| Family | Hue | Light | Dark | Categories |
|--------|-----|-------|------|------------|
| Security | 27 | `#c6423b` | `#eb6459` | security |
| Water | 255 | `#2078da` | `#3186e9` | water, drainage, sewage |
| Works | 42 | `#f67742` | `#a23a00` | road_damage, construction, land_planning, encroachment |
| Environment | 165 | `#00b07f` | `#00a376` | waste, green_project |
| Pollution | 350 | `#f677b8` | `#b73e81` | pollution |

`Other` — the residual bucket, for reports that fit no family — is listed
separately below, because it is not a sixth identity.

### The residual

`Other` takes a **neutral**, not a sixth hue: it is the bucket for everything
that has no family, and it is meant to read as "not a category". A mid grey
does not work here — it collapses into the environment hue under simulated
colour-vision deficiency (ΔE 1.9, deutan, in dark mode) — so the neutral is
pitched clear of the family band in **lightness** instead, and is held to a
different standard: it is exempt from the chroma floor (it is meant to read
as gray) but must still separate from every family, because on the map it
sits beside them.

| Mode | Neutral | Normal-vision ΔE | CVD ΔE | vs surface |
|------|---------|------------------|--------|------------|
| Light | `#3f454d` | 24.3 | 11.3 | 9.57:1 |
| Dark | `#a3aeb9` | 17.3 | 10.3 | 7.61:1 |

### Validator — light mode, `--pairs all`

```
Lightness band     true   all 5 inside L 0.43–0.77
Chroma floor       true   all 5 >= 0.1
CVD separation     pass   worst all-pairs #f677b8↔#00b07f ΔE 8.3 (deutan) · tritan 5.2
Normal-vision floor pass  worst all-pairs #f67742↔#c6423b ΔE 15.1 (normal)
Contrast           relief below 3:1 — relief required: #f67742 2.72, #00b07f 2.76, #f677b8 2.52
```

### Validator — dark mode, `--pairs all`

```
Lightness band     true   all 5 inside L 0.48–0.67
Chroma floor       true   all 5 >= 0.1
CVD separation     pass   worst all-pairs #00a376↔#eb6459 ΔE 8.2 (deutan) · tritan 4.1
Normal-vision floor pass  worst all-pairs #b73e81↔#a23a00 ΔE 15.5 (normal)
Contrast           relief below 3:1 — relief required: #a23a00 2.57
```

The **relief** verdict is not a dismissal: every family colour is drawn
beside a visible label — the map legend names each family, the feed card
names the category, and the chart legend names the segment.

### Ink on each fill

The ink that sits on top of a family fill — the pin glyph. This is a
graphical object, so the bar is WCAG 1.4.11 non-text contrast, **3:1**, not
the 4.5:1 that body text would need. Worst case across all six accents:

| Family | Light fill ink | Dark fill ink |
|--------|----------------|---------------|
| Security | `#ffffff` (4.95:1) | `#0b0b0b` (6.09:1) |
| Water | `#ffffff` (4.41:1) | `#0b0b0b` (5.36:1) |
| Works | `#0b0b0b` (7.16:1) | `#ffffff` (6.68:1) |
| Environment | `#0b0b0b` (7.05:1) | `#0b0b0b` (6.09:1) |
| Pollution | `#0b0b0b` (7.73:1) | `#ffffff` (5.22:1) |
| Other (residual) | `#ffffff` (9.68:1) | `#0b0b0b` (8.73:1) |

---

## Status ramp — the verification pipeline

An **ordinal** scale, so it takes one hue in stepped lightness rather than
categorical colours. It follows the accent's hue, so it moves with the theme.

The step nearest the surface is status-1 in both modes — the lightest on the
light surface, the darkest on the dark one — and it is the one that would
otherwise fade into the background, so it clears 2:1 against it. Adjacent
steps sit at least 0.06 apart in lightness.

| Step | Stage | Light L | Dark L | Light ink | Dark ink |
|------|-------|---------|--------|-----------|----------|
| 1 | Under verification | 0.770 | 0.424 | dark | light |
| 2 | Under review | 0.702 | 0.492 | dark | light |
| 3 | Corroborated | 0.634 | 0.560 | dark | light |
| 4 | Verified | 0.566 | 0.628 | light | dark |
| 5 | Resolved | 0.498 | 0.696 | light | dark |

Chroma falls along the ramp (`--brand-chroma` × 0.55, 0.7, 0.85, 0.95, 1) so
the pale end does not read as a tint. The ramp passes the ordinal check for
all six accents in both modes — see `tools/status-ramp.mjs`.

**Rejected** sits off the scale and takes the reserved destructive colour,
always paired with its icon and label.

---

## Reserved status colours

Never reused as a series colour. They always ship with an icon and a label.

| Role | Light | Dark | Token |
|------|-------|------|-------|
| Destructive | `oklch(0.577 0.208 27.3)` | `oklch(0.62 0.2 25)` | `--destructive` |
| Success | `oklch(0.55 0.15 145)` | `oklch(0.68 0.16 145)` | `--success` |
| Warning | `oklch(0.72 0.16 75)` | `oklch(0.78 0.15 80)` | `--warning` |

---

## Accent themes

A theme is **two numbers**: a hue and a chroma. Every other role — surfaces,
ink, the brand ramp, the focus ring, the status ramp, chart ink — is derived
from them, so a new theme costs one declaration rather than a second palette
to maintain. The light and dark steps of each role are chosen separately;
dark mode is a selected palette, never an inverted one.

| Theme | Hue | Chroma | Note |
|-------|-----|--------|------|
| Moss (default) | 152 | 0.115 | Kenyan green |
| Ocean | 244 | 0.125 | civic blue |
| Ember | 42 | 0.115 | terracotta |
| Plum | 318 | 0.125 | violet |
| Indigo | 274 | 0.130 | deep indigo |
| Slate | 250 | 0.035 | neutral graphite |

---

## Chart chrome

Recessive by design — the grid and the axis sit behind the data.

| Token | Light | Dark |
|-------|-------|------|
| `--chart-grid` | `oklch(0.87 0.012 h)` | `oklch(0.32 0.018 h)` |
| `--chart-axis` | `oklch(0.505 0.018 h)` | `oklch(0.7 0.016 h)` |
| `--chart-cursor` | `oklch(0.235 0.015 h / 0.06)` | `oklch(0.955 0.006 h / 0.08)` |
| `--chart-surface` | `--card` | `--card` |

---

## Reproducing

```
node tools/verify-palette.mjs             # re-verify the shipped palette end to end
node tools/category-palette.mjs H 8 1 0.005   # how the five family hues were searched
node tools/status-ramp.mjs                # the status ramp
node tools/map-hues.mjs                   # how many hues an all-pairs form can carry
```

`verify-palette.mjs` is the one that matters: it holds the same values as
this file and runs the validator over them, so "this palette passes" is a
command with an exit code rather than a sentence. The search tools are how
the values were arrived at — their output is deterministic, but a search
finds a *passing* palette, not necessarily the one already shipped, so the
shipped values live in the verifier and here, not in the search.

The validator itself lives with the data-viz skill:

```
node scripts/validate_palette.js "#c6423b,#2078da,#f67742,#00b07f,#f677b8" --mode light --pairs all
```
