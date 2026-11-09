(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

  /* clock */
  const clk = $('#clock');
  const tick = () => { try { clk.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }); } catch { clk.textContent = new Date().toTimeString().slice(0,5); } };
  tick(); setInterval(tick, 10000);
  $('#yr').textContent = new Date().getFullYear();

  /* split hero letters */
  let n = 0;
  $$('[data-split]').forEach(el => {
    const t = el.textContent; el.textContent = '';
    for (const c of t) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--d', (n++ * 0.05) + 's'); s.setAttribute('aria-hidden', 'true'); el.appendChild(s); }
  });
  const chars = $$('.name .ch');

  /* split about words */
  const lit = $('#lit');
  lit.innerHTML = lit.textContent.trim().split(/\s+/).map(w => w.startsWith('*') ? `<span class="w acc">${w.slice(1)}</span>` : `<span class="w">${w}</span>`).join(' ');
  const words = $$('#lit .w');
  const apin = $('#about .pin');
  function fitAbout() {
    lit.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(lit).fontSize), guard = 0;
    while (apin.scrollHeight > apin.clientHeight + 1 && fs > 13 && guard++ < 60) { fs -= 1; lit.style.fontSize = fs + 'px'; }
  }
  fitAbout(); addEventListener('resize', fitAbout); document.fonts && document.fonts.ready.then(fitAbout);

  /* loader */
  const loader = $('#loader'), cnt = $('#loader .count');
  function finishLoad() {
    document.body.classList.add('loaded');
    setTimeout(() => $$('.fade[data-delay]').forEach(e => e.classList.add('in')), 1200);
  }
  if (reduce) { finishLoad(); }
  else {
    const t0 = performance.now(), D = 1300;
    (function step(t) {
      const p = clamp((t - t0) / D, 0, 1);
      cnt.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      if (p < 1) requestAnimationFrame(step); else setTimeout(finishLoad, 150);
    })(t0);
  }

  /* reveal */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('.rl, .fade:not([data-delay]), .shead h2').forEach(el => io.observe(el));
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { $$('.prow').forEach(r => r.classList.add('in')); o.disconnect(); } }), { threshold: .1 }).observe($('.plist'));
  $$('.prow').forEach((r, i) => r.style.transitionDelay = (i * 0.08) + 's');

  /* counter */
  const counter = $('[data-count]');
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return; o.disconnect();
    const target = +counter.dataset.count, t0 = performance.now();
    (function s(t) { const p = clamp((t - t0) / 1400, 0, 1); counter.textContent = Math.round(p * target); if (p < 1) requestAnimationFrame(s); })(t0);
  }), { threshold: .5 }).observe(counter);

  /* mouse */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 }, cpos = { x: mouse.x, y: mouse.y };
  const cursor = $('.cursor');
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  /* hero letters: weight follows cursor */
  function heroWeights() {
    chars.forEach(c => {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(mouse.x - (r.left + r.width / 2), mouse.y - (r.top + r.height / 2));
      const k = clamp(1 - d / 320, 0, 1);
      c.style.setProperty('--w', Math.round(300 + 600 * k * k));
      c.classList.toggle('hot', k > .72);
    });
  }
  if (fine && !reduce) $('#hero').addEventListener('pointermove', heroWeights);

  /* cursor states */
  $$('a, button, .bub').forEach(el => {
    el.addEventListener('pointerenter', () => cursor.classList.add('big'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('big', 'text'));
  });
  $$('.prow').forEach(el => el.addEventListener('pointerenter', () => cursor.classList.add('text')));

  /* magnetic */
  if (fine) $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .35}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });

  /* project preview */
  const prev = $('#preview'), slides = $('#preview .slides'), ppos = { x: mouse.x, y: mouse.y };
  $$('.prow').forEach(row => {
    row.addEventListener('pointerenter', () => { slides.style.transform = `translateY(${-240 * +row.dataset.i}px)`; prev.classList.add('show'); });
    row.addEventListener('pointerleave', () => prev.classList.remove('show'));
  });

  /* copy */
  const toast = $('.toast');
  $('#copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('alexgomezizquierdo@gmail.com'); toast.textContent = 'Email copiado ✓'; }
    catch { toast.textContent = 'alexgomezizquierdo@gmail.com'; }
    toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400);
  });

  /* ---------- skills physics playground ---------- */
  const pg = $('#playground');
  const skills = ['Java','Python','JavaScript','PHP','SQL','PL/SQL','HTML','CSS','React','Angular','Bootstrap','Oracle','MariaDB','Git','GitHub','Docker','Eclipse','VS Code','DBeaver','Claude Code','Codex'];
  const bodies = [];
  let W = 0, H = 0, pgActive = false, pgStarted = false, drag = null;
  skills.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'bub' + (i % 7 === 2 ? ' acc' : i % 4 === 1 ? ' dark' : '');
    el.textContent = s; pg.appendChild(el);
    bodies.push({ el, s, x: 0, y: 0, vx: 0, vy: 0, r: 40, a: 0 });
  });
  function sizePG() {
    W = pg.clientWidth; H = pg.clientHeight;
    const sc = clamp(W / 1100, .58, 1);
    bodies.forEach(b => {
      b.r = Math.round((34 + b.s.length * 3.4) * sc);
      b.el.style.width = b.el.style.height = b.r * 2 + 'px';
      b.el.style.fontSize = Math.max(12, Math.round(b.r * .34)) + 'px';
      b.m = b.r * b.r;
    });
  }
  function dropAll() {
    bodies.forEach((b, i) => { b.x = b.r + Math.random() * (W - 2 * b.r); b.y = -b.r - i * 45 - Math.random() * 60; b.vx = (Math.random() - .5) * 4; b.vy = 0; });
  }
  if (reduce) pg.classList.add('static');
  else {
    sizePG(); dropAll();
    new IntersectionObserver(es => es.forEach(e => { pgActive = e.isIntersecting; if (pgActive) pgStarted = true; }), { threshold: .2 }).observe(pg);
    bodies.forEach(b => {
      b.el.addEventListener('pointerdown', e => {
        e.preventDefault(); drag = b; b.el.classList.add('grabbing'); b.el.setPointerCapture(e.pointerId);
        const r = pg.getBoundingClientRect(); b.px = e.clientX - r.left; b.py = e.clientY - r.top; b.ox = b.x - b.px; b.oy = b.y - b.py;
      });
      b.el.addEventListener('pointermove', e => {
        if (drag !== b) return; const r = pg.getBoundingClientRect();
        b.px = e.clientX - r.left; b.py = e.clientY - r.top;
      });
      const up = () => { if (drag === b) { drag = null; b.el.classList.remove('grabbing'); } };
      b.el.addEventListener('pointerup', up); b.el.addEventListener('pointercancel', up);
    });
    $('#shake').addEventListener('click', () => { pgStarted = true; bodies.forEach(b => { b.vx += (Math.random() - .5) * 26; b.vy -= 10 + Math.random() * 16; }); });
  }
  let pgMouse = null;
  pg.addEventListener('pointermove', e => { const r = pg.getBoundingClientRect(); pgMouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  pg.addEventListener('pointerleave', () => pgMouse = null);

  function physics() {
    const g = .55, e = .45;
    for (const b of bodies) {
      if (b === drag) {
        const nx = b.px + b.ox, ny = b.py + b.oy;
        b.vx = (nx - b.x); b.vy = (ny - b.y); b.x = nx; b.y = ny;
      } else {
        b.vy += g; b.vx *= .995; b.vy *= .995; b.x += b.vx; b.y += b.vy;
      }
    }
    for (let it = 0; it < 4; it++) {
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const A = bodies[i], B = bodies[j];
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || .01, min = A.r + B.r;
        if (d >= min) continue;
        const nx = dx / d, ny = dy / d, ov = min - d;
        const ia = A === drag ? 0 : 1 / A.m, ib = B === drag ? 0 : 1 / B.m, s = ia + ib || 1;
        A.x -= nx * ov * ia / s; A.y -= ny * ov * ia / s; B.x += nx * ov * ib / s; B.y += ny * ov * ib / s;
        const vr = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (vr < 0 && it === 0) { const jimp = -(1 + e) * vr / s; A.vx -= jimp * ia * nx; A.vy -= jimp * ia * ny; B.vx += jimp * ib * nx; B.vy += jimp * ib * ny; }
      }
      for (const b of bodies) {
        if (b.y + b.r > H) { b.y = H - b.r; if (b.vy > 0) b.vy *= -e; b.vx *= .985; }
        if (b.x - b.r < 0) { b.x = b.r; if (b.vx < 0) b.vx *= -e; }
        if (b.x + b.r > W) { b.x = W - b.r; if (b.vx > 0) b.vx *= -e; }
        if (b.y - b.r < 0 && b.vy < 0 && b.y > 0) { b.y = b.r; b.vy *= -e; }
      }
    }
    if (pgMouse && !drag) for (const b of bodies) {
      const dx = b.x - pgMouse.x, dy = b.y - pgMouse.y, d = Math.hypot(dx, dy) || 1, R = b.r + 46;
      if (d < R) { const f = (R - d) / R * 2.2; b.vx += dx / d * f; b.vy += dy / d * f; }
    }
    for (const b of bodies) {
      b.a += b.vx / b.r;
      b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${b.a}rad)`;
    }
  }

  /* ---------- scroll-driven ---------- */
  const prog = $('#progress');
  const l1 = $('.name .line:nth-child(1)'), l2 = $('.name .line:nth-child(2)'), heroTop = $('.hero-top');
  const about = $('#about');
  const rows = $$('.mrow'); rows.forEach(r => r.innerHTML += r.innerHTML); const mstate = rows.map(() => ({ x: 0 }));
  const cards = $$('.card');
  const edu = $('#edu .hwrap'), htrack = $('.htrack'), hbar = $('#hbar'), panels = $$('.panel'), yrs = $$('.panel .yr');
  const contact = $('#contact'), dark = $('#dark');
  const gsec = $('#galeon'), glet = $$('.gword span'), gword = $('.gword'), glead = $('.glead'), gli = $$('.gsvc li'), glinks = $('.glinks');
  let lastY = scrollY, vel = 0;

  function sizeH() { const dist = Math.max(0, htrack.scrollWidth - innerWidth + 40); edu.style.height = (innerHeight + dist) + 'px'; }
  sizeH();
  addEventListener('resize', () => { sizeH(); if (!reduce) { const oW = W; sizePG(); if (Math.abs(oW - W) > 50) dropAll(); } });
  document.fonts && document.fonts.ready.then(sizeH);

  function frame() {
    const y = scrollY, vh = innerHeight;
    vel = lerp(vel, y - lastY, .15); lastY = y;
    const max = document.documentElement.scrollHeight - vh;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // cursor + preview follow
    cpos.x = lerp(cpos.x, mouse.x, .25); cpos.y = lerp(cpos.y, mouse.y, .25);
    cursor.style.left = cpos.x + 'px'; cursor.style.top = cpos.y + 'px';
    ppos.x = lerp(ppos.x, mouse.x, .12); ppos.y = lerp(ppos.y, mouse.y, .12);
    prev.style.left = ppos.x + 'px'; prev.style.top = ppos.y + 'px';
    const tilt = clamp((mouse.x - ppos.x) * .08, -10, 10);
    prev.style.rotate = tilt + 'deg';

    if (!reduce) {
      // hero split
      const hp = clamp(y / vh, 0, 1);
      l1.style.transform = `translateX(${-hp * 22}vw)`;
      l2.style.transform = `translateX(${hp * 22}vw)`;
      heroTop.style.opacity = 1 - hp * 1.6;

      // about words
      const ar = about.getBoundingClientRect();
      const ap = clamp(-ar.top / (about.offsetHeight - vh), 0, 1);
      const on = Math.floor(ap * 1.15 * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < on));

      // marquee with velocity
      rows.forEach((r, i) => {
        const dir = +r.dataset.dir, half = r.scrollWidth / 2;
        mstate[i].x += dir * (1 + Math.abs(vel) * .35) * (vel < 0 ? -1 : 1);
        if (half > 0) { mstate[i].x = ((mstate[i].x % half) + half) % half; }
        r.style.transform = `translateX(${-mstate[i].x}px) skewX(${clamp(-vel * .4, -14, 14)}deg)`;
      });

      // galeon reveal
      const gr = gsec.getBoundingClientRect();
      const gp = clamp(-gr.top / (gsec.offsetHeight - vh), 0, 1);
      const ein = clamp((vh - gr.top) / vh, 0, 1);
      glet.forEach((l, i) => {
        const lp = clamp((ein * 1.4 - .3 - i * .07) / .35, 0, 1);
        l.style.transform = `translateY(${(1 - lp) * 90}%) rotate(${(1 - lp) * 10}deg)`;
        l.style.opacity = lp;
      });
      gword.style.transform = `scale(${1 - .08 * gp})`;
      gword.style.transformOrigin = '50% 100%';
      glead.style.opacity = clamp((gp - .05) / .15, 0, 1);
      glead.style.transform = `translateY(${(1 - clamp((gp - .05) / .15, 0, 1)) * 30}px)`;
      gli.forEach((li, i) => {
        const v = clamp((gp - .15 - i * .08) / .14, 0, 1);
        li.style.opacity = v; li.style.transform = `translateX(${(1 - v) * 50}px)`;
      });
      const lv = clamp((gp - .5) / .12, 0, 1);
      glinks.style.opacity = lv; glinks.style.transform = `translateY(${(1 - lv) * 20}px)`;

      // stacking cards
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        let q = 0;
        if (next) { const top = c.getBoundingClientRect().top; q = clamp((vh - next.getBoundingClientRect().top) / (vh - top), 0, 1); }
        c.style.transform = `scale(${1 - q * .07})`;
        c.querySelector('.shade').style.opacity = q * .35;
      });

      // horizontal education
      const er = edu.getBoundingClientRect(), total = edu.offsetHeight - vh;
      const ep = total > 0 ? clamp(-er.top / total, 0, 1) : 0;
      const dist = Math.max(0, htrack.scrollWidth - innerWidth + 40);
      htrack.style.transform = `translateX(${-ep * dist}px)`;
      hbar.style.transform = `scaleX(${ep})`;
      panels.forEach(p => {
        const r = p.getBoundingClientRect();
        p.classList.toggle('on', r.left < innerWidth * .55 && r.right > innerWidth * .45);
      });

      // contact circle reveal
      const cr = contact.getBoundingClientRect();
      const cp = clamp(-cr.top / (contact.offsetHeight - vh) / .75, 0, 1);
      dark.style.clipPath = `circle(${Math.pow(cp, 1.4) * 150}% at 50% 60%)`;
    } else {
      dark.style.clipPath = 'none';
    }

    if (!reduce && pgStarted && (pgActive || drag)) physics();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
