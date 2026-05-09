// Language toggle
const langToggle = document.getElementById('langToggle');
const bioEn = document.getElementById('bio-en');
const bioJp = document.getElementById('bio-jp');
let currentLang = 'en';

langToggle.addEventListener('click', () => {
  if (currentLang === 'en') {
    bioEn.classList.remove('active');
    bioJp.classList.add('active');
    currentLang = 'jp';
    langToggle.textContent = 'JP / EN';
  } else {
    bioJp.classList.remove('active');
    bioEn.classList.add('active');
    currentLang = 'en';
    langToggle.textContent = 'EN / JP';
  }
});

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
