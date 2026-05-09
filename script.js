// Language toggle
const langToggle = document.getElementById('langToggle');
const bioEn = document.getElementById('bio-en');
const bioJp = document.getElementById('bio-jp');
let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  const isJp = lang === 'jp';

  // Bio toggle
  bioEn.classList.toggle('active', !isJp);
  bioJp.classList.toggle('active', isJp);

  // Toggle button label
  langToggle.textContent = isJp ? 'JP / EN' : 'EN / JP';

  // Nav links + section labels with data-en / data-jp
  document.querySelectorAll('[data-en][data-jp]').forEach(el => {
    el.textContent = isJp ? el.dataset.jp : el.dataset.en;
  });
}

langToggle.addEventListener('click', () => {
  setLang(currentLang === 'en' ? 'jp' : 'en');
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
