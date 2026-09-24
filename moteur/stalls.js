// Labo Eraser — échoppes de marché en relief (hors application).
(function (root) {
  'use strict';
  const { C, TAU, rng, createLayers, render, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { P, circle, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, rivet, gem, leaf, skull } = root.Helpers;

  const rectPath = (x, y, w, h) => (ctx) => { ctx.beginPath(); ctx.rect(x, y, w, h); };

  /* ---------- bois ---------- */
  // Planches (verticales 'v' ou horizontales 'h') : veinage, nœuds, rainures, clous.
  function planks(L, x, y, w, h, dir, count, o = {}) {
    const F = getFields();
    const base = hex(o.albedo || '#6b4a2e');
    const r = rng(o.seed ?? 3);
    const tones = Array.from({ length: count }, () => 0.78 + r() * 0.4);
    const knots = Array.from({ length: Math.round(count * (o.knots ?? 0.6)) }, () => [x + r() * w, y + r() * h, 3 + r() * 4]);
    L.paint(o.mask || rectPath(x, y, w, h), (px2, py2, px) => {
      const u = dir === 'v' ? (px2 - x) / w : (py2 - y) / h;
      const k = Math.max(0, Math.min(count - 1, Math.floor(u * count)));
      const fu = u * count - k;
      const edge = Math.min(fu, 1 - fu) * (dir === 'v' ? w : h) / count;
      const groove = smooth(0.2, 2.4, edge);
      const across = dir === 'v' ? px2 : py2, along = dir === 'v' ? py2 : px2;
      let warp = 0; for (const [kx, ky, kr] of knots) { const d = Math.hypot(px2 - kx, py2 - ky); if (d < kr * 5) warp += (kr * 5 - d) / (kr * 5) * Math.sin(d * 1.3) * 0.6; }
      const grain = sample(F.mid, (dir === 'v' ? across * 3.2 : along * 0.22) + k * 37 + warp * 6, (dir === 'v' ? along * 0.22 : across * 3.2) + k * 11);
      const fine = sample(F.high, dir === 'v' ? across * 2.4 : along * 0.35, dir === 'v' ? along * 0.35 : across * 2.4);
      let tone = tones[k] * (0.74 + 0.4 * grain) * (0.88 + 0.22 * fine);
      for (const [kx, ky, kr] of knots) { const d = Math.hypot((px2 - kx) * (dir === 'v' ? 1.4 : 0.8), (py2 - ky) * (dir === 'v' ? 0.8 : 1.4)); if (d < kr) tone *= 0.55 + 0.25 * Math.sin(d * 2.2); }
      const dirt = smooth(0.55, 0.8, sample(F.low, px2 * 2, py2 * 2)) * 0.3;
      tone *= 1 - dirt;
      px.rgb = [base[0] * tone, base[1] * tone, base[2] * tone];
      px.h = (o.base ?? 0.4) + (o.lift ?? 0.1) * groove + (grain - 0.5) * 0.025; px.hMode = o.hMode || 'set';
      px.kind = 'wood'; px.metal = 0; px.rough = 0.72;
    });
    if (o.nails) for (let k = 0; k < count; k += 1) for (const t of o.nails) {
      const nx = dir === 'v' ? x + (k + 0.5) * w / count : x + t * w, ny = dir === 'v' ? y + t * h : y + (k + 0.5) * h / count;
      rivet(L, nx, ny, 2, { base: (o.base ?? 0.4) + 0.08, peak: (o.base ?? 0.4) + 0.2, albedo: '#3a3430' });
    }
  }
  // Poteau : poutre équarrie, face avant arrondie, flanc sombre.
  function beam(L, x, y, w, h, o = {}) {
    const F = getFields();
    const base = hex(o.albedo || '#5a3d25');
    L.paint(rectPath(x, y, w, h), (px2, py2, px) => {
      const u = (px2 - x) / w;
      const prof = Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
      const grain = sample(F.mid, px2 * 3 + (o.seed ?? 0) * 17, py2 * 0.2);
      const crack = 1 - smooth(0.004, 0.02, Math.abs(sample(F.mid, px2 * 1.5 + 50, py2 * 0.08) - 0.5));
      const tone = (0.72 + 0.45 * grain) * (1 - crack * 0.6);
      px.rgb = [base[0] * tone, base[1] * tone, base[2] * tone];
      px.h = (o.base ?? 0.5) + (o.lift ?? 0.2) * prof - crack * 0.04; px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.7;
    });
    if (o.side) L.fill(rectPath(o.side > 0 ? x + w : x - 6, y, 6, h), { albedo: '#24180e', height: (o.base ?? 0.5) - 0.06, kind: 'wood', rough: 0.8, op: 'source-over' });
  }
  function ironBand(L, x, y, w, h, o = {}) {
    L.fill(rectPath(x, y, w, h), { albedo: '#3a3431', height: linearStyle(x, y, x, y + h, [[0, (o.base ?? 0.62)], [0.5, (o.base ?? 0.62) + 0.08], [1, (o.base ?? 0.62)]]), kind: 'iron', metal: 0.85, rough: 0.55, op: 'source-over' });
    for (const t of o.rivets || [0.1, 0.9]) rivet(L, x + t * w, y + h / 2, Math.min(3, h * 0.3), { base: (o.base ?? 0.62) + 0.06, peak: (o.base ?? 0.62) + 0.18 });
  }

  /* ---------- toitures ---------- */
  // Auvent de toile en trapèze : bandes teintes, affaissement entre les baleines, taches.
  function awning(L, top, bottom, xl0, xr0, xl1, xr1, stripes, colors, o = {}) {
    const F = getFields();
    const cols = colors.map(hex);
    const holes = o.holes ? Array.from({ length: o.holes }, (_, i) => { const r = rng(900 + i); return [lerp(xl1, xr1, 0.1 + r() * 0.8), lerp(top, bottom, 0.2 + r() * 0.7), 3 + r() * 6]; }) : [];
    L.paint(poly([[xl0, top], [xr0, top], [xr1, bottom], [xl1, bottom]]), (x, y, px) => {
      for (const [hx, hy, hr] of holes) if (Math.hypot(x - hx, (y - hy) * 1.4) < hr * (0.7 + 0.5 * sample(F.high, x * 2, y * 2))) { px.skip = true; return; }
      const v = (y - top) / (bottom - top);
      const xl = lerp(xl0, xl1, v), xr = lerp(xr0, xr1, v);
      const u = (x - xl) / (xr - xl);
      const s = u * stripes; const k = Math.max(0, Math.min(stripes - 1, Math.floor(s))); const fs = s - k;
      const sag = Math.sin(Math.PI * fs) * 0.05 * (0.4 + 0.6 * v);
      const n = sample(F.mid, x * 1.1, y * 1.1), lo = sample(F.low, x * 2.4, y * 2.4);
      const c = cols[k % cols.length];
      const fade = 0.8 + 0.3 * (1 - v) * lo;
      const stain = smooth(0.6, 0.74, n) * 0.4 + smooth(0.7, 0.8, lo) * 0.25;
      const shade = 0.82 + 0.26 * Math.sin(Math.PI * fs);
      px.rgb = [c[0] * fade * shade * (1 - stain), c[1] * fade * shade * (1 - stain), c[2] * fade * shade * (1 - stain * 1.2)];
      px.h = 0.34 + 0.34 * v + sag + (sample(F.high, x * 1.5, y * 1.5) - 0.5) * 0.012; px.hMode = 'set';
      px.kind = 'cloth'; px.metal = 0; px.rough = 0.93;
    });
    for (let k = 1; k < stripes; k += 1) { const t = k / stripes; L.engrave(poly([[lerp(xl0, xr0, t), top], [lerp(xl1, xr1, t), bottom]], false), 1.4, 0.12); }
  }
  // Lambrequin festonné (ou effrangé) sous l'auvent.
  function valance(L, y0, h, xl, xr, count, colors, o = {}) {
    const cols = colors.map(hex); const F = getFields();
    const sd = o.scallop ?? 7; const seg = (xr - xl) / count;
    const path = (ctx) => {
      ctx.beginPath(); ctx.moveTo(xl, y0); ctx.lineTo(xr, y0); ctx.lineTo(xr, y0 + h - sd);
      for (let k = count - 1; k >= 0; k -= 1) { const x0 = xl + k * seg; if (o.tattered) { const r = rng(k * 7 + 3); ctx.lineTo(x0 + seg * 0.7, y0 + h + (r() - 0.3) * sd * 2); ctx.lineTo(x0 + seg * 0.35, y0 + h - sd + r() * sd); ctx.lineTo(x0, y0 + h - sd); } else ctx.quadraticCurveTo(x0 + seg / 2, y0 + h + sd, x0, y0 + h - sd); }
      ctx.closePath();
    };
    L.paint(path, (x, y, px) => {
      const k = Math.max(0, Math.min(count - 1, Math.floor((x - xl) / seg))); const fu = (x - xl) / seg - k;
      const c = cols[k % cols.length]; const n = sample(F.mid, x * 1.3, y * 1.3);
      const fold = 0.5 + 0.5 * Math.sin(fu * TAU * 2);
      const tone = (0.78 + 0.28 * fold) * (1 - smooth(0.62, 0.76, n) * 0.35);
      px.rgb = [c[0] * tone, c[1] * tone, c[2] * tone];
      px.h = 0.76 + 0.03 * fold; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.93;
    });
    L.stroke(poly([[xl, y0 + 1.5], [xr, y0 + 1.5]], false), 3, { albedo: o.trim || '#2a1f14', height: 0.82, kind: 'leather', rough: 0.7 });
    if (o.fringe) { const r = rng(55); for (let x = xl + 2; x < xr; x += 3) { const len = 8 + r() * 6; const yb = y0 + h + (o.tattered ? 0 : sd * 0.2); L.stroke(poly([[x, yb - 4], [x + (r() - 0.5) * 2, yb + len]], false), 1.4, { albedo: o.fringe, height: 0.7, kind: 'cloth', rough: 0.9 }); } }
  }
  // Toit de chaume : rangs de paille qui se recouvrent.
  function thatch(L, top, bottom, xl0, xr0, xl1, xr1, o = {}) {
    const F = getFields(); const rows = o.rows || 5;
    L.paint(poly([[xl0, top], [xr0, top], [xr1 + 6, bottom], [xl1 - 6, bottom]]), (x, y, px) => {
      const v = (y - top) / (bottom - top); const rowF = v * rows; const row = Math.floor(rowF); const fr = rowF - row;
      const strand = sample(F.fine, x * 0.9 + row * 40, y * 0.12); const s2 = sample(F.high, x * 1.8 + row * 13, y * 0.3);
      const tone = 0.55 + 0.45 * strand + 0.2 * (s2 - 0.5) - 0.35 * smooth(0.75, 1, fr);
      const damp = smooth(0.55, 0.75, sample(F.low, x * 2, y * 2)) * 0.35;
      px.rgb = [(168 - damp * 60) * tone, (132 - damp * 40) * tone, (72 - damp * 20) * tone];
      px.h = 0.35 + 0.3 * v + 0.08 * fr + (strand - 0.5) * 0.05; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.95;
    });
    const r = rng(77); for (let k = 0; k < 90; k += 1) { const x = lerp(xl1 - 4, xr1 + 4, r()); L.stroke(poly([[x, bottom - 6], [x + (r() - 0.5) * 5, bottom + 4 + r() * 8]], false), 1.3, { albedo: '#8a6c3c', height: 0.72, kind: 'cloth', rough: 0.95 }); }
  }
  // Toit de bardeaux (bois ou ardoise).
  function shingles(L, top, bottom, xl0, xr0, xl1, xr1, o = {}) {
    const F = getFields(); const rows = o.rows || 6; const base = hex(o.albedo || '#4b4f55');
    L.paint(poly([[xl0, top], [xr0, top], [xr1 + 4, bottom], [xl1 - 4, bottom]]), (x, y, px) => {
      const v = (y - top) / (bottom - top); const rowF = v * rows; const row = Math.floor(rowF); const fr = rowF - row;
      const xl = lerp(xl0, xl1, v), xr = lerp(xr0, xr1, v); const u = (x - xl) / (xr - xl);
      const cols = 11 + row * 1.2; const cu = u * cols + (row % 2 ? 0.5 : 0); const ci = Math.floor(cu); const fc = cu - ci;
      const r = rng(ci * 31 + row * 7)(); const gap = smooth(0, 0.06, Math.min(fc, 1 - fc));
      const tone = (0.7 + 0.45 * r) * (0.75 + 0.35 * fr) * gap * (0.9 + 0.2 * sample(F.high, x * 2, y * 2));
      const moss = smooth(0.62, 0.72, sample(F.mid, x * 1.4, y * 1.4)) * 0.6;
      px.rgb = [base[0] * tone * (1 - moss) + 70 * moss, base[1] * tone * (1 - moss) + 84 * moss, base[2] * tone * (1 - moss) + 40 * moss];
      px.h = 0.34 + 0.32 * v + 0.06 * fr * gap; px.hMode = 'set'; px.kind = o.kind || 'stone'; px.metal = 0; px.rough = 0.8;
    });
  }

  /* ---------- enseignes et lanterne ---------- */
  const symbols = {
    market: (ctx, x, y, s) => { ctx.beginPath(); ctx.arc(x, y + s * 0.15, s * 0.5, 0, Math.PI); ctx.lineTo(x - s * 0.5, y + s * 0.15); ctx.moveTo(x - s * 0.36, y + s * 0.15); ctx.quadraticCurveTo(x, y - s * 0.75, x + s * 0.36, y + s * 0.15); ctx.moveTo(x - s * 0.4, y + s * 0.38); ctx.lineTo(x + s * 0.4, y + s * 0.38); },
    bookshop: (ctx, x, y, s) => { ctx.beginPath(); ctx.moveTo(x, y - s * 0.3); ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.45, x - s * 0.62, y - s * 0.3); ctx.lineTo(x - s * 0.62, y + s * 0.38); ctx.quadraticCurveTo(x - s * 0.3, y + s * 0.24, x, y + s * 0.38); ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.24, x + s * 0.62, y + s * 0.38); ctx.lineTo(x + s * 0.62, y - s * 0.3); ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.45, x, y - s * 0.3); ctx.lineTo(x, y + s * 0.38); },
    antique: (ctx, x, y, s) => { ctx.beginPath(); ctx.moveTo(x - s * 0.14, y - s * 0.5); ctx.lineTo(x + s * 0.14, y - s * 0.5); ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.3, x + s * 0.36, y - s * 0.05); ctx.quadraticCurveTo(x + s * 0.44, y + s * 0.3, x + s * 0.14, y + s * 0.5); ctx.lineTo(x - s * 0.14, y + s * 0.5); ctx.quadraticCurveTo(x - s * 0.44, y + s * 0.3, x - s * 0.36, y - s * 0.05); ctx.quadraticCurveTo(x - s * 0.12, y - s * 0.3, x - s * 0.14, y - s * 0.5); ctx.moveTo(x - s * 0.3, y + s * 0.05); ctx.lineTo(x + s * 0.3, y + s * 0.05); },
    armory: (ctx, x, y, s) => { ctx.beginPath(); for (const d of [-1, 1]) { ctx.moveTo(x - d * s * 0.5, y + s * 0.5); ctx.lineTo(x + d * s * 0.5, y - s * 0.5); ctx.moveTo(x - d * s * 0.34 - s * 0.12, y + s * 0.2 + d * s * 0.12 * 0); ctx.lineTo(x - d * s * 0.2 + s * 0.12 * 0, y + s * 0.38); } },
    'black-market': (ctx, x, y, s) => { ctx.beginPath(); ctx.arc(x - s * 0.28, y, s * 0.2, 0, TAU); ctx.moveTo(x - s * 0.08, y); ctx.lineTo(x + s * 0.55, y); ctx.moveTo(x + s * 0.4, y); ctx.lineTo(x + s * 0.4, y + s * 0.18); ctx.moveTo(x + s * 0.26, y); ctx.lineTo(x + s * 0.26, y + s * 0.14); },
    alchemist: (ctx, x, y, s) => { ctx.beginPath(); ctx.moveTo(x - s * 0.1, y - s * 0.5); ctx.lineTo(x - s * 0.1, y - s * 0.12); ctx.lineTo(x - s * 0.42, y + s * 0.42); ctx.lineTo(x + s * 0.42, y + s * 0.42); ctx.lineTo(x + s * 0.1, y - s * 0.12); ctx.lineTo(x + s * 0.1, y - s * 0.5); ctx.moveTo(x - s * 0.18, y - s * 0.5); ctx.lineTo(x + s * 0.18, y - s * 0.5); ctx.moveTo(x - s * 0.27, y + s * 0.18); ctx.lineTo(x + s * 0.27, y + s * 0.18); },
    tavern: (ctx, x, y, s) => { ctx.beginPath(); ctx.moveTo(x - s * 0.34, y - s * 0.3); ctx.lineTo(x - s * 0.3, y + s * 0.45); ctx.lineTo(x + s * 0.22, y + s * 0.45); ctx.lineTo(x + s * 0.26, y - s * 0.3); ctx.moveTo(x + s * 0.25, y - s * 0.12); ctx.quadraticCurveTo(x + s * 0.56, y - s * 0.1, x + s * 0.5, y + s * 0.12); ctx.quadraticCurveTo(x + s * 0.46, y + s * 0.28, x + s * 0.23, y + s * 0.26); ctx.moveTo(x - s * 0.4, y - s * 0.3); ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.55, x, y - s * 0.38); ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.55, x + s * 0.32, y - s * 0.3); },
  };
  function sign(L, type, x, y, o = {}) {
    const iron = { kind: 'iron', metal: 0.85, rough: 0.5 };
    // Potence de fer forgé depuis le poteau.
    L.taper([[o.from, y - 34], [x + 34, y - 34]], [5, 4], { albedo: '#2c2826', base: 0.7, peak: 0.86, ...iron });
    L.taper(spiralPts(o.from + 18, y - 22, 11, 2, -Math.PI / 2, 1.2, 30), [3.4, 1.6], { albedo: '#2c2826', base: 0.66, peak: 0.84, ...iron });
    L.taper([[o.from, y - 10], [o.from + 26, y - 34]], [3.4, 3], { albedo: '#2c2826', base: 0.66, peak: 0.82, ...iron });
    for (const d of [-22, 22]) { L.torus(x + d, y - 29, 3, 3, 0, 0.5, { albedo: '#3a3431', base: 0.7, peak: 0.84, ...iron }); L.stroke(poly([[x + d, y - 26], [x + d, y - 18]], false), 1.6, { albedo: '#3a3431', height: 0.72, ...iron }); }
    // Panneau de bois sculpté, symbole doré à la feuille.
    const bw = 64, bh = 46; const bx = x - bw / 2, by = y - 20;
    L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 8); }, { albedo: '#2a1c10', height: 0.62, kind: 'wood', rough: 0.8, op: 'source-over' });
    planks(L, bx, by, bw, bh, 'h', 2, { albedo: '#6a4a2c', base: 0.66, lift: 0.06, mask: (ctx) => { ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 7); }, seed: 5, knots: 0.3 });
    L.engrave((ctx) => { ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, bw - 8, bh - 8, 5); }, 1.2, 0.3);
    const sym = (ctx) => symbols[type](ctx, x, by + bh / 2, 30);
    L.engrave(sym, 3.2, 0.45, { albedo: '#b8923e', kind: 'gold', metal: 0.9, rough: 0.4 });
  }
  function lantern(L, x, y, o = {}) {
    const iron = { kind: 'iron', metal: 0.85, rough: 0.5 };
    L.stroke(poly([[x, y - 36], [x, y - 20]], false), 1.6, { albedo: '#2c2826', height: 0.8, ...iron });
    L.torus(x, y - 38, 3.5, 3.5, 0, 0.5, { albedo: '#2c2826', base: 0.76, peak: 0.88, ...iron });
    L.fill(poly([[x - 12, y - 14], [x + 12, y - 14], [x, y - 24]]), { albedo: '#2c2826', height: 0.84, ...iron, op: 'source-over' });
    L.fill(rectPath(x - 9, y - 14, 18, 26), { albedo: o.glass || '#f2c46a', height: 0.78, kind: 'glass', rough: 0.2, op: 'source-over', emissive: o.flame || 'rgba(255,190,90,0.95)' });
    for (const d of [-9, 0, 9]) L.stroke(poly([[x + d, y - 14], [x + d, y + 12]], false), 1.6, { albedo: '#2c2826', height: 0.86, ...iron });
    L.fill(rectPath(x - 11, y + 12, 22, 4), { albedo: '#2c2826', height: 0.84, ...iron, op: 'source-over' });
    L.glow((e) => { const g = e.createRadialGradient(x, y, 0, x, y, 60); g.addColorStop(0, o.halo || 'rgba(255,170,70,0.5)'); g.addColorStop(1, 'rgba(255,120,30,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y, 60, 0, TAU); e.fill(); });
  }

  /* ---------- marchandises ---------- */
  const goods = {
    apple(L, x, y, s, col = '#8e2418') { L.dome(x, y, s, { albedo: col, base: 0.7, peak: 0.9, kind: 'organic', rough: 0.4 }); L.engraveFill(circle(s * 0.18, x + s * 0.1, y - s * 0.55), 0.2); L.stroke(poly([[x + s * 0.1, y - s * 0.6], [x + s * 0.3, y - s * 1.05]], false), 1.4, { albedo: '#3a2a16', height: 0.95, kind: 'wood', rough: 0.8 }); },
    basket(L, x, y, w, h) {
      const path = (ctx) => { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * 0.3); ctx.lineTo(x + w / 2, y - h * 0.3); ctx.lineTo(x + w * 0.4, y + h / 2); ctx.lineTo(x - w * 0.4, y + h / 2); ctx.closePath(); };
      L.fill(path, { albedo: '#8a6a3a', height: linearStyle(x - w / 2, y, x + w / 2, y, [[0, 0.62], [0.5, 0.74], [1, 0.62]]), kind: 'wood', rough: 0.8, op: 'source-over' });
      for (let k = 0; k < 5; k += 1) L.engrave(poly([[x - w / 2 + 2, y - h * 0.3 + k * h * 0.17], [x + w / 2 - 2, y - h * 0.3 + k * h * 0.17]], false), 1, 0.2);
      for (let k = -3; k <= 3; k += 1) L.engrave(poly([[x + k * w * 0.13, y - h * 0.3], [x + k * w * 0.11, y + h / 2]], false), 0.9, 0.15);
      L.tube(poly([[x - w / 2, y - h * 0.3], [x + w / 2, y - h * 0.3]], false), 5, { albedo: '#9a7a44', base: 0.7, peak: 0.84, kind: 'wood', rough: 0.7 });
    },
    bottle(L, x, y, h, col, glow) {
      const w = h * 0.42;
      L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(x, y - h * 0.22, w / 2, h * 0.3, 0, 0, TAU); }, { albedo: col, height: domeStyle(x, y - h * 0.22, h * 0.3, 0.66, 0.9), kind: 'glass', rough: 0.06, op: 'source-over', emissive: glow });
      L.taper([[x, y - h * 0.45], [x, y - h * 0.9]], [w * 0.36, w * 0.26], { albedo: col, base: 0.7, peak: 0.86, kind: 'glass', rough: 0.06 });
      L.fill(rectPath(x - w * 0.16, y - h, w * 0.32, h * 0.12), { albedo: '#7a5a36', height: 0.88, kind: 'wood', rough: 0.8, op: 'source-over' });
    },
    book(L, x, y, w, h, col) { L.fill(rectPath(x - w / 2, y - h / 2, w, h), { albedo: col, height: linearStyle(x - w / 2, y, x + w / 2, y, [[0, 0.64], [0.5, 0.72], [1, 0.64]]), kind: 'leather', rough: 0.7, op: 'source-over' }); for (const t of [0.2, 0.8]) L.stroke(poly([[x - w / 2, y - h / 2 + t * h], [x + w / 2, y - h / 2 + t * h]], false), 1.6, { albedo: '#b8923e', height: 0.76, kind: 'gold', metal: 0.9, rough: 0.4 }); },
    sword(L, x0, y0, x1, y1) {
      const a = Math.atan2(y1 - y0, x1 - x0), px = -Math.sin(a), py = Math.cos(a);
      L.taper([[x0, y0], [x1, y1]], (t) => 7 * (1 - t * 0.7) + 0.5, { albedo: '#9ea3a8', base: 0.7, peak: 0.86, kind: 'silver', metal: 0.95, rough: 0.28 });
      L.engrave(poly([[x0 + (x1 - x0) * 0.05, y0 + (y1 - y0) * 0.05], [x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8]], false), 1, 0.2);
      L.taper([[x0 + px * 12, y0 + py * 12], [x0 - px * 12, y0 - py * 12]], [4, 4], { albedo: '#8a6a34', base: 0.8, peak: 0.94, kind: 'gold', metal: 0.9, rough: 0.4 });
      L.taper([[x0, y0], [x0 - (x1 - x0) * 0.2, y0 - (y1 - y0) * 0.2]], [4.2, 4.2], { albedo: '#3a2616', base: 0.78, peak: 0.9, kind: 'leather', rough: 0.7 });
      L.dome(x0 - (x1 - x0) * 0.22, y0 - (y1 - y0) * 0.22, 4, { albedo: '#8a6a34', base: 0.8, peak: 0.96, kind: 'gold', metal: 0.9, rough: 0.4 });
    },
    shield(L, x, y, r, col) { L.dome(x, y, r, { albedo: col, base: 0.62, peak: 0.8, kind: 'paint', rough: 0.6 }); L.torus(x, y, r, r, 0, 0.1, { albedo: '#3a3431', base: 0.72, peak: 0.84, kind: 'iron', metal: 0.85, rough: 0.5 }); L.dome(x, y, r * 0.24, { albedo: '#5a524c', base: 0.8, peak: 0.96, kind: 'iron', metal: 0.85, rough: 0.45 }); },
    helmet(L, x, y, s) { L.fill((ctx) => { ctx.beginPath(); ctx.arc(x, y, s, Math.PI, 0); ctx.lineTo(x + s, y + s * 0.9); ctx.lineTo(x - s, y + s * 0.9); ctx.closePath(); }, { albedo: '#7d8288', height: domeStyle(x, y, s * 1.2, 0.66, 0.95), kind: 'silver', metal: 0.95, rough: 0.35, op: 'source-over' }); L.engraveFill(rectPath(x - s * 0.7, y + s * 0.15, s * 1.4, s * 0.16), 0.5, { albedo: '#101010' }); L.engrave(poly([[x, y - s], [x, y + s * 0.9]], false), 1.2, 0.3); },
    tankard(L, x, y, s) { L.fill(rectPath(x - s * 0.5, y - s, s, s * 1.3), { albedo: '#6a5a4a', height: linearStyle(x - s / 2, y, x + s / 2, y, [[0, 0.66], [0.5, 0.82], [1, 0.66]]), kind: 'silver', metal: 0.8, rough: 0.5, op: 'source-over' }); for (const t of [0.15, 0.85]) L.stroke(poly([[x - s * 0.5, y - s + t * s * 1.3], [x + s * 0.5, y - s + t * s * 1.3]], false), 2, { albedo: '#3a3431', height: 0.84, kind: 'iron', metal: 0.8, rough: 0.5 }); L.torus(x + s * 0.62, y - s * 0.4, s * 0.26, s * 0.36, 0, 0.35, { albedo: '#6a5a4a', base: 0.7, peak: 0.84, kind: 'silver', metal: 0.8, rough: 0.5 }); L.ellipse(x, y - s - 1, s * 0.52, s * 0.18, 0, { albedo: '#e8dcc0', base: 0.8, peak: 0.92, kind: 'cloth', rough: 0.9 }); },
    barrel(L, x, y, w, h) { L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TAU); }, { albedo: '#6a4a2a', height: linearStyle(x - w / 2, y, x + w / 2, y, [[0, 0.56], [0.5, 0.78], [1, 0.56]]), kind: 'wood', rough: 0.7, op: 'source-over' }); for (let k = -2; k <= 2; k += 1) L.engrave(poly([[x + k * w * 0.18, y - h * 0.46], [x + k * w * 0.2, y + h * 0.46]], false), 1, 0.2); for (const t of [-0.3, 0.3]) L.stroke((ctx) => { ctx.beginPath(); ctx.ellipse(x, y + t * h, w / 2 - 1, 3, 0, 0, Math.PI); }, 3, { albedo: '#2e2926', height: 0.8, kind: 'iron', metal: 0.8, rough: 0.5 }); },
    vase(L, x, y, h, col) { const w = h * 0.5; L.fill((ctx) => { ctx.beginPath(); ctx.moveTo(x - w * 0.18, y - h); ctx.lineTo(x + w * 0.18, y - h); ctx.quadraticCurveTo(x + w * 0.1, y - h * 0.7, x + w * 0.5, y - h * 0.4); ctx.quadraticCurveTo(x + w * 0.6, y, x + w * 0.2, y); ctx.lineTo(x - w * 0.2, y); ctx.quadraticCurveTo(x - w * 0.6, y, x - w * 0.5, y - h * 0.4); ctx.quadraticCurveTo(x - w * 0.1, y - h * 0.7, x - w * 0.18, y - h); ctx.closePath(); }, { albedo: col, height: linearStyle(x - w / 2, y, x + w / 2, y, [[0, 0.62], [0.45, 0.86], [1, 0.62]]), kind: 'paint', rough: 0.45, op: 'source-over' }); L.stroke(poly([[x - w * 0.46, y - h * 0.42], [x + w * 0.46, y - h * 0.42]], false), 2, { albedo: '#b8923e', height: 0.88, kind: 'gold', metal: 0.9, rough: 0.4, dash: [3, 2] }); },
    chest(L, x, y, w, h) { L.fill(rectPath(x - w / 2, y - h / 2, w, h), { albedo: '#4a321e', height: 0.7, kind: 'wood', rough: 0.7, op: 'source-over' }); L.fill(rectPath(x - w / 2, y - h / 2, w, h * 0.34), { albedo: '#553a22', height: linearStyle(x, y - h / 2, x, y - h / 2 + h * 0.34, [[0, 0.72], [1, 0.78]]), kind: 'wood', rough: 0.7, op: 'source-over' }); for (const t of [0.15, 0.85]) L.fill(rectPath(x - w / 2 + t * w - 3, y - h / 2, 6, h), { albedo: '#2e2926', height: 0.82, kind: 'iron', metal: 0.85, rough: 0.5, op: 'source-over' }); L.fill(rectPath(x - 5, y - h * 0.18, 10, 12), { albedo: '#8a6a34', height: 0.84, kind: 'gold', metal: 0.9, rough: 0.4, op: 'source-over' }); L.engraveFill(rectPath(x - 1, y - h * 0.1, 2, 5), 0.5); },
    candle(L, x, y, h) { L.fill(rectPath(x - 3, y - h, 6, h), { albedo: '#e3d9c0', height: 0.8, kind: 'wax', rough: 0.5, op: 'source-over' }); L.ellipse(x, y - h - 4, 2, 4, 0, { albedo: '#ffe2a0', flat: 0.9, kind: 'glass', rough: 0.2, emissive: 'rgba(255,200,110,1)' }); L.glow((e) => { const g = e.createRadialGradient(x, y - h - 4, 0, x, y - h - 4, 22); g.addColorStop(0, 'rgba(255,190,90,0.6)'); g.addColorStop(1, 'rgba(255,120,30,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y - h - 4, 22, 0, TAU); e.fill(); }); },
    herbs(L, x, y, len) { for (let k = -2; k <= 2; k += 1) L.stroke(poly([[x, y], [x + k * 3, y + len]], false), 1.2, { albedo: '#4a5a2a', height: 0.8, kind: 'organic', rough: 0.8 }); for (let k = 0; k < 7; k += 1) { const r = rng(k * 5 + x)(); leaf(L, x + (r - 0.5) * 10, y + len * (0.4 + r * 0.6), 9, 4, Math.PI / 2 + (r - 0.5) * 1.4, { albedo: '#56642e', base: 0.8, peak: 0.9, veins: false, rough: 0.8 }); } L.stroke(poly([[x - 3, y + 2], [x + 3, y + 2]], false), 2, { albedo: '#8a6a3a', height: 0.84, kind: 'cloth', rough: 0.9 }); },
    coins(L, x, y, n) { const r = rng(n * 13); for (let k = 0; k < n; k += 1) L.dome(x + (r() - 0.5) * 22, y + (r() - 0.5) * 8, 3.4, { albedo: '#b8923e', base: 0.74, peak: 0.84, kind: 'gold', metal: 0.95, rough: 0.35 }); },
    scroll(L, x, y, w) { L.tube(poly([[x - w / 2, y], [x + w / 2, y]], false), 9, { albedo: '#d6c8a4', base: 0.7, peak: 0.86, kind: 'cloth', rough: 0.8 }); L.stroke(poly([[x - 3, y - 5], [x - 3, y + 5]], false), 2.4, { albedo: '#7a1f1a', height: 0.9, kind: 'cloth', rough: 0.8 }); },
    sack(L, x, y, w, h, col = '#8a7a58') { L.fill((ctx) => { ctx.beginPath(); ctx.moveTo(x - w * 0.2, y - h / 2); ctx.quadraticCurveTo(x - w * 0.65, y, x - w * 0.45, y + h / 2); ctx.lineTo(x + w * 0.45, y + h / 2); ctx.quadraticCurveTo(x + w * 0.65, y, x + w * 0.2, y - h / 2); ctx.closePath(); }, { albedo: col, height: domeStyle(x, y + h * 0.1, w * 0.6, 0.6, 0.84), kind: 'cloth', rough: 0.92, op: 'source-over' }); L.stroke(poly([[x - w * 0.22, y - h * 0.36], [x + w * 0.22, y - h * 0.36]], false), 2, { albedo: '#4a3a24', height: 0.86, kind: 'cloth', rough: 0.9 }); },
  };

  /* ---------- l'échoppe ---------- */
  const TYPES = {
    market: { label: 'Marché', roof: 'awning', colors: ['#6e2a1e', '#a8946c'], valance: 'scallop' },
    bookshop: { label: 'Librairie', roof: 'awning', colors: ['#263452', '#a89c80'], valance: 'fringe' },
    antique: { label: 'Antiquaire', roof: 'awning', colors: ['#42263e', '#8e7234'], valance: 'scallop' },
    armory: { label: 'Armurerie', roof: 'shingles', shingle: '#4a4d52', pennant: '#6e1a16' },
    'black-market': { label: 'Marché noir', roof: 'awning', colors: ['#1f1c22', '#35283d'], valance: 'tattered', holes: 5 },
    alchemist: { label: 'Alchimiste', roof: 'awning', colors: ['#3a4a30', '#9e9476'], valance: 'scallop' },
    tavern: { label: 'Taverne', roof: 'thatch' },
  };
  const OPEN = { x: 100, y: 146, w: 312, h: 176 };

  function build(L, type, withNpc) {
    const T = TYPES[type];
    const r = rng(type.length * 17);
    // Poteaux.
    beam(L, 60, 112, 38, 384, { albedo: '#3c2618', seed: 1, side: 1 });
    beam(L, 414, 112, 38, 384, { albedo: '#3c2618', seed: 2, side: -1 });
    for (const bx of [60, 414]) { ironBand(L, bx - 2, 150, 42, 9, { base: 0.72 }); ironBand(L, bx - 2, 330, 42, 9, { base: 0.72 }); }
    // Comptoir : plateau vu d'en haut puis façade de planches.
    const topPath = poly([[OPEN.x - 8, OPEN.y + OPEN.h - 6], [OPEN.x + OPEN.w + 8, OPEN.y + OPEN.h - 6], [470, 350], [42, 350]]);
    planks(L, 42, OPEN.y + OPEN.h - 6, 428, 350 - (OPEN.y + OPEN.h - 6), 'h', 2, { albedo: '#56391f', base: 0.62, lift: 0.05, mask: topPath, seed: 12 });
    L.fill(poly([[40, 348], [472, 348], [472, 358], [40, 358]]), { albedo: '#3e2816', height: linearStyle(0, 348, 0, 358, [[0, 0.78], [1, 0.7]]), kind: 'wood', rough: 0.7, op: 'source-over' });
    planks(L, 46, 358, 420, 128, 'v', 11, { albedo: '#44301e', base: 0.55, lift: 0.08, seed: 14, nails: [0.12, 0.88] });
    ironBand(L, 46, 372, 420, 8, { base: 0.66, rivets: [0.05, 0.3, 0.55, 0.8, 0.97] });
    ironBand(L, 46, 460, 420, 8, { base: 0.66, rivets: [0.05, 0.3, 0.55, 0.8, 0.97] });
    // Toit.
    if (T.roof === 'awning') awning(L, 20, 118, 78, 434, 18, 494, 9, T.colors, { holes: T.holes });
    else if (T.roof === 'thatch') thatch(L, 14, 122, 70, 442, 12, 500, { rows: 5 });
    else shingles(L, 18, 120, 76, 436, 14, 498, { rows: 6, albedo: T.shingle });
    if (T.roof === 'awning') valance(L, 116, 26, 18, 494, 12, T.colors, { tattered: T.valance === 'tattered', fringe: T.valance === 'fringe' ? '#b8923e' : T.valance === 'tattered' ? '#2a2230' : null, scallop: 7 });
    else L.fill(rectPath(14, 118, 484, 14), { albedo: '#3a2818', height: linearStyle(0, 118, 0, 132, [[0, 0.8], [1, 0.72]]), kind: 'wood', rough: 0.7, op: 'source-over' });
    // Tenture aux couleurs de la boutique, symbole peint.
    {
      const cols = (T.colors || (type === 'tavern' ? ['#6a3a1e', '#b89454'] : ['#5a1a16', '#b08a44'])).map(hex);
      const dx0 = 186, dx1 = 326, dy0 = 356, dy1 = 446; const F = getFields();
      const path = (ctx) => { ctx.beginPath(); ctx.moveTo(dx0, dy0); ctx.lineTo(dx1, dy0); ctx.lineTo(dx1, dy1 - 14); ctx.lineTo((dx0 + dx1) / 2, dy1 + 8); ctx.lineTo(dx0, dy1 - 14); ctx.closePath(); };
      L.paint(path, (x, y, px) => {
        const u = (x - dx0) / (dx1 - dx0); const fold = 0.5 + 0.5 * Math.sin(u * TAU * 3.2);
        const n = sample(F.mid, x * 1.3, y * 1.3); const c = cols[0];
        const tone = (0.7 + 0.35 * fold) * (1 - smooth(0.6, 0.75, n) * 0.35) * (1 - 0.25 * smooth(0.6, 1, (y - dy0) / (dy1 - dy0)));
        px.rgb = [c[0] * tone, c[1] * tone, c[2] * tone]; px.h = 0.72 + 0.04 * fold; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.92;
      });
      L.stroke(poly([[dx0, dy0 + 2], [dx1, dy0 + 2]], false), 4, { albedo: '#2a1f14', height: 0.8, kind: 'leather', rough: 0.7 });
      for (const tx of [dx0 + 4, dx1 - 4]) L.dome(tx, dy0 + 3, 4, { albedo: '#8a6a34', base: 0.8, peak: 0.94, kind: 'gold', metal: 0.9, rough: 0.4 });
      L.stroke((ctx) => symbols[type](ctx, (dx0 + dx1) / 2, (dy0 + dy1) / 2 - 2, 46), 4, { albedo: `rgb(${cols[1][0]},${cols[1][1]},${cols[1][2]})`, keepMaterial: true });
      L.engrave((ctx) => symbols[type](ctx, (dx0 + dx1) / 2, (dy0 + dy1) / 2 - 2, 46), 2, 0.08);
      const r2 = rng(5); for (let x = dx0 + 3; x < dx1; x += 4) { const t = (x - dx0) / (dx1 - dx0); const yb = t < 0.5 ? lerp(dy1 - 14, dy1 + 8, t * 2) : lerp(dy1 + 8, dy1 - 14, (t - 0.5) * 2); L.stroke(poly([[x, yb - 2], [x + (r2() - 0.5) * 2, yb + 6 + r2() * 4]], false), 1.3, { albedo: '#8a6a34', height: 0.74, kind: 'cloth', rough: 0.9 }); }
    }
    // Marchandises sur le comptoir.
    const y0 = OPEN.y + OPEN.h - 2;
    if (type === 'market') { goods.basket(L, 150, y0 - 12, 70, 30); for (let k = 0; k < 7; k += 1) goods.apple(L, 128 + k * 8 + (k % 2) * 3, y0 - 34 - (k % 3) * 4, 8, ['#8e2418', '#9a3a16', '#7a2a14'][k % 3]); goods.sack(L, 350, y0 - 18, 56, 40, '#6e5e42'); goods.sack(L, 300, y0 - 12, 40, 28, '#7a6a4a'); goods.coins(L, 240, y0 - 4, 6); }
    if (type === 'bookshop') { for (let k = 0; k < 5; k += 1) goods.book(L, 150 + (k % 2) * 4, y0 - 8 - k * 9, 64, 9, ['#5a1f1a', '#2e3d5e', '#3d4a2a', '#6a4a2a', '#4a2a3a'][k]); goods.scroll(L, 280, y0 - 10, 60); goods.scroll(L, 300, y0 - 22, 48); goods.candle(L, 380, y0 - 2, 22); }
    if (type === 'antique') { goods.vase(L, 150, y0 - 2, 56, '#3f5a6a'); goods.vase(L, 196, y0 - 2, 40, '#7a4a2a'); goods.chest(L, 320, y0 - 20, 64, 40); goods.candle(L, 390, y0 - 2, 26); goods.coins(L, 250, y0 - 4, 5); }
    if (type === 'armory') { goods.helmet(L, 150, y0 - 20, 22); goods.sword(L, 210, y0 - 6, 380, y0 - 14); goods.shield(L, 360, y0 - 36, 28, '#6e1a16'); }
    if (type === 'black-market') { goods.chest(L, 160, y0 - 18, 60, 36); goods.bottle(L, 250, y0 - 2, 34, '#2a5a3a', 'rgba(80,255,120,0.4)'); goods.bottle(L, 276, y0 - 2, 28, '#4a2a5a', 'rgba(170,90,255,0.35)'); goods.sword(L, 310, y0 - 8, 400, y0 - 20); goods.coins(L, 220, y0 - 4, 4); }
    if (type === 'alchemist') { const cols = [['#7a1a14', 'rgba(255,60,30,0.45)'], ['#1f4a6a', 'rgba(60,160,255,0.45)'], ['#3a6a24', 'rgba(120,255,80,0.45)'], ['#6a4a14', 'rgba(255,200,60,0.4)'], ['#4a2a6a', 'rgba(180,90,255,0.45)']]; cols.forEach(([c, g], k) => goods.bottle(L, 140 + k * 44, y0 - 2, 30 + (k % 2) * 12, c, g)); skull(L, 370, y0 - 26, 0.42, 0, { base: 0.66, lift: 0.3, seed: 2 }); }
    if (type === 'tavern') { goods.barrel(L, 150, y0 - 24, 56, 50); goods.tankard(L, 240, y0 - 2, 22); goods.tankard(L, 280, y0 - 2, 20); goods.barrel(L, 360, y0 - 20, 46, 42); }
    // Herbes suspendues (alchimiste), fanion (armurerie).
    if (type === 'alchemist') for (const hx of [130, 190, 330, 380]) goods.herbs(L, hx, 140, 30);
    if (type === 'armory') { L.fill(poly([[230, 132], [282, 132], [282, 176], [256, 190], [230, 176]]), { albedo: T.pennant, height: 0.8, kind: 'cloth', rough: 0.9, op: 'source-over' }); L.engrave(symbols.armory ? (ctx) => symbols.armory(ctx, 256, 158, 26) : () => {}, 2.2, 0.35, { albedo: '#b8923e', kind: 'gold', metal: 0.9, rough: 0.4 }); }
    // Enseigne et lanterne.
    sign(L, type, 468, 216, { from: 452 });
    lantern(L, 34, 214, type === 'black-market' ? { glass: '#9adf9a', flame: 'rgba(120,255,140,0.9)', halo: 'rgba(90,220,120,0.45)' } : {});
    // Planches de sol / ombre.
    return { label: T.label };
  }

  // Arrière-boutique : mur de planches, étagères chargées selon le métier.
  function buildInterior(L, type) {
    planks(L, OPEN.x - 4, OPEN.y - 4, OPEN.w + 8, OPEN.h + 12, 'v', 10, { albedo: '#3b2a1a', base: 0.1, lift: 0.05, seed: 9 });
    const shelves = [OPEN.y + 62, OPEN.y + 126];
    for (const sy of shelves) { planks(L, OPEN.x - 4, sy, OPEN.w + 8, 9, 'h', 1, { albedo: '#5e4226', base: 0.34, lift: 0.08, seed: sy, knots: 0 }); L.fill(rectPath(OPEN.x - 4, sy + 9, OPEN.w + 8, 5), { albedo: '#140d08', height: 0.12, kind: 'wood', rough: 0.9, op: 'source-over' }); }
    const r = rng(type.length * 31);
    for (const sy of shelves) {
      for (let x = OPEN.x + 16; x < OPEN.x + OPEN.w - 14; x += 26 + r() * 10) {
        const pick = r();
        if (type === 'bookshop' || (type === 'antique' && pick < 0.3)) { for (let k = 0; k < 4; k += 1) L.fill(rectPath(x + k * 5, sy - 34 + r() * 6, 5, 34), { albedo: ['#4a1a16', '#233050', '#2f3a20', '#4a3420'][k % 4], height: 0.3, kind: 'leather', rough: 0.7, op: 'source-over' }); }
        else if (type === 'alchemist' || (type === 'black-market' && pick < 0.5)) goods.bottle(L, x + 8, sy, 24 + r() * 12, ['#5a1a14', '#1a3a5a', '#2a5a1a', '#4a2a5a'][Math.floor(r() * 4)], r() < 0.5 ? 'rgba(120,200,255,0.18)' : undefined);
        else if (type === 'tavern') goods.tankard(L, x + 8, sy, 14);
        else if (type === 'armory') { goods.sword(L, x, sy - 4, x + 4, sy - 44); }
        else if (type === 'market') goods.sack(L, x + 10, sy - 12, 26, 22, ['#8a7a58', '#7a6a4a'][Math.floor(r() * 2)]);
        else goods.vase(L, x + 8, sy, 26 + r() * 10, ['#3f5a6a', '#7a4a2a', '#5a4a3a'][Math.floor(r() * 3)]);
      }
    }
  }

  function renderStall(type, img) {
    const L = createLayers();
    const spec = build(L, type, !!img);
    const inside = (x, y) => x >= OPEN.x && x < OPEN.x + OPEN.w && y >= OPEN.y && y < OPEN.y + OPEN.h + 4;
    const lanternCol = type === 'black-market' ? [0.5, 1.4, 0.7] : [1.8, 1.1, 0.5];
    const lights = [{ dir: [-0.5, -0.55, 0.66], color: [1.32, 1.12, 0.86] }, { dir: [0.7, 0.4, 0.5], color: [0.12, 0.14, 0.24], shadow: false }, { pos: [34, 214, 60], radius: 150, color: lanternCol }];
    const lit = render(L, { seed: type.length, lights, room: [0.18, 0.15, 0.12], exposure: 0.95, saturation: 0.86, inside, portraitShadow: 0.9, dropShadow: 0.4, groundHeight: -0.6 });
    // Intérieur rendu à part, plus sombre (l'ombre de l'auvent).
    const Li = createLayers(); buildInterior(Li, type);
    const inner = render(Li, { seed: 3, lights: [{ dir: [-0.5, -0.55, 0.66], color: [0.62, 0.52, 0.4] }, { pos: [34, 214, 90], radius: 170, color: lanternCol.map((v) => v * 0.6) }], room: [0.1, 0.08, 0.06], shadow: 0, portraitShadow: 0, dropShadow: 0, glint: 0.2 });
    const c = document.createElement('canvas'); c.width = c.height = 512; const ctx = c.getContext('2d');
    ctx.save(); ctx.beginPath(); ctx.rect(OPEN.x - 4, OPEN.y - 4, OPEN.w + 8, OPEN.h + 12); ctx.clip();
    ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, 512, 512);
    ctx.drawImage(inner, 0, 0);
    if (img) {
      // Le vendeur se tient au milieu de l'échoppe, fondu dans la pénombre.
      const h = OPEN.h * 2.75, w = img.width * (h / img.height);
      const pc = document.createElement('canvas'); pc.width = pc.height = 512; const px = pc.getContext('2d');
      px.filter = 'sepia(0.16) saturate(0.88) contrast(1.08) brightness(1.02)';
      px.drawImage(img, 256 - w * 0.52, OPEN.y + OPEN.h * 0.5 - h * 0.33, w, h);
      px.filter = 'none';
      px.globalCompositeOperation = 'destination-in';
      const left = 256 - w * 0.52, right = left + w;
      const g = px.createLinearGradient(left, 0, right, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.2, 'rgba(0,0,0,0.9)'); g.addColorStop(0.32, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,1)'); g.addColorStop(0.82, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      px.fillStyle = g; px.fillRect(0, 0, 512, 512);
      ctx.drawImage(pc, 0, 0);
      ctx.fillStyle = type === 'black-market' ? 'rgba(20,60,30,0.12)' : 'rgba(120,60,10,0.1)'; ctx.fillRect(0, 0, 512, 512);
    }
    const top = ctx.createLinearGradient(0, OPEN.y, 0, OPEN.y + 60); top.addColorStop(0, 'rgba(10,6,3,0.7)'); top.addColorStop(1, 'rgba(10,6,3,0)'); ctx.fillStyle = top; ctx.fillRect(OPEN.x - 4, OPEN.y - 4, OPEN.w + 8, 80);
    ctx.restore();
    if (lit.shadow) { ctx.save(); ctx.filter = 'blur(1.5px)'; ctx.drawImage(lit.shadow, 0, 0); ctx.restore(); }
    ctx.drawImage(lit, 0, 0);
    return c;
  }

  root.StallLab = { types: Object.keys(TYPES), TYPES, renderStall, goods, planks, symbols, beam, ironBand, lantern };
}(window));
