/* ============================================================
   main.js — Portfolio Interactivity
   ============================================================ */

// ── Particle Canvas ──────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles, animId;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.size = Math.random() * 1.8 + 0.4;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = -(Math.random() * 0.5 + 0.2);
      this.alpha = 0;
      this.maxAlpha = Math.random() * 0.55 + 0.1;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 200;
      this.color = Math.random() > 0.5 ? '#4f8ef7' : '#00d4ff';
    }
    update() {
      this.life++;
      this.x += this.speedX;
      this.y += this.speedY;
      const lifeRatio = this.life / this.maxLife;
      this.alpha = lifeRatio < 0.2
        ? lerp(0, this.maxAlpha, lifeRatio / 0.2)
        : lifeRatio > 0.75
          ? lerp(this.maxAlpha, 0, (lifeRatio - 0.75) / 0.25)
          : this.maxAlpha;
      if (this.life >= this.maxLife || this.y < -10) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((W * H) / 7000), 120);
    particles = Array.from({ length: count }, () => new Particle());
  }

  function drawConnections() {
    const MAX_DIST = 100;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / MAX_DIST) * 0.08;
          ctx.strokeStyle = '#4f8ef7';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    init();
    animate();
  });

  init();
  animate();
})();


// ── Typed Text ───────────────────────────────────────────────
(function initTyped() {
  const el = document.getElementById('typed-text');
  if (!el) return;
  const phrases = [
    'Full-Stack Engineer',
    'DevOps Enthusiast',
    'LeetCode Knight 🏅',
    'Open Source Builder',
    'Backend Architect',
  ];
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let pause = false;

  function tick() {
    const phrase = phrases[phraseIdx];
    if (pause) { setTimeout(tick, 1600); pause = false; return; }

    if (!deleting) {
      el.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) { deleting = true; pause = true; }
      setTimeout(tick, 80);
    } else {
      el.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
      setTimeout(tick, 42);
    }
  }

  setTimeout(tick, 1000);
})();


// ── Scroll-Reveal (IntersectionObserver) ─────────────────────
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // stagger children in the same parent
        const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
        const delay = siblings.indexOf(entry.target) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
})();


// ── Stat Counter Animation ────────────────────────────────────
(function initCounters() {
  const statNums = document.querySelectorAll('.stat-num[data-target]');
  if (!statNums.length) return;

  function animateTo(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateTo(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => obs.observe(el));
})();


// ── Navbar: Scroll Shrink + Active Section ───────────────────
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    // shrink
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    // active link
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 100;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


// ── Mobile Menu ──────────────────────────────────────────────
(function initHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('nav-links');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });

  // close on link click
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  // close on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();


// ── Smooth Hover Tilt on Project Cards ──────────────────────
(function initTilt() {
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();
