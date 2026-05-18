// iOS Safari: disable scroll restoration and force top on load
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// iOS Safari: set --vh based on actual visible window height
const setVh = () => {
  document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
};
setVh();
window.addEventListener('resize', setVh, { passive: true });

// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// Fade in on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Gallery: GSAP ScrollTrigger animations
if (document.getElementById('gallery') && typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  const isDesktop = window.matchMedia('(min-width: 901px)').matches;

  // Parallax only on desktop — mobile uses 100% height images (no crop/zoom)
  if (isDesktop) {
    // Image 1 parallax
    gsap.to(".g-img-1", {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: ".g-block-1",
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    // Ghost counter parallax
    gsap.to(".g-counter", {
      yPercent: -40,
      ease: "none",
      scrollTrigger: {
        trigger: ".g-block-1",
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    // Image 2 parallax
    gsap.to(".g-img-2", {
      yPercent: 15,
      ease: "none",
      scrollTrigger: {
        trigger: ".g-block-2",
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }

  // Image 2 clip-path reveal — all devices
  gsap.fromTo(".g-block-2",
    { clipPath: "inset(100% 0 0 0)" },
    {
      clipPath: "inset(0% 0 0 0)",
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".g-block-2",
        start: "top 75%",
        toggleActions: "play none none reverse"
      }
    }
  );

  // Meta rows staggered fade-up — all devices
  gsap.fromTo(".g-meta",
    { opacity: 0, y: 18 },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.15,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".g-block-1",
        start: "top 60%"
      }
    }
  );
}
