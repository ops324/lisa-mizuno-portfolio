# LISA MIZUNO — Portfolio Site Specification

**URL:** https://ops324.github.io/lisa-mizuno-portfolio/  
**Hosting:** GitHub Pages (`main` branch, root `/`)  
**Last updated:** 2026-05-18

---

## Overview

Single-page bilingual portfolio site for DJ / artist Lisa Mizuno.  
Sections: Hero → About → Works → Live → Connect

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
01 About · 02 Works · 03 Live · 04 Connect

---

## File Structure

```
index.html          — Single HTML page
style.css           — All styles
script.js           — Interactions + GSAP gallery animations
favicon.svg
images/
  lisa-photo-web.jpg     — Hero portrait
  dj-portrait.jpg        — Gallery image 1 (dark DJ performance)
  tokyo-node.png         — Gallery image 2 (Tokyo Node venue)
  logos/                 — 13 partner brand SVG/PNG logos
```

---

## Sections

### Hero
- Full viewport, 2-column grid (desktop) / stacked (mobile)
- Left: grayscale portrait, hover reduces grayscale
- Right: Cormorant Garamond name at `clamp(4rem, 7vw, 8.5rem)`
- Scroll cue: vertical "SCROLL" text bottom-right

### About
- Bilingual bio (JP active by default, EN hidden)
- `max-width: 860px`, `padding: 9rem 3rem`

### Works
- 13 partner logos, 4-col grid → 3-col (≤900px) → 2-col (≤480px)
- Grayscale → color on hover

### Live (Gallery)
- Full-bleed dark section (`#111009`)
- **Image 1** (`dj-portrait.jpg`): 90vh, vertical parallax via GSAP ScrollTrigger
- **Image 2** (`tokyo-node.png`): 75vh, clip-path reveal from bottom on scroll enter + parallax
- Ghost counter "01" in Cormorant Garamond at `clamp(12rem, 22vw, 28rem)`, parallaxes independently
- Editorial meta rows (number · rule · location label) fade-up on scroll
- GSAP 3.12 + ScrollTrigger loaded via CDN

### Connect
- 2 categories: Music / Media
- List links with slide-right hover + `↗` arrow reveal

---

## Animations & Interactions

| Effect | Implementation |
|---|---|
| Fade-in on scroll | `IntersectionObserver` → `.fade-in.visible` |
| Nav border on scroll | `window.scroll` → `.scrolled` class at 50px |
| Gallery parallax | GSAP `scrub: true` ScrollTrigger |
| Gallery clip-path reveal | GSAP `fromTo` clipPath `inset(100% → 0%)` |
| Meta fade-up | GSAP stagger `y: 18 → 0` |
| Logo hover | CSS `filter: grayscale(0%)` transition |
| Connect hover | CSS `padding-left` + `::after` opacity |
| iOS vh fix | `--vh` CSS variable updated on resize |

---

## Dependencies

| Library | Version | Load |
|---|---|---|
| GSAP | 3.12.5 | CDN (cdnjs) |
| ScrollTrigger | 3.12.5 | CDN (cdnjs) |
| Google Fonts | — | Cormorant Garamond, Space Grotesk, Noto Sans JP |

---

## Deployment

Push to `main` → GitHub Pages auto-deploys within ~1 minute.  
No build step required (pure HTML/CSS/JS).
