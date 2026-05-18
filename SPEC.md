# LISA MIZUNO — Portfolio Site Specification

**URL (GitHub Pages):** https://ops324.github.io/lisa-mizuno-portfolio/  
**URL (Vercel):** https://lisa-mizuno.vercel.app/  
**Hosting:** GitHub Pages (`main` branch, root `/`) + Vercel (`serene-leavitt-d01939`)  
**Last updated:** 2026-05-18

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
| Subtext | `#8a7f76` (muted taupe) |
| Border | `#d9d0c6` (warm gray) |
| Gallery BG | `#111009` (warm near-black) |
| Font serif | Cormorant Garamond 300/400 |
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

### Hero
- Full viewport, 2-column grid (desktop) / stacked (mobile)
- Left: grayscale portrait, hover reduces grayscale to 60%
- Right: Cormorant Garamond name at `clamp(4rem, 7vw, 8.5rem)`
- Scroll cue: vertical "SCROLL" text `::after`, bottom-right (hidden on mobile)

### About
- Bilingual bio (JP active by default, EN hidden via `.bio` / `.bio.active`)
- `max-width: 860px`, `padding: 9rem 3rem`
- JP name displayed as serif heading above body text

### Works
- 13 partner logos, 4-col grid → 3-col (≤900px) → 2-col (≤480px)
- Grayscale → color on hover
- Orphaned last item auto-centered via `grid-column` nth-child rules
- **DOMMUNE**: shield icon (`dommune/Logo-1.png`) + wordmark (`dommune/Logo-2.png`) displayed side-by-side in one grid cell via `flex-direction: row`; backgrounds are cream (`#faf8f4`) baked in — no blend mode needed; grayscale filter excluded via `filter: none`

### Gallery
- Full-bleed dark section (`background: #111009`)
- **Block 1** (`dj-portrait.jpg`): `height: 90vh`, vertical parallax via GSAP ScrollTrigger
  - Ghost counter `"01"` overlaid, Cormorant Garamond `clamp(12rem, 22vw, 28rem)`, `3% opacity`, parallaxes upward independently
  - Editorial meta row bottom-left: `01 ── raster.focus Asia tour`
- **Block 2** (`tokyo-node.png`): `height: 75vh`, clip-path reveal from bottom on scroll enter + parallax
  - Editorial meta row: `02 ── 攻殻機動隊展 Ghost and the Shell Collaboration REFLEX 4 - MUTEK.JP`
- Image wrappers `height: 120%` / `top: -10%` to provide parallax travel room (desktop only)
- **Mobile (≤900px):** image wrappers reset to `height: 100%; top: 0` — prevents unwanted crop/zoom
- **Mobile:** GSAP parallax (`yPercent`) disabled; clip-path reveal and meta fade-up run on all devices
- GSAP 3.12 + ScrollTrigger loaded via CDN
- **Block gap:** `margin-bottom: 0` — no gap between blocks (dark background never bleeds through)

#### Block 2 reveal detail
- Clip direction: `inset(0 0 100% 0)` → `inset(0 0 0% 0)` (clips from bottom; top of image always exposed first)
- Trigger: `start: 'top bottom'` / `end: 'bottom bottom'` / `scrub: 1.2`
- Mathematical guarantee: revealed area == visible viewport area at all times → no dark background visible at any scroll position
- Brightness fade: `0.4 → 1.0` (`scrub: 2`, end: `top center`) — image emerges from darkness cinematically

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
| Anchor nav links | `lenis.scrollTo(target, { offset: -72, duration: 1.4 })` |
| Nav border on scroll | `lenis.on('scroll')` → `.scrolled` class at 50px |
| Page load hero entrance | GSAP timeline: nav ↓, image fade, name slide-up, title fade |
| Fade-in on scroll | `IntersectionObserver` → `.fade-in.visible` (opacity + translateY) |
| Gallery Image 1 parallax | GSAP `yPercent: 20`, `scrub: 1.5` — desktop only |
| Ghost counter parallax | GSAP `yPercent: -40`, `scrub: 1.5` — desktop only |
| Gallery Image 2 clip-path reveal | GSAP `inset(0 0 100% 0)` → `inset(0 0 0% 0)`, `scrub: 1.2`, `start:'top bottom'` `end:'bottom bottom'` — all devices |
| Gallery Image 2 brightness fade | GSAP `brightness(0.4 → 1)`, `scrub: 2`, `end:'top center'` — cinematic dark emergence |
| Gallery Image 2 parallax | GSAP `yPercent: 15`, `scrub: 1.5` — desktop only |
| Meta fade-up | GSAP stagger `y: 18 → 0`, `duration: 0.9`, `power2.out` |
| Logo hover | CSS `filter: grayscale(0%)` transition |
| Connect link hover | CSS `padding-left` + `::after` opacity |
| iOS vh fix | `--vh` CSS variable updated on resize via JS |
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
