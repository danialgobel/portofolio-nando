/* ============================================================
   BENEATH THE SURFACE — main.js
   Scroll animations, loader, cursor, gallery, parallax
   ============================================================ */

'use strict';

// ── Utilities ───────────────────────────────────────────────
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp  = (a, b, t)   => a + (b - a) * t;

// Mobile check
const isMobile = () => window.innerWidth <= 768;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Set --vh for mobile ──────────────────────────────────────
function setVH() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setVH();
window.addEventListener('resize', setVH, { passive: true });

// ── Loader (Smooth Atmospheric Descent) ──────────────────────
(function initLoader() {
  if (prefersReducedMotion) {
    qs('#loader')?.classList.add('hidden');
    document.body.classList.add('loaded');
    revealHero();
    return;
  }

  const loader   = qs('#loader');
  const counter  = qs('#loader-counter');
  if (!loader || !counter) return;

  let current = 0;
  const target  = 40;
  const duration = 1400; // Calm, meditative descent
  const start    = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * target);
    counter.textContent = `${current}m`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Done — smoothly dissolve loader veil and choreograph hero entrance
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.add('loaded');
        revealHero();
      }, 200);
    }
  }

  requestAnimationFrame(tick);
})();

// ── Reveal hero elements (Choreographed Slow Bloom) ─────────
function revealHero() {
  document.body.classList.add('loaded');

  const nav = qs('#nav');
  if (nav) nav.classList.add('revealed');

  const hud = qs('#dive-hud');
  if (hud) hud.classList.add('visible');

  // Trigger hero title line animations
  qsa('.hero-title-line').forEach(el => el.classList.add('revealed'));
  
  // Eyebrow and sub
  const eyebrow = qs('.hero-eyebrow');
  const sub     = qs('.hero-sub');
  if (eyebrow) eyebrow.classList.add('visible');
  if (sub)     sub.classList.add('visible');

  // Scroll cue & depth indicators
  const depthInd = qs('.hero-depth-indicator');
  const scrollCue = qs('.hero-scroll-cue');
  if (depthInd)  depthInd.classList.add('visible');
  if (scrollCue) scrollCue.classList.add('visible');

  // Depth counter animation
  animateHeroDepth();

  // Hero image loaded class
  const heroImg = qs('#hero-img');
  if (heroImg) {
    heroImg.classList.add('loaded');
  }
}

// ── Depth counter ────────────────────────────────────────────
function animateHeroDepth() {
  const depthEl = qs('#hero-depth');
  if (!depthEl || prefersReducedMotion) {
    if (depthEl) depthEl.textContent = '12.5m';
    return;
  }

  let d = 0;
  const target = 12.5;
  const dur    = 2500;
  const start  = performance.now();

  function tick(now) {
    const t = clamp((now - start) / dur, 0, 1);
    const e = 1 - Math.pow(1 - t, 4);
    d = e * target;
    depthEl.textContent = d.toFixed(1) + 'm';
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── Cursor ───────────────────────────────────────────────────
(function initCursor() {
  const cursor   = qs('#cursor');
  const follower = qs('#cursor-follower');
  if (!cursor || !follower) return;
  if (window.matchMedia('(hover: none)').matches) return;

  let mx = -100, my = -100;
  let fx = -100, fy = -100;
  let rafId = null;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  }, { passive: true });

  function loop() {
    fx = lerp(fx, mx, 0.12);
    fy = lerp(fy, my, 0.12);
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  // Hover state
  const hoverTargets = 'a, button, .exp-card, .gallery-item, .nav-link, .mobile-link';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.remove('cursor-hover');
    }
  });
})();

// ── Navigation ───────────────────────────────────────────────
(function initNav() {
  const nav    = qs('#nav');
  const btn    = qs('#nav-menu-btn');
  const menu   = qs('#mobile-menu');
  const links  = qsa('.mobile-link');
  if (!nav) return;

  // Scroll state
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 60);
    lastScroll = y;
  }, { passive: true });

  // Mobile menu
  if (btn && menu) {
    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
})();

// ── Intersection Observer: General Reveals ───────────────────
function initScrollReveals() {
  // --- Reveal text / visibility (buttery smooth slow rise)
  const revealOpts = { threshold: 0.15, rootMargin: '0px 0px -5% 0px' };
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, revealOpts);

  qsa('.reveal-text, .hero-eyebrow, .hero-sub, .intro-quote-text, .intro-meta, .intro-number, .panel-tag, .panel-body, .fq-pre, .fq-caption, .silence-pre, .silence-body, .closing-pre, .closing-stmt-word, .closing-rule, .gallery-subtext, .expedition-statement, .expedition-sub').forEach(el => {
    revealObs.observe(el);
  });

  // --- Reveal lines (text lines animating up)
  const lineOpts  = { threshold: 0.1, rootMargin: '0px 0px -5% 0px' };
  const lineObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        lineObs.unobserve(entry.target);
      }
    });
  }, lineOpts);

  qsa('.reveal-line, .exp-line, .silence-line, .closing-line, .gallery-title, .fq-text, .panel-heading').forEach(el => {
    lineObs.observe(el);
  });

  // --- Expedition cards
  const cardObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        cardObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  qsa('.exp-card').forEach(el => cardObs.observe(el));

  // --- Fullscreen quote
  const fqObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pre     = entry.target.querySelector('.fq-pre');
        const text    = entry.target.querySelector('.fq-text');
        const caption = entry.target.querySelector('.fq-caption');
        if (pre)     pre.classList.add('visible');
        if (text)    text.classList.add('revealed');
        if (caption) caption.classList.add('visible');
        fqObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  const fq = qs('.fullscreen-quote');
  if (fq) fqObs.observe(fq);
}

// ── Word Reveal ──────────────────────────────────────────────
function initWordReveal() {
  qsa('.word-reveal').forEach(el => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.innerHTML = words.map(w =>
      `<span class="word"><span class="word-inner">${w}</span></span>`
    ).join(' ');

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('revealed');
        // Stagger each word
        qsa('.word-inner', el).forEach((inner, i) => {
          inner.style.transitionDelay = `${i * 0.06}s`;
        });
        obs.unobserve(el);
      }
    }, { threshold: 0.15 });
    obs.observe(el);
  });
}

// ── Dive Feature — Sticky Scroll Panel Switcher ──────────────
function initDiveFeature() {
  const panels = qsa('.dive-panel');
  const imgs   = qsa('.dive-img');
  if (!panels.length || !imgs.length) return;

  // Initialize first image as active
  imgs[0].classList.add('active');
  imgs[0].classList.remove('dive-img-hidden');

  let activeIndex = 0;

  function setActiveImage(index) {
    if (index === activeIndex || !imgs[index]) return;
    
    imgs[activeIndex].classList.remove('active');
    imgs[activeIndex].classList.add('dive-img-hidden');
    
    activeIndex = index;
    
    imgs[activeIndex].classList.remove('dive-img-hidden');
    imgs[activeIndex].classList.add('active');
  }

  const panelObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        const idx = parseInt(entry.target.dataset.image, 10) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < imgs.length) {
          setActiveImage(idx);
        }

        // Reveal panel content with smooth staggered timing
        const tag     = entry.target.querySelector('.panel-tag');
        const heading = entry.target.querySelector('.panel-heading');
        const body    = entry.target.querySelector('.panel-body');
        if (tag)     tag.classList.add('visible');
        if (heading) heading.classList.add('revealed');
        if (body)    body.classList.add('visible');
      }
    });
  }, { threshold: isMobile() ? 0.3 : 0.5 });

  panels.forEach(panel => panelObs.observe(panel));
}

// ── Gallery — Drag-to-Scroll ─────────────────────────────────
function initGallery() {
  const wrap  = qs('#gallery-track-wrap');
  const track = qs('#gallery-track');
  if (!wrap || !track) return;

  let isDown  = false;
  let startX  = 0;
  let scrollL = 0;
  let velocity = 0;
  let lastX   = 0;
  let lastT   = 0;
  let momentumId = null;

  function getX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onStart(e) {
    isDown  = true;
    startX  = getX(e) - track.offsetLeft;
    scrollL = wrap.scrollLeft;
    lastX   = getX(e);
    lastT   = Date.now();
    velocity = 0;
    wrap.classList.add('dragging');
    if (momentumId) cancelAnimationFrame(momentumId);
  }

  function onMove(e) {
    if (!isDown) return;
    e.preventDefault();
    const x    = getX(e);
    const walk = (x - (startX + track.offsetLeft)) * 1.5;
    wrap.scrollLeft = scrollL - walk;

    const now = Date.now();
    const dt  = now - lastT;
    if (dt > 0) {
      velocity = (x - lastX) / dt * 16;
    }
    lastX = x;
    lastT = now;
  }

  function onEnd() {
    if (!isDown) return;
    isDown = false;
    wrap.classList.remove('dragging');
    applyMomentum();
  }

  function applyMomentum() {
    if (Math.abs(velocity) < 0.5) return;
    wrap.scrollLeft -= velocity;
    velocity *= 0.93;
    momentumId = requestAnimationFrame(applyMomentum);
  }

  // Mouse
  wrap.addEventListener('mousedown',   onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup',   onEnd);

  // Touch
  wrap.addEventListener('touchstart', onStart, { passive: true });
  wrap.addEventListener('touchmove',  onMove,  { passive: false });
  wrap.addEventListener('touchend',   onEnd);

  // Prevent click after drag
  wrap.addEventListener('click', e => {
    if (Math.abs(velocity) > 2) e.preventDefault();
  });

  // Auto-scroll hint on desktop
  if (!isMobile() && !prefersReducedMotion) {
    let autoScroll = setInterval(() => {
      if (!isDown && wrap.scrollLeft < 80) {
        wrap.scrollLeft += 1;
      } else {
        clearInterval(autoScroll);
      }
    }, 20);
  }
}

// ── Parallax ─────────────────────────────────────────────────
function initParallax() {
  if (prefersReducedMotion || isMobile()) return;

  const heroImg = qs('#hero-img');
  const fqImg   = qs('.fq-img');
  const silImg  = qs('.silence-img');

  function onScroll() {
    const y = window.scrollY;

    if (heroImg) {
      const offset = y * 0.25;
      heroImg.style.transform = `scale(1.05) translateY(${offset}px)`;
    }

    if (fqImg) {
      const rect   = fqImg.closest('.fullscreen-quote').getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - window.innerHeight / 2) * 0.12;
      fqImg.style.transform = `scale(1.05) translateY(${offset}px)`;
    }

    if (silImg) {
      const rect   = silImg.closest('.silence-section').getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - window.innerHeight / 2) * 0.1;
      silImg.style.transform = `scale(1.05) translateY(${offset}px)`;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

// ── Scroll-driven depth indicator ────────────────────────────
function initScrollDepth() {
  const depthEl = qs('#hero-depth');
  if (!depthEl) return;

  // After hero animation, tie depth to scroll
  setTimeout(() => {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const heroH = qs('#hero')?.offsetHeight || window.innerHeight;
      const progress = clamp(y / heroH, 0, 1);
      const depth = 12.5 + progress * 25;
      depthEl.textContent = depth.toFixed(1) + 'm';
    }, { passive: true });
  }, 3000);
}

// ── Smooth anchor links ──────────────────────────────────────
function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = qs(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── Closing section — number-style depth on scroll ───────────
function initClosingParallax() {
  if (prefersReducedMotion) return;
  const closing = qs('.closing');
  const closingBg = qs('.closing-bg-img');
  if (!closing || !closingBg) return;

  window.addEventListener('scroll', () => {
    const rect = closing.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    const progress = 1 - (rect.bottom / (window.innerHeight + rect.height));
    const offset   = clamp(progress, 0, 1) * 60;
    closingBg.style.transform = `scale(1.1) translateY(${-offset}px)`;
  }, { passive: true });
}

// ── Hero text water distortion on scroll ─────────────────────
function initHeroDistortion() {
  if (prefersReducedMotion || isMobile()) return;

  const heroTitle = qs('.hero-title');
  if (!heroTitle) return;

  window.addEventListener('scroll', () => {
    const y = clamp(window.scrollY / window.innerHeight, 0, 1);
    const blur = y * 8;
    heroTitle.style.filter = `blur(${blur}px)`;
    heroTitle.style.opacity = String(1 - y * 1.2);
  }, { passive: true });
}

// ── Gallery items — stagger reveal ───────────────────────────
function initGalleryReveal() {
  const items = qsa('.gallery-item');
  if (!items.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 60);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  items.forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(24px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    obs.observe(item);
  });
}

// ── FQ words stagger reveal ──────────────────────────────────
function initFQReveal() {
  const fqWords = qsa('.fq-word');
  if (!fqWords.length) return;

  fqWords.forEach((word, i) => {
    word.style.transform   = 'translateY(40px)';
    word.style.opacity     = '0';
    word.style.transition  = `opacity 0.7s ease ${i * 0.12}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`;
    word.style.display     = 'inline-block';
  });

  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      fqWords.forEach(word => {
        word.style.opacity   = '1';
        word.style.transform = 'translateY(0)';
      });
      obs.unobserve(entry.target);
    }
  }, { threshold: 0.2 });

  const fqText = qs('.fq-text');
  if (fqText) obs.observe(fqText);
}

// ── Image lazy load ──────────────────────────────────────────
function initLazyImages() {
  if ('IntersectionObserver' in window) {
    const imgObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObs.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });

    qsa('img[data-src]').forEach(img => imgObs.observe(img));
  }
}

// ── Keyboard navigation ──────────────────────────────────────
function initA11y() {
  // Allow cards to be activated by keyboard
  qsa('.exp-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        card.click();
      }
    });
  });

  // Focus-visible polyfill helper
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

// ── Closing section wave text ────────────────────────────────
function initClosingAnimation() {
  const andLine    = qs('.closing-and');
  const neverLine  = qs('.closing-never');
  const forgetLine = qs('.closing-forget');
  
  if (!andLine) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // The reveal-line CSS handles the animation
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  qsa('.closing-main .closing-line').forEach(l => obs.observe(l));
}

// ── Nav active section highlight ─────────────────────────────
function initNavHighlight() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${id}`;
          link.style.color = active ? 'var(--white)' : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
}

// ── Stats / metadata reveal ──────────────────────────────────
function initCounterReveal() {
  // Animate any numerical values found in the DOM
  const counters = qsa('[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur    = 1500;
        const start  = performance.now();
        const from   = 0;

        function tick(now) {
          const t = clamp((now - start) / dur, 0, 1);
          const e = 1 - Math.pow(1 - t, 3);
          el.textContent = (from + e * (target - from)).toFixed(0) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => obs.observe(el));
}

// ── Image tilt on hover (desktop only) ──────────────────────
function initTiltEffect() {
  if (prefersReducedMotion || isMobile()) return;

  qsa('.exp-card').forEach(card => {
    const img = card.querySelector('.exp-card-img');
    if (!img) return;

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
      card.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ── Footer depth display ─────────────────────────────────────
function initFooterDepth() {
  const footerCoords = qs('.footer-coords');
  if (!footerCoords) return;

  // Animate coordinates when footer enters view
  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      const targets = [
        { el: footerCoords, text: '2°30\'S · 118°45\'E', delay: 0 },
        { el: qs('.footer-depth'), text: '∞ fathoms deep', delay: 200 }
      ];

      targets.forEach(({ el, text, delay }) => {
        if (!el) return;
        setTimeout(() => {
          el.textContent = text;
          el.style.transition = 'color 0.4s ease';
          el.style.color = 'var(--aqua)';
          setTimeout(() => { el.style.color = ''; }, 600);
        }, delay);
      });

      obs.unobserve(entry.target);
    }
  }, { threshold: 0.8 });

  const footer = qs('.footer');
  if (footer) obs.observe(footer);
}

// ── Page leave transition ─────────────────────────────────────
function initPageTransitions() {
  // Subtle opacity fade on internal nav clicks
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      // Already handled by smooth scroll
    });
  });
}

// ── FPS-aware scroll ─────────────────────────────────────────
let scrollTicking = false;
function onScrollFrame() {
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(onScrollFrame);
    scrollTicking = true;
  }
}, { passive: true });

// ── Background Ocean Particles Canvas ────────────────────────
function initOceanCanvas() {
  const canvas = qs('#ocean-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const count = isMobile() ? 28 : 55;
  const particles = [];

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.radius = Math.random() * 2.2 + 0.6;
      this.speedY = Math.random() * 0.45 + 0.18;
      this.speedX = (Math.random() - 0.5) * 0.25;
      this.wobbleSpeed = Math.random() * 0.02 + 0.01;
      this.wobbleAngle = Math.random() * Math.PI * 2;
      this.wobbleRadius = Math.random() * 1.5;
      this.alpha = Math.random() * 0.35 + 0.12;
      this.isBubble = Math.random() > 0.45;
    }

    update() {
      this.y -= this.speedY;
      this.wobbleAngle += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobbleAngle) * (this.wobbleRadius * 0.05);

      if (this.y < -15 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      if (this.isBubble) {
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 230, 240, ${this.alpha * 0.8})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 248, 255, ${this.alpha * 0.6})`;
        ctx.fill();
      } else {
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 184, 212, ${this.alpha})`;
        ctx.shadowColor = 'rgba(94, 184, 212, 0.5)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  let animId = null;
  let isRunning = true;

  function render() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    animId = requestAnimationFrame(render);
  }

  if (!prefersReducedMotion) {
    animId = requestAnimationFrame(render);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
    } else if (!prefersReducedMotion) {
      isRunning = true;
      animId = requestAnimationFrame(render);
    }
  });
}

// ── Web Audio API: Ambient Underwater Hydrophone Sound ───────
function initAmbientSound() {
  const btn = qs('#sound-toggle');
  const label = qs('#sound-label');
  if (!btn) return;

  let audioCtx = null;
  let isPlaying = false;
  let masterGain = null;
  let noiseNode = null;
  let filter1 = null;
  let filter2 = null;

  function buildAudioGraph() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    filter1 = audioCtx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 95;
    filter1.Q.value = 3.2;

    filter2 = audioCtx.createBiquadFilter();
    filter2.type = 'peaking';
    filter2.frequency.value = 65;
    filter2.gain.value = 6.0;
    filter2.Q.value = 1.8;

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

    noiseNode.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    noiseNode.start();
  }

  function toggleSound() {
    if (!audioCtx) {
      buildAudioGraph();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isPlaying) {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 1.2);
      isPlaying = true;
      btn.classList.add('playing');
      if (label) label.textContent = 'AUDIO ON';
    } else {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      isPlaying = false;
      btn.classList.remove('playing');
      if (label) label.textContent = 'AUDIO OFF';
    }
  }

  btn.addEventListener('click', toggleSound);
}

// ── Dynamic Dive HUD & Zone Tracker ──────────────────────────
function initDiveHUD() {
  const hud = qs('#dive-hud');
  const hudDepth = qs('#hud-depth');
  const hudZone = qs('#hud-zone');
  if (!hud || !hudDepth || !hudZone) return;

  function updateHUD() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = clamp(scrollY / Math.max(maxScroll, 1), 0, 1);

    const depth = progress * 48.5;
    hudDepth.textContent = depth.toFixed(1) + 'm';

    if (depth < 16.0) {
      hudZone.textContent = 'SUNLIGHT ZONE';
      hudZone.style.color = 'var(--cyan-bright)';
    } else if (depth < 36.0) {
      hudZone.textContent = 'TWILIGHT ZONE';
      hudZone.style.color = 'var(--aqua)';
    } else {
      hudZone.textContent = 'MIDNIGHT DEEP';
      hudZone.style.color = '#89c4d9';
    }

    if (scrollY > 250) {
      hud.classList.add('visible');
    } else {
      hud.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', updateHUD, { passive: true });
  updateHUD();
}

// ── Lightbox Photo & Log Inspector ───────────────────────────
function initLightbox() {
  const lightbox = qs('#lightbox');
  const imgEl    = qs('#lightbox-img');
  const titleEl  = qs('#lightbox-title');
  const depthEl  = qs('#lightbox-depth');
  const locEl    = qs('#lightbox-location');
  const gearEl   = qs('#lightbox-gear');
  const counter  = qs('#lightbox-counter');
  const closeBtn = qs('#lightbox-close');
  const prevBtn  = qs('#lightbox-prev');
  const nextBtn  = qs('#lightbox-next');
  const backdrop = qs('#lightbox-backdrop');

  if (!lightbox || !imgEl) return;

  const items = qsa('[data-lightbox="true"]');
  if (!items.length) return;

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const item = items[currentIndex];
    if (!item) return;

    const img = item.querySelector('img');
    if (!img) return;

    imgEl.src = img.src;
    imgEl.alt = img.alt || '';

    const title = item.dataset.title || item.querySelector('figcaption span, .exp-card-title')?.textContent || 'Ocean Archive';
    const depth = item.dataset.depth || '20.0m';
    const location = item.dataset.location || 'Indonesian Archipelago';
    const gear = item.dataset.gear || 'High-Res Optical Sensor';

    if (titleEl) titleEl.textContent = title;
    if (depthEl) depthEl.textContent = depth;
    if (locEl)   locEl.textContent = location;
    if (gearEl)  gearEl.textContent = gear;
    if (counter) counter.textContent = `${currentIndex + 1} / ${items.length}`;

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function nextPhoto() {
    openLightbox((currentIndex + 1) % items.length);
  }

  function prevPhoto() {
    openLightbox((currentIndex - 1 + items.length) % items.length);
  }

  items.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      openLightbox(idx);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);
  if (nextBtn)  nextBtn.addEventListener('click', nextPhoto);
  if (prevBtn)  prevBtn.addEventListener('click', prevPhoto);

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
  });
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveals();
  initWordReveal();
  initDiveFeature();
  initGallery();
  initGalleryReveal();
  initParallax();
  initScrollDepth();
  initSmoothScroll();
  initClosingParallax();
  initHeroDistortion();
  initFQReveal();
  initLazyImages();
  initA11y();
  initClosingAnimation();
  initNavHighlight();
  initCounterReveal();
  initTiltEffect();
  initFooterDepth();
  initPageTransitions();
  initOceanCanvas();
  initAmbientSound();
  initDiveHUD();
  initLightbox();

  // If loader was skipped (reduced motion), reveal hero immediately
  if (prefersReducedMotion) {
    revealHero();
  }

  console.log(
    '%c BENEATH THE SURFACE %c\n\n' +
    'Every dive reveals a story the ocean has been keeping.',
    'background: #040c14; color: #5eb8d4; font-size: 16px; font-weight: bold; padding: 8px 12px;',
    'color: #7a9fb5; font-size: 12px;'
  );
});

// ── Handle page visibility changes ────────────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause any heavy animations
  }
});

// ── Window resize debounce ────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    setVH();
  }, 150);
}, { passive: true });
