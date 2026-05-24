# LISA MIZUNO — Portfolio Site Specification

**URL (GitHub Pages):** https://ops324.github.io/lisa-mizuno-portfolio/  
**URL (Vercel):** https://lisa-mizuno.vercel.app/  
**Hosting:** GitHub Pages (`main` branch, root `/`) + Vercel (`serene-leavitt-d01939`)  
**Last updated:** 2026-05-25 (rev 7)

---

## Overview

Single-page bilingual portfolio site for DJ / artist Lisa Mizuno.  
Sections: Hero → About → Works → Gallery → Connect

---

## Design System

| Token | Value |
|---|---|
| Background | `#faf8f4` (warm cream) |
| Text | `#1a1714` (dark brown) |
| Subtext | `#7a6f64` (muted taupe — WCAG AA ≥4.5:1 on bg) |
| Border | `#d9d0c6` (warm gray) |
| Gallery BG | `#111009` (warm near-black) |
| Font serif | Cormorant Garamond 300/400/500 |
| Font sans | Space Grotesk 300/400/500 |
| Font JP | Noto Sans JP 300 |

Section labels auto-number via CSS `counter-increment: section-index`:  
01 About · 02 Works · 03 Gallery · 04 Connect

---

## File Structure

```
index.html               — Single HTML page
style.css                — All styles
script.js                — Interactions + GSAP gallery animations
favicon.svg
images/
  lisa-photo-web.jpg     — Hero portrait
  dj-portrait.jpg        — Gallery block 1 (dark DJ performance, red lighting)
  tokyo-node.png         — Gallery block 2 (Tokyo Node venue, blue lighting)
  music-artwork.png      — Connect / Music row artwork (square cosmic abstract)
  media-editorial.png    — Connect / Media row photo (B&W staircase portrait)
  logos/                 — 13 partner brand SVG/PNG logos
    pioneerdj.svg  mutek.svg  parco.svg  keisukeyoshida.png
    shogakukan.png  shibuyanoradio.svg  ignite.svg  oizumi.png  malakai.png
    tokyonode.svg  morimori.svg  shibuyatv.png
    dommune/
      Logo-1.png   — shield icon (1254×1254, cream bg)
      Logo-2.png   — wordmark (2171×724, cream bg)
```

---

## Sections

### Navigation
- Fixed header (`position: fixed`), logo left + links right
- Scroll > 50px → `.scrolled` class adds bottom border
- **Scroll-spy:** `IntersectionObserver` (`rootMargin: '-50% 0px -50% 0px'`) adds `.active` to the nav link matching the section currently in the middle of the viewport
- **Hamburger menu (≤480px):** `.nav-toggle` button (2-bar → X on open); `.nav-links` becomes a full-viewport overlay (`position: fixed; inset: 0`). GSAP nav entrance uses `clearProps: 'transform'` to prevent the residual GSAP transform from becoming a CSS containing block that would constrain the `inset: 0` overlay to the 66px nav bar.
- Escape key closes the menu; anchor clicks close the menu before scrolling

### Hero
- Full viewport, 2-column grid (desktop) / stacked (mobile)
- Left: grayscale portrait, hover reduces grayscale to 60%
- Right: Cormorant Garamond name at `clamp(4rem, 7vw, 8.5rem)`
- Scroll cue: vertical "SCROLL" text `::after`, bottom-right (hidden on mobile)

### About
- Bilingual bio with **JP / EN toggle** (JP active by default)
- `.lang-toggle` (JP / EN) lives in the `01 ABOUT` section-label row, right-aligned via `margin-left: auto`; the body text begins directly below (no separate name heading — the name already appears in the nav, hero, and the bio's opening line)
- Toggle switches `.bio.active` between `#bio-jp` / `#bio-en`; active language button styled via `aria-pressed="true"`; `ScrollTrigger.refresh()` runs after each switch to re-sync gallery triggers to the new page height
- **Typography:**
  - **EN bio** (`.bio.en`) set in Cormorant Garamond (serif, matches the `.bio-name`), `font-size: 1.12rem` / `font-weight: 500` for body legibility at text size
  - **JP bio** (`.bio.jp`) uses font stack `var(--font-serif), var(--font-jp)` — Latin glyphs (e.g. "LISA MIZUNO", "Resonance") render in Cormorant Garamond, Japanese glyphs fall back to Noto Sans JP (Cormorant has no JP coverage)
- **Accessibility:**
  - `lang="en"` / `lang="ja"` on the bio blocks so screen readers announce each language correctly (`<html lang="en">` kept — UI chrome/meta are English)
  - Active language button shows an underline indicator (`.lang-btn[aria-pressed="true"]::after`) in addition to color, so the selection is clear regardless of contrast
  - `.lang-btn:focus-visible` outline for keyboard navigation
- `max-width: 860px`, `padding: 9rem 3rem`

### Works
- 13 partner logos, 4-col grid → 3-col (≤900px) → 2-col (≤480px)
- Grayscale → color on hover
- Orphaned last item auto-centered via `grid-column` nth-child rules (4n+1→col 2/4, 3n+1→col 2/3, 2n+1→col 1/-1)
- **DOMMUNE**: shield icon (`dommune/Logo-1.png`) + wordmark (`dommune/Logo-2.png`) side-by-side in one grid cell (`flex-direction: row`); canvas background removal at load time (script.js `removeDommuneBackground`) makes PNG backgrounds transparent; desktop icon/text: 30px/38px; mobile (≤480px): 22px/30px; grayscale excluded via `filter: none`
- **IGNITE SVG**: `text-anchor="middle" x="123"` to center text within 240px viewBox

### Gallery
- Full-bleed dark section (`background: #111009`)
- **Block 1** (`dj-portrait.jpg`): `height: 90vh`, vertical parallax via GSAP ScrollTrigger
  - Ghost counter `"01"` overlaid, Cormorant Garamond `clamp(12rem, 22vw, 28rem)`, `3% opacity`, parallaxes upward independently
  - Editorial meta row bottom-left: `01 ── raster.focus Asia tour`
- **Block 2** (`tokyo-node.png`): `height: 75vh`, clip-path reveal from bottom on scroll enter + parallax
  - Editorial meta row: `02 ── 攻殻機動隊展 Ghost in the Shell Collaboration REFLEX 4 - MUTEK.JP`
- Image wrappers `height: 120%` / `top: -10%` to provide parallax travel room (desktop only)
- **Mobile (≤900px):** image wrappers reset to `height: 100%; top: 0` — prevents unwanted crop/zoom
- **Mobile:** GSAP parallax (`yPercent`) **and** the Block 2 `filter: brightness()` scrub are disabled (animating `filter` every frame is GPU-heavy on mobile); clip-path reveal and meta fade-up still run on all devices
- GSAP 3.12 + ScrollTrigger loaded via CDN
- **Block gap:** `margin-bottom: 0` — no gap between blocks (dark background never bleeds through)

#### Block 2 reveal detail
- Clip direction: `inset(0 0 100% 0)` → `inset(0 0 0% 0)` (clips from bottom; top of image always exposed first)
- Trigger: `start: 'top bottom'` / `end: 'bottom bottom'` / `scrub: 1.2`
- Mathematical guarantee: revealed area == visible viewport area at all times → no dark background visible at any scroll position
- Brightness fade: `0.4 → 1.0` (`scrub: 2`, end: `top center`) — image emerges from darkness cinematically

### Footer
- `© [year] LISA MIZUNO` — year is set dynamically by JS (`new Date().getFullYear()`); HTML fallback is `2026`

### Connect
- 2 categories: **Music** / **Media**
- Layout: alternating 2-column rows (`.connect-row` / `.connect-row--reverse`)
  - **Music row** — links left (1fr), image right (38%): `music-artwork.png` (1:1 square)
  - **Media row** — image left (38%), links right (1fr): `media-editorial.png` (3:4 portrait, `object-position: center 20%`)
- Link items: slide-right on hover (`padding-left: 1rem`) + `↗` arrow reveal
- `↗` arrow hidden on touch devices via `@media (hover: none)`
- Photo centered via `margin: 0 auto` + `align-self: center`; no hover effect
- Mobile (≤900px): collapses to 1-column; photos constrained to `max-width: 58%`
- Mobile (≤480px): photos `max-width: 80%`

---

## Animations & Interactions

| Effect | Implementation |
|---|---|
| Smooth scroll | **Lenis 1.1.14** — expo ease-out, `duration: 1.2`, `smoothTouch: false` |
| Anchor nav links | `lenis.scrollTo(target, { offset: -72, duration: 1.4 })`; menu closed before scroll |
| Nav border on scroll | `lenis.on('scroll')` → `.scrolled` class at 50px |
| Scroll-spy | `IntersectionObserver` (`rootMargin: '-50% 0px -50% 0px'`) → `.active` on matching nav link |
| Mobile hamburger | `.nav-toggle` toggles `#nav.menu-open`; Escape key / anchor click closes; `aria-expanded` updated |
| Page load hero entrance | GSAP timeline: nav ↓ (`clearProps:'transform'`), image fade, name slide-up, title fade |
| Fade-in on scroll | `IntersectionObserver` → `.fade-in.visible` (opacity + translateY) |
| About language toggle | JP / EN buttons (in the section-label row) swap `.bio.active`, update `aria-pressed`, then `ScrollTrigger.refresh()` |
| Gallery Image 1 parallax | GSAP `yPercent: 20`, `scrub: 1.5` — desktop only |
| Ghost counter parallax | GSAP `yPercent: -40`, `scrub: 1.5` — desktop only |
| Gallery Image 2 clip-path reveal | GSAP `inset(0 0 100% 0)` → `inset(0 0 0% 0)`, `scrub: 1.2`, `start:'top bottom'` `end:'bottom bottom'` — all devices |
| Gallery Image 2 brightness fade | GSAP `brightness(0.4 → 1)`, `scrub: 2`, `end:'top center'` — cinematic dark emergence — **desktop only** |
| Gallery Image 2 parallax | GSAP `yPercent: 15`, `scrub: 1.5` — desktop only |
| Meta fade-up | GSAP stagger `y: 18 → 0`, `duration: 0.9`, `power2.out` |
| Logo hover | CSS `filter: grayscale(0%)` transition |
| Connect link hover | CSS `padding-left` + `::after` opacity |
| Footer year | JS `new Date().getFullYear()` writes to `#footer-year`; HTML fallback `2026` |
| Reduced motion | `window.matchMedia('prefers-reduced-motion: reduce')` — Lenis and GSAP skipped entirely; CSS `@media (prefers-reduced-motion: reduce)` zeroes all transitions/animations |
| No-JS fallback | `<html class="no-js">` + inline `<script>` removes class immediately; `.no-js .fade-in` forces `opacity: 1; transform: none` |
| Focus-visible | `a:focus-visible`, `.nav-toggle:focus-visible` — 1px solid `--text` outline; `#gallery a:focus-visible` uses `--bg` (light on dark) |
| iOS vh fix | `--vh` CSS variable set on load; recomputed **only on width (orientation) change** — height-only `resize` events from the mobile address bar showing/hiding are ignored to avoid hero reflow jank mid-scroll |
| Mobile nav perf | Nav `backdrop-filter: blur()` is **disabled ≤900px** (background already ~opaque) — avoids per-frame blur recompositing during scroll |
| GPU hints | `will-change: transform` on `.g-img-wrap`, `.g-counter` |

---

## Dependencies

| Library | Version | Load |
|---|---|---|
| GSAP | 3.12.5 | CDN (cdnjs) |
| ScrollTrigger | 3.12.5 | CDN (cdnjs) |
| Lenis | 1.1.14 | CDN (jsDelivr) |
| Google Fonts | — | Cormorant Garamond, Space Grotesk, Noto Sans JP |

---

## Deployment

| Target | Command | URL |
|---|---|---|
| GitHub Pages | Push to `main` → auto-deploys (~1 min) | ops324.github.io/lisa-mizuno-portfolio |
| Vercel | `npx vercel --prod --yes` from worktree dir | lisa-mizuno.vercel.app |

No build step required (pure HTML/CSS/JS).  
Vercel project: `serene-leavitt-d01939` (linked in worktree `.vercel/` config).

**Basic Auth:** `middleware.js` (Vercel Edge middleware) gates the **Vercel** deployment behind HTTP Basic Auth. GitHub Pages is a static host and does not run middleware, so that mirror is **not** password-protected.
