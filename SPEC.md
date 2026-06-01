# LISA MIZUNO — Portfolio Site Specification

**URL (GitHub Pages):** https://ops324.github.io/lisa-mizuno-portfolio/  
**URL (Vercel):** https://lisa-mizuno.vercel.app/  
**Hosting:** GitHub Pages (`main` branch, root `/`) + Vercel (`serene-leavitt-d01939`)  
**Last updated:** 2026-06-01 (rev 10 — security/quality baseline: env-var Basic Auth, SRI, Biome/html-validate, GitHub Actions CI; Gallery Block 1 → video)

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
| Font JP | Shippori Mincho 400/500 (Mincho serif) |

Section labels auto-number via CSS `counter-increment: section-index`:  
01 About · 02 Works · 03 Gallery · 04 Connect

---

## File Structure

```
index.html               — Single HTML page
style.css                — All styles
script.js                — Interactions + GSAP gallery animations
middleware.js            — Vercel Edge middleware (Basic Auth)
favicon.svg / .ico       — Tab icons
apple-touch-icon.png     — iOS home-screen icon
package.json             — npm scripts + devDependencies (no runtime deps)
biome.json               — Lint / format config
.htmlvalidate.json       — HTML validation config
lighthouserc.json        — Lighthouse CI config
.gitignore               — node_modules / .env / .DS_Store etc.
.env.example             — Sample auth env vars (dummy values)
.github/workflows/ci.yml — GitHub Actions CI
README.md                — Developer documentation
SPEC.md                  — This file
仕様書.md                 — Specification (Japanese)
images/
  lisa-photo-web.jpg     — Hero portrait
  dj-shanghai.mp4        — Gallery block 1 background video (Shanghai show)
  dj-portrait.jpg        — Poster / fallback for the block 1 video
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
  - **JP bio** (`.bio.jp`) uses font stack `var(--font-serif), var(--font-jp)` — Latin glyphs (e.g. "LISA MIZUNO", "Resonance") render in Cormorant Garamond, Japanese glyphs render in Shippori Mincho. The JP face is placed before the generic `serif` so Japanese resolves to Shippori Mincho (not a device-dependent system serif)
- **Accessibility:**
  - `lang="en"` / `lang="ja"` on the bio blocks so screen readers announce each language correctly (`<html lang="en">` kept — UI chrome/meta are English)
  - Active language button shows an underline indicator (`.lang-btn[aria-pressed="true"]::after`) in addition to color, so the selection is clear regardless of contrast
  - `.lang-btn:focus-visible` outline for keyboard navigation
- `max-width: 860px`, `padding: 9rem 3rem`

### Works
- 13 partner logos, 4-col grid → 3-col (≤900px) → 2-col (≤480px)
- Grayscale → color on hover
- Orphaned last item auto-centered via `grid-column` nth-child rules (4n+1→col 2/4, 3n+1→col 2/3, 2n+1→col 1/-1)
- **Per-device order**: each item has an identifier class (`works-logo-item--pioneerdj`, etc.); DOM order = PC order, while tablet/mobile reorder rows via CSS `order` inside the media queries. Shibuya Television (www.sib.tv) is always last/centered (12 grid logos divide evenly into 2/3/4 cols, leaving it as the orphan)
- **Optical size balancing**: base `max-width: 100%; max-height: 30px` (height-driven, not full-width). Perceived size equalized by AREA: wide wordmarks (MALAKAI/TOKYONODE/KEISUKEYOSHIDA/sib.tv) capped with `max-width: min(Npx, 100%)` so they don't bleed to the cell edge; narrow/stacked marks lifted in height (森ビル/小学館 38px, IGNITE 32px). Area spread tightened to ~0.7–1.4× of tablet median (森ビル stays smallest — vertical lock-up)
- **DOMMUNE**: shield icon (`dommune/Logo-1.png`) + wordmark (`dommune/Logo-2.png`) side-by-side in one grid cell (`flex-direction: row`); canvas background removal at load time (script.js `removeDommuneBackground`) makes PNG backgrounds transparent; desktop icon/text: 30px/34px; mobile (≤480px): 24px/28px; `max-height: none` lifts the base cap; grayscale excluded via `filter: none`
- **IGNITE SVG**: `text-anchor="middle" x="123"` to center text within 240px viewBox; sized up to `max-height: 32px`

### Gallery
- Full-bleed dark section (`background: #111009`)
- **Block 1** (`dj-shanghai.mp4`): `height: 90vh`, vertical parallax via GSAP ScrollTrigger
  - Background **video** — `<video autoplay muted loop playsinline>` (auto-playing, looping, silent; `muted` + `playsinline` allow inline autoplay on mobile)
  - `poster="images/dj-portrait.jpg"` is the loading / playback-unavailable fallback (the JPG is retained for this)
  - `aria-hidden="true"` (decorative); the visible caption is the `.g-meta-label` row below
  - Parallax is applied to the wrapper `.g-img-1`, so it works unchanged whether the child is `<img>` or `<video>`; `.g-img-wrap img, .g-img-wrap video` share `object-fit: cover`
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
| GSAP | 3.12.5 | CDN (cdnjs) — SRI sha384 + `crossorigin="anonymous"` |
| ScrollTrigger | 3.12.5 | CDN (cdnjs) — SRI sha384 + `crossorigin="anonymous"` |
| Lenis | 1.1.14 | CDN (jsDelivr) — SRI sha384 + `crossorigin="anonymous"` |
| Google Fonts | — | Cormorant Garamond, Space Grotesk, Shippori Mincho |

All three CDN scripts carry Subresource Integrity (`integrity` sha384 + `crossorigin="anonymous"` + `referrerpolicy="no-referrer"`) for tamper detection.

**Dev tooling** (devDependencies only — no runtime deps): Biome 1.9.4 (lint/format), html-validate 9.5.3, @lhci/cli 0.14.0 (Lighthouse CI). npm scripts: `lint`, `lint:fix`, `format`, `validate:html`, `lighthouse`, `check`.

---

## Deployment

| Target | Command | URL |
|---|---|---|
| GitHub Pages | Push to `main` → auto-deploys (~1 min) | ops324.github.io/lisa-mizuno-portfolio |
| Vercel | `npx vercel --prod --yes` from worktree dir | lisa-mizuno.vercel.app |

No build step required for production (pure HTML/CSS/JS; Lighthouse CI assembles a `dist/` only for measurement).  
Vercel project: `serene-leavitt-d01939` (linked in worktree `.vercel/` config). Canonical production domain: `lisa-mizuno.vercel.app`.

**Workflow:** changes land via branch + PR to `main`; merging triggers the Vercel production deploy. Direct pushes to `main` are avoided.

### Basic Auth (`middleware.js`)

`middleware.js` (Vercel Edge middleware) gates the **Vercel** deployment behind HTTP Basic Auth. GitHub Pages is a static host and does not run middleware, so that mirror is **not** password-protected.

- Credentials come from env vars `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` — **never hardcoded** (set in Vercel for both Production and Preview; `.env.example` documents the keys with dummy values)
- Env vars are read **inside the handler (request-time)** — reading them at module-init can yield undefined in some environments and cause auth to always fail
- **Fail-closed**: if either var is missing, all requests are rejected
- **Constant-time comparison** (`safeEqual`) for both username and password (evaluated unconditionally) to avoid timing attacks
- `matcher` excludes only the icon files (`favicon.svg` / `favicon.ico` / `apple-touch-icon.png`) so the browser tab icon doesn't 401

### CI (`.github/workflows/ci.yml`)

On push / PR to `main` (concurrency cancels superseded runs):

| Job | What it runs |
|---|---|
| Lint & HTML validate | `biome check` (JS/CSS) + `html-validate index.html` |
| Secret scan | `gitleaks` scans commits for leaked secrets |
| Lighthouse CI | Lighthouse ×3 against an assembled `dist/` (node_modules excluded) |

**Measured Lighthouse scores** (real values): Performance 72 / Accessibility 96 / Best Practices 100 / SEO 100.

---

## Changelog (recent)

| Date | Change |
|---|---|
| 2026-06-01 | Moved Basic Auth env-var reads inside the handler (request-time) to fix production login failure (PR #24) |
| 2026-06-01 | Security/quality baseline (PR #23): env-var Basic Auth (no hardcode, fail-closed, constant-time compare), SRI on CDN scripts, `.gitignore` / `.env.example`, Biome + html-validate + Lighthouse CI, GitHub Actions CI (lint / gitleaks / Lighthouse), README |
| 2026-06-01 | Gallery Block 1 swapped from static `dj-portrait.jpg` to Shanghai-show video `dj-shanghai.mp4` (autoplay/loop/muted background style, JPG kept as `poster`, `aria-hidden`); file renamed to ASCII for delivery stability |
