import './styles/main.css'
import { supabase } from './lib/supabase'

// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'dark';

// Initial state
htmlElement.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Mobile Menu Logic
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn?.addEventListener('click', () => {
  mobileMenuBtn.classList.toggle('active');
  navLinks.classList.toggle('active');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuBtn.classList.remove('active');
    navLinks.classList.remove('active');
  });
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
const revealElements = document.querySelectorAll('.service-card, .industry-card, .section-header, .efficiency-text, .efficiency-image, .hero-image, .about-text, .about-image, .value-card, .process-step, .contact-card, .blog-card');

const revealOnScroll = () => {
  const triggerBottom = window.innerHeight * 0.95;
  
  revealElements.forEach(el => {
    const elTop = el.getBoundingClientRect().top;
    if (elTop < triggerBottom) {
      el.classList.add('revealed');
    }
  });

  // Active Navigation Link Highlighting
  const sections = document.querySelectorAll('section, header');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop - 100) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').includes(current)) {
      link.classList.add('active');
    }
  });
};

// Initial styles and classes for reveal elements via CSS class
revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
});

// Define the 'revealed' state
const style = document.createElement('style');
style.innerHTML = `
  .revealed {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(style);

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// Navbar background change on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Generic Slider Logic
const initSlider = (sliderId, sectionClass) => {
  const sliderTrack = document.getElementById(sliderId);
  const section = sliderTrack?.closest('section');
  const nextBtn = section?.querySelector('.next-btn');
  const prevBtn = section?.querySelector('.prev-btn');

  if (sliderTrack && nextBtn && prevBtn) {
    let currentIndex = 0;
    const cards = sliderTrack.children;
    const totalCards = cards.length;

    const getVisibleCards = () => {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 992) return 2;
      return 3;
    };

    const updateSlider = () => {
      // Logic for transform is removed as we use native scroll
    };

    nextBtn.addEventListener('click', () => {
      const cardWidth = cards[0].offsetWidth + parseFloat(window.getComputedStyle(sliderTrack).gap || 0);
      sliderTrack.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
      const cardWidth = cards[0].offsetWidth + parseFloat(window.getComputedStyle(sliderTrack).gap || 0);
      sliderTrack.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });

    window.addEventListener('resize', updateSlider);
    // Initial update
    setTimeout(updateSlider, 100);
  }
};

// Initialize all sliders
initSlider('industry-slider');
initSlider('services-slider');
initSlider('blog-slider');

// Form Submission with Supabase Integration
const contactForm = document.getElementById('main-contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button');
    const originalText = btn.innerText;
    
    // Get form data
    const formData = new FormData(contactForm);
    const leadData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      industry: formData.get('industry'),
      message: formData.get('message'),
      status: 'new'
    };

    btn.innerText = 'Enviando...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    try {
      // 1. Try to save to Supabase
      const { error } = await supabase.from('leads').insert([leadData]);

      if (error) throw error;

      alert('¡Gracias! Tu propuesta ha sido enviada con éxito. Un experto de GENBAI se contactará contigo pronto.');
      contactForm.reset();
    } catch (err) {
      console.error('Error saving lead:', err);
      // Fallback or detailed error message
      alert('Hubo un problema al enviar tu mensaje. Por favor, intenta de nuevo o contáctanos directamente a info@genbai.com.');
    } finally {
      btn.innerText = originalText;
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  });
}

// --- Blog Modal Logic ---
const blogModal = document.getElementById('blog-modal');
const modalClose = blogModal?.querySelector('.modal-close');
const modalImage = document.getElementById('modal-image');
const modalTag = document.getElementById('modal-tag');
const modalDate = document.getElementById('modal-date');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');

const blogContent = {
  'blog-1': {
    title: 'El Futuro de la IA en las Pymes',
    tag: 'Tendencias',
    date: '10 Marzo, 2026',
    image: '/blog-1.png',
    text: `
      <p>La democratización de la inteligencia artificial está marcando un antes y un después en el ecosistema emprendedor. Lo que antes era exclusivo para corporaciones con presupuestos millonarios, hoy está al alcance de cualquier comercio local.</p>
      <p>A través de herramientas accesibles y modelos de lenguaje avanzados, las Pymes están logrando optimizar sus procesos de atención al cliente, gestión de inventarios y análisis de mercado con una precisión sin precedentes.</p>
      <p>En GENBAI, acompañamos esta transición diseñando soluciones que no solo automatizan tareas, sino que potencian el talento humano de tu equipo.</p>
    `
  },
  'blog-2': {
    title: 'Automatización: Menos Costos, Más Valor',
    tag: 'Eficiencia',
    date: '08 Marzo, 2026',
    image: '/blog-2.png',
    text: `
      <p>La eficiencia operativa es la clave para la supervivencia en mercados cada vez más competitivos. Implementar flujos de trabajo inteligentes permite reducir errores humanos y liberar tiempo valioso.</p>
      <p>Desde la clasificación automática de facturas hasta la programación predictiva de turnos, la automatización permite que tu negocio escale sin necesidad de incrementar proporcionalmente tus costos fijos.</p>
      <p>El retorno de inversión (ROI) en estas tecnologías suele verse reflejado en los primeros 3 a 6 meses de implementación.</p>
    `
  },
  'blog-3': {
    title: 'Ética y Responsabilidad en la IA',
    tag: 'Ética',
    date: '05 Marzo, 2026',
    image: '/blog-3.png',
    text: `
      <p>Con el gran poder de la IA viene una responsabilidad proporcional. En la carrera por la automatización, es fundamental no perder de vista la integridad de los datos y la transparencia algorítmica.</p>
      <p>Un enfoque ético no solo es una obligación moral, sino también una ventaja competitiva: genera confianza en tus clientes y garantiza que las soluciones sean sostenibles a largo plazo.</p>
      <p>Nuestras implementaciones siguen los estándares internacionales de protección de datos y equidad en los procesos de decisión automatizados.</p>
    `
  },
  'blog-4': {
    title: 'Midiendo el ROI de la IA',
    tag: 'Negocios',
    date: '01 Marzo, 2026',
    image: '/efficiency-real.png',
    text: `
      <p>Invertir en inteligencia artificial puede parecer un salto al vacío si no se cuenta con los métricos adecuados para medir su éxito. El Retorno de Inversión (ROI) es la brújula que guía estas decisiones financieras.</p>
      <p>Para calcularlo correctamente, es necesario considerar tanto el ahorro de costos directos (tiempo de personal, licencias de software antiguo) como las ganancias indirectas (mejora en la satisfacción del cliente, mayor velocidad de respuesta).</p>
      <p>En este artículo, desglosamos nuestra metodología para auditar el impacto económico de cada implementación personalizada que realizamos.</p>
    `
  }
};

document.querySelectorAll('.blog-card').forEach(card => {
  card.querySelector('.read-more')?.addEventListener('click', (e) => {
    e.preventDefault();
    const id = card.id;
    const content = blogContent[id];

    if (content) {
      modalImage.src = content.image;
      modalTag.innerText = content.tag;
      modalDate.innerText = content.date;
      modalTitle.innerText = content.title;
      modalText.innerHTML = content.text;
      
      blogModal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scroll
    }
  });
});

modalClose?.addEventListener('click', () => {
  blogModal.classList.remove('active');
  document.body.style.overflow = 'auto';
});

// Close polar click outside content
blogModal?.addEventListener('click', (e) => {
  if (e.target === blogModal) {
    blogModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

console.log('GENBAI Landing Page Initialized');
