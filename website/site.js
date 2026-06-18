// ─── Heaven ────────────────────────────────────────────────────────

;(function initHeaven() {
  history.scrollRestoration = 'manual';
  const heaven = document.getElementById('heaven');
  if (!heaven) return;
  const h = heaven.offsetHeight;
  window.scrollTo({ top: h, behavior: 'instant' });

  let heavenLocked = false;
  let snapping = false;

  // Primary defense: scroll event watches position after any scroll lands.
  // If locked and we're in heaven, snap back instantly.
  // The snapping flag breaks the feedback loop from our own scrollTo call.
  window.addEventListener('scroll', () => {
    if (snapping) { snapping = false; return; }
    if (!heavenLocked && window.scrollY > h) { heavenLocked = true; return; }
    if (heavenLocked && window.scrollY < h) {
      snapping = true;
      window.scrollTo({ top: h, behavior: 'instant' });
    }
  }, { passive: true });

  // Secondary: block downward scroll while already in heaven
  window.addEventListener('wheel', (e) => {
    if (window.scrollY < h && e.deltaY > 0) e.preventDefault();
  }, { passive: false });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (window.scrollY < h && touchStartY - e.touches[0].clientY > 0) e.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (window.scrollY < h && ['ArrowDown','PageDown','End'].includes(e.key)) e.preventDefault();
  });

  heaven.addEventListener('click', () => {
    window.scrollTo({ top: h, behavior: 'smooth' });
  });
})();

// ─── Scroll reveal ─────────────────────────────────────────────────

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  initReveal();
}

function initReveal() {
  const DIRS = ['left', 'right', 'up', 'down', 'far-left', 'far-right', 'far-down'];

  const T = {
    'left':      'translateX(-80px)',
    'right':     'translateX(80px)',
    'up':        'translateY(52px)',
    'down':      'translateY(-60px)',
    'far-left':  'translateX(-180px) rotate(-2deg)',
    'far-right': 'translateX(180px) rotate(2deg)',
    'far-down':  'translateY(-120px) rotate(1.5deg)',
  };
  const D = {
    'left': '0.8s', 'right': '0.8s', 'up': '0.75s', 'down': '0.75s',
    'far-left': '1.1s', 'far-right': '1.1s', 'far-down': '1s',
  };
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  let seed = 42;
  function rand() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }
  function pick() {
    return DIRS[Math.floor(rand() * DIRS.length)];
  }

  const selectors = [
    '.strip span',
    '.section-label',
    '.section h2',
    '.section-thunderdome h2',
    '.section-body',
    '.why-item',
    '.phase',
    '.skill-group',
    '.mcp-item',
    '.example',
    '.terminal',
    '.install-note',
  ];

  const store = new WeakMap();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      const saved = store.get(el);
      if (!saved) continue;
      if (entry.isIntersecting) {
        el.style.zIndex = '';
        el.style.transition = saved.reveal;
        el.style.opacity = '1';
        el.style.transform = 'none';
      } else if (entry.boundingClientRect.top > 0) {
        const outDir = pick();
        el.style.position = 'relative';
        el.style.zIndex = '200';
        el.style.transition = `opacity 0.3s ease, transform 0.35s ${EASE}`;
        el.style.opacity = '0';
        el.style.transform = T[outDir];
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -25% 0px' });

  const seen = new WeakSet();

  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (seen.has(el)) return;
      seen.add(el);
      const dir = pick();
      const delay = Math.min(i, 3) * 80;
      const reveal = `opacity ${D[dir]} ease ${delay}ms, transform ${D[dir]} ${EASE} ${delay}ms`;
      el.style.opacity = '0';
      el.style.transform = T[dir];
      el.style.transition = reveal;
      el.style.willChange = 'transform, opacity';
      store.set(el, { transform: T[dir], reveal });
      observer.observe(el);
    });
  }
}

// ─── Easter eggs ───────────────────────────────────────────────────

// 2. "judgment" word in Thunderdome reveals CSO note
;(function() {
  const t = document.getElementById('judgment-trigger');
  const r = document.getElementById('judgment-reveal');
  if (t && r) t.addEventListener('click', () => r.classList.toggle('visible'));
})();

// 3. ? after abyss thunderdome reveals project status
;(function() {
  const t = document.getElementById('thunderdome-hint-trigger');
  const r = document.getElementById('thunderdome-hint-reveal');
  if (t && r) t.addEventListener('click', () => r.classList.toggle('visible'));
})();

// 4. MIT in footer
;(function() {
  const t = document.getElementById('mit-trigger');
  const r = document.getElementById('mit-reveal');
  if (t && r) t.addEventListener('click', () => r.classList.toggle('visible'));
})();

// 5. Konami code → depress overlay for 3 seconds
;(function() {
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  document.addEventListener('keydown', (e) => {
    idx = e.key === SEQ[idx] ? idx + 1 : (e.key === SEQ[0] ? 1 : 0);
    if (idx === SEQ.length) {
      idx = 0;
      const overlay = document.getElementById('depress-overlay');
      if (!overlay || overlay.classList.contains('active')) return;
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), 10000);
    }
  });
})();
