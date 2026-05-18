// ─── iOS Safari: scroll restoration + top ───
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─── iOS Safari: --vh fix ───
const setVh = () => {
  document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
};
setVh();
window.addEventListener('resize', setVh, { passive: true });

// ─── SMOOTH SCROLL: Lenis ───
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
  smoothWheel: true,
  smoothTouch: false,   // native touch on mobile
  wheelMultiplier: 0.9,
});

// ─── NAV: show border on scroll ───
const nav = document.getElementById('nav');
lenis.on('scroll', ({ scroll }) => {
  nav.classList.toggle('scrolled', scroll > 50);
});

// ─── ANCHOR LINKS: smooth via Lenis ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -72, duration: 1.4 });
  });
});

// ─── GSAP ───
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Sync Lenis with GSAP ticker so ScrollTrigger stays accurate
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ─── PAGE LOAD: hero entrance ───
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('#nav',         { y: -20, opacity: 0, duration: 0.7 }, 0.1)
    .from('.hero-image',  { opacity: 0,          duration: 1.8 }, 0.2)
    .from('.hero-name',   { y: 44, opacity: 0,   duration: 1.4 }, 0.6)
    .from('.hero-title',  { y: 18, opacity: 0,   duration: 0.9 }, 1.2);

  // ─── GALLERY ANIMATIONS ───
  if (document.getElementById('gallery')) {
    const isDesktop = window.matchMedia('(min-width: 901px)').matches;

    // Parallax — desktop only (mobile resets to 100% height)
    if (isDesktop) {
      gsap.to('.g-img-1', {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.g-block-1',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      });

      gsap.to('.g-counter', {
        yPercent: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: '.g-block-1',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      });

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
    gsap.fromTo('.g-block-2',
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
      }
    );

    // Brightness emergence — image rises from dark to full
    gsap.fromTo('.g-img-2',
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
      }
    );

    // Meta rows staggered fade-up — all devices
    gsap.fromTo('.g-meta',
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
      }
    );
  }

} else {
  // Fallback: run Lenis via rAF if GSAP unavailable
  (function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  })(performance.now());
}

// ─── FADE IN: IntersectionObserver ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
