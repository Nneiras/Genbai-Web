import './style.css'

// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

if (currentTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}

themeToggle.addEventListener('click', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const newTheme = isLight ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Reveal animations on scroll
const revealElements = document.querySelectorAll('.service-card, .industry-card, .section-header, .efficiency-text, .efficiency-image, .hero-image');

const revealOnScroll = () => {
  const triggerBottom = window.innerHeight * 0.9;
  
  revealElements.forEach(el => {
    const elTop = el.getBoundingClientRect().top;
    if (elTop < triggerBottom) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  });
};

// Initial styles for reveal elements
revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
});

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// Navbar background change on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(5, 5, 5, 0.95)';
    nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  } else {
    nav.style.background = 'rgba(5, 5, 5, 0.8)';
    nav.style.boxShadow = 'none';
  }
});

console.log('GENBAI Landing Page Initialized');
