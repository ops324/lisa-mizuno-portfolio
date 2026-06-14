// ─── iOS Safari: scroll restoration + top ───
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── iOS Safari: --vh fix ───
// Only recompute on width (orientation) change. Mobile browsers fire `resize`
// when the address bar shows/hides during scroll; recomputing --vh there
// resized the full-height hero mid-scroll and caused jank.
let vhWidth = window.innerWidth;
const setVh = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
};
setVh();
window.addEventListener(
  'resize',
  () => {
    if (window.innerWidth === vhWidth) return;
    vhWidth = window.innerWidth;
    setVh();
  },
  { passive: true },
);

// ─── MOTION PREFERENCE ───
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nav = document.getElementById('nav');

// ─── MOBILE MENU (hamburger) ───
const navToggle = nav.querySelector('.nav-toggle');
function closeMenu() {
  nav.classList.remove('menu-open');
  if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
}
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

// ─── SMOOTH SCROLL: Lenis (skipped when the user prefers reduced motion) ───
let lenis = null;
if (!prefersReduced) {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), // expo ease-out
    smoothWheel: true,
    smoothTouch: false, // native touch on mobile
    wheelMultiplier: 0.9,
  });
}

// ─── NAV: show border on scroll (works with or without Lenis) ───
const setNavBorder = (y) => nav.classList.toggle('scrolled', y > 50);
if (lenis) {
  lenis.on('scroll', ({ scroll }) => setNavBorder(scroll));
} else {
  window.addEventListener('scroll', () => setNavBorder(window.scrollY), { passive: true });
  setNavBorder(window.scrollY);
}

// ─── ANCHOR LINKS ───
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) {
      lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    } else {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72 });
    }
  });
});

// ─── GSAP (skipped when the user prefers reduced motion) ───
if (!prefersReduced && typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Sync Lenis with GSAP ticker so ScrollTrigger stays accurate
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ─── PAGE LOAD: hero entrance ───
  gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    // clearProps: a residual transform on #nav would make it the containing
    // block for the position:fixed mobile menu overlay (breaking its inset:0).
    .from('#nav', { y: -20, opacity: 0, duration: 0.7, clearProps: 'transform' }, 0.1)
    .from('.hero-image', { opacity: 0, duration: 1.8 }, 0.2)
    .from('.hero-name', { y: 44, opacity: 0, duration: 1.4 }, 0.6)
    .from('.hero-title', { y: 18, opacity: 0, duration: 0.9 }, 1.2);

  // ─── GALLERY ANIMATIONS ───
  if (document.getElementById('gallery')) {
    const isDesktop = window.matchMedia('(min-width: 901px)').matches;

    // Parallax — desktop only (mobile resets to 100% height).
    // Block 1 (the 16:9 video) is shown whole via object-fit: contain with its
    // wrapper pinned to the block, so it must NOT travel — any vertical movement
    // would clip the fully-fit frame. Parallax is kept for Block 2 only.
    if (isDesktop) {
      gsap.to('.g-img-2', {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: '.g-block-2',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
    }

    // Clip-path reveal — scrub-based, synced to viewport entry
    // inset(0 0 B 0): clips from bottom → top of image always exposed first.
    // start:'top bottom' / end:'bottom bottom' ensures revealed area == visible area at all times.
    // No dark background ever shows through.
    gsap.fromTo(
      '.g-block-2',
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)',
        ease: 'none',
        scrollTrigger: {
          trigger: '.g-block-2',
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: 1.2,
        },
      },
    );

    // Brightness emergence — image rises from dark to full.
    // Desktop only: animating `filter` every scroll frame is GPU-heavy on mobile.
    if (isDesktop) {
      gsap.fromTo(
        '.g-img-2',
        { filter: 'brightness(0.4)' },
        {
          filter: 'brightness(1)',
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.g-block-2',
            start: 'top bottom',
            end: 'top center',
            scrub: 2,
          },
        },
      );
    }

    // Meta rows staggered fade-up — all devices
    gsap.fromTo(
      '.g-meta',
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.g-block-1',
          start: 'top 60%',
        },
      },
    );
  }
} else if (lenis) {
  // Fallback: run Lenis via rAF if GSAP unavailable
  (function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  })(performance.now());
}

// ─── GALLERY: robust background-video autoplay (mobile / tablet safe) ───
// The HTML already carries autoplay/muted/loop/playsinline, but mobile and
// tablet browsers frequently defer or block muted autoplay (off-screen
// deferral, iOS Low Power Mode, Android data saver, or the muted *attribute*
// not being honored). This re-asserts muted as a property, plays the moment
// the video scrolls into view, and falls back to the first user interaction.
(function galleryVideoAutoplay() {
  const video = document.querySelector('.g-img-1 video');
  if (!video) return;

  // Respect reduced motion: keep the poster frame, don't loop a moving bg.
  if (prefersReduced) {
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }

  video.muted = true; // property form — required for mobile/tablet autoplay
  video.setAttribute('playsinline', '');

  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  tryPlay();

  // Play when the gallery scrolls into view (mobile defers off-screen autoplay).
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) tryPlay();
        });
      },
      { threshold: 0.25 },
    );
    io.observe(video);
  }

  // Low Power Mode / data saver block autoplay outright — start on first touch.
  const kick = () => tryPlay();
  window.addEventListener('touchstart', kick, { once: true, passive: true });
  window.addEventListener('pointerdown', kick, { once: true });
})();

// ─── DOMMUNE: remove baked-in background via canvas ───
(function removeDommuneBg() {
  document.querySelectorAll('.dommune-icon, .dommune-text').forEach((img) => {
    const process = () => {
      if (img.dataset.bgRemoved) return;
      img.dataset.bgRemoved = '1';
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const bg = ctx.getImageData(5, 5, 1, 1).data;
      const id = ctx.getImageData(0, 0, c.width, c.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i] - bg[0];
        const dg = d[i + 1] - bg[1];
        const db = d[i + 2] - bg[2];
        if (dr * dr + dg * dg + db * db < 400) d[i + 3] = 0; // tolerance 20
      }
      ctx.putImageData(id, 0, 0);
      c.toBlob((blob) => {
        img.src = URL.createObjectURL(blob);
      });
    };
    img.complete && img.naturalWidth
      ? process()
      : img.addEventListener('load', process, { once: true });
  });
})();

// ─── ABOUT: language toggle (also switches the footer attribution note) ───
(function aboutLangToggle() {
  const buttons = document.querySelectorAll('.lang-btn');
  if (!buttons.length) return;

  // Groups of {jp, en} elements that switch together with the toggle.
  const groups = [
    { jp: document.getElementById('bio-jp'), en: document.getElementById('bio-en') },
    { jp: document.getElementById('resonance-jp'), en: document.getElementById('resonance-en') },
    { jp: document.getElementById('note-jp'), en: document.getElementById('note-en') },
  ];

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      groups.forEach(({ jp, en }) => {
        if (jp) jp.classList.toggle('active', lang === 'jp');
        if (en) en.classList.toggle('active', lang === 'en');
      });
      buttons.forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
      });
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });
})();

// ─── FADE IN: IntersectionObserver ───
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.1 },
);

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// ─── SCROLL-SPY: highlight the nav link for the section in view ───
(function scrollSpy() {
  const links = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (id) links[id] = a;
  });
  const sections = Object.keys(links)
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        Object.values(links).forEach((a) => a.classList.remove('active'));
        const active = links[entry.target.id];
        if (active) active.classList.add('active');
      });
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
  );

  sections.forEach((s) => spy.observe(s));
})();

// ─── FOOTER: current year ───
(function footerYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();
