// Labo Eraser — boutiques rondes, pack 2 : quatre contours qui disent « boutique »
// (vitrine, enseigne, auvent, porte), chacun décliné pour les huit boutiques.
(function (root) {
  'use strict';
  const { C, TAU, rng, createLayers, render, compose, portraitCanvas, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { P, circle, ringPath, arcPath, sectorPath, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, rivet, gem, chain, beads, skull } = root.Helpers;
  const Pr = root.Props;
  const symbols = root.StallLab.symbols;
  symbols.traveling = (ctx, x, y, s) => { ctx.beginPath(); ctx.arc(x, y, s * 0.44, 0, TAU); ctx.moveTo(x + s * 0.1, y); ctx.arc(x, y, s * 0.1, 0, TAU); for (let k = 0; k < 8; k += 1) { const a = (k / 8) * TAU; ctx.moveTo(x + Math.cos(a) * s * 0.1, y + Math.sin(a) * s * 0.1); ctx.lineTo(x + Math.cos(a) * s * 0.44, y + Math.sin(a) * s * 0.44); } };

  const SHOPS = {
    market: { name: 'MARCHÉ', paint: '#5a2418', accent: '#d8c8a2', glass: [230, 170, 90], stripes: ['#7a2a1e', '#cbbb94'] },
    bookshop: { name: 'LIBRAIRIE', paint: '#1d3a2a', accent: '#b8923e', glass: [230, 170, 90], stripes: ['#233452', '#c4b692'] },
    antique: { name: 'ANTIQUAIRE', paint: '#3a1e32', accent: '#b8923e', glass: [230, 170, 90], stripes: ['#4a2442', '#a8883a'] },
    armory: { name: 'ARMURERIE', paint: '#26282c', accent: '#9a1e18', glass: [220, 150, 80], stripes: ['#3a3c40', '#7a1a16'] },
    'black-market': { name: 'MARCHÉ NOIR', paint: '#1c1a20', accent: '#5a3a6e', glass: [110, 220, 130], stripes: ['#1e1b22', '#3a2a46'], tattered: true },
    alchemist: { name: 'ALCHIMISTE', paint: '#4a1418', accent: '#b8923e', glass: [120, 200, 150], stripes: ['#2e4a32', '#c4b692'] },
    tavern: { name: 'TAVERNE', paint: '#5a2414', accent: '#c9a24e', glass: [240, 160, 70], stripes: ['#8a4a1a', '#d6c090'] },
    traveling: { name: 'MARCHÉ AMBULANT', paint: '#7a1e1a', accent: '#d9b45e', glass: [240, 170, 90], stripes: ['#7a1e1a', '#1f4a2c'] },
  };
  const ORDER = ['market', 'bookshop', 'antique', 'armory', 'black-market', 'alchemist', 'tavern', 'traveling'];
  const LABELS = { market: 'Marché', bookshop: 'Librairie', antique: 'Antiquaire', armory: 'Armurerie', 'black-market': 'Marché noir', alchemist: 'Alchimiste', tavern: 'Taverne', traveling: 'Marché ambulant' };
  const FONT = (size) => `700 ${size}px "FreeSerif", "Liberation Serif", serif`;

  /* ---------- outils ---------- */
  function paintedWood(L, mask, color, o = {}) {
    const f = getFields(); const c0 = hex(color);
    L.paint(mask, (x, y, px) => {
      const n = sample(f.mid, x * 1.5, y * 1.5), hi = sample(f.high, x * 1.2, y * 1.2), g = sample(f.mid, x * 0.4 + 90, y * 4);
      const chip = smooth(0.66, 0.72, n * 0.7 + hi * 0.4) * (o.wear ?? 1);
      const wood = [92 * (0.7 + 0.4 * g), 62 * (0.7 + 0.4 * g), 38 * (0.7 + 0.4 * g)];
      const paintCol = c0.map((v) => v * (0.85 + 0.25 * n));
      px.rgb = paintCol.map((v, k) => v + (wood[k] - v) * chip);
      px.h = (o.height ? o.height(x, y) : 0.4) - 0.012 * chip; px.hMode = 'set';
      px.kind = chip > 0.5 ? 'wood' : 'paint'; px.metal = 0; px.rough = chip > 0.5 ? 0.75 : 0.4;
    }, { rule: o.rule });
  }
  function textOnCurve(L, text, p0, p1, p2, o) {
    const c1 = [lerp(p0[0], p2[0], 1 / 3) + (p1[0] - (p0[0] + p2[0]) / 2) * 1.33, lerp(p0[1], p2[1], 1 / 3) + (p1[1] - (p0[1] + p2[1]) / 2) * 1.33];
    const c2 = [lerp(p0[0], p2[0], 2 / 3) + (p1[0] - (p0[0] + p2[0]) / 2) * 1.33, lerp(p0[1], p2[1], 2 / 3) + (p1[1] - (p0[1] + p2[1]) / 2) * 1.33];
    const pts = bezierPts(p0, c1, c2, p2, 200);
    const lens = [0]; for (let i = 1; i < pts.length; i += 1) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = lens[lens.length - 1];
    L.a.save(); L.a.font = o.font; const widths = [...text].map((ch) => L.a.measureText(ch).width + (o.spacing ?? 2)); L.a.restore();
    let d = (total - widths.reduce((s, w) => s + w, 0)) / 2;
    [...text].forEach((ch, k) => {
      const mid = d + widths[k] / 2; let i = lens.findIndex((l) => l >= mid); if (i < 1) i = 1;
      const a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
      if (ch !== ' ') L.text(ch, pts[i][0], pts[i][1], a, o);
      d += widths[k];
    });
  }
  function banner(L, x0, x1, y, sag, h, text, o) {
    const f = getFields(); const mid = [(x0 + x1) / 2, y + sag];
    const band = (ctx) => { ctx.beginPath(); ctx.moveTo(x0, y - h / 2); ctx.quadraticCurveTo(mid[0], mid[1] - h / 2, x1, y - h / 2); ctx.lineTo(x1, y + h / 2); ctx.quadraticCurveTo(mid[0], mid[1] + h / 2, x0, y + h / 2); ctx.closePath(); };
    for (const d of [-1, 1]) {
      const xe = d < 0 ? x0 : x1;
      L.fill(poly([[xe - d * 4, y - h / 2 + 8], [xe + d * 34, y - h / 2 + 14], [xe + d * 22, y + 4], [xe + d * 34, y + h / 2 + 14], [xe - d * 4, y + h / 2 + 8]]), { albedo: o.dark || '#8a7a5a', height: 0.46, kind: 'cloth', rough: 0.85, op: 'source-over' });
      L.fill(poly([[xe - d * 4, y + h / 2 - 2], [xe + d * 10, y + h / 2 + 10], [xe - d * 4, y + h / 2 + 10]]), { albedo: '#2a2016', height: 0.44, kind: 'cloth', rough: 0.9, op: 'source-over' });
    }
    const c0 = hex(o.color || '#d6c8a2');
    L.paint(band, (x, yy, px) => { const n = sample(f.mid, x * 1.4, yy * 1.4); const t = (x - x0) / (x1 - x0); const fold = 0.9 + 0.1 * Math.sin(t * TAU * 2.5); px.rgb = c0.map((v) => v * (0.8 + 0.25 * n) * fold); px.h = 0.54 + 0.03 * fold; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.85; });
    for (const dy of [-h / 2 + 3, h / 2 - 3]) L.stroke((ctx) => { ctx.beginPath(); ctx.moveTo(x0, y + dy); ctx.quadraticCurveTo(mid[0], mid[1] + dy, x1, y + dy); }, 1.6, { albedo: o.trim || '#8a6a34', height: 0.58, kind: 'gold', metal: 0.8, rough: 0.5 });
    textOnCurve(L, text, [x0 + 8, y], mid, [x1 - 8, y], { font: FONT(o.size || 24), albedo: o.ink || '#2a1a10', depth: 0.25, spacing: o.spacing ?? 3 });
  }
  // Volutes peintes à l'or (décor de roulotte).
  function scrollwork(L, cx, cy, s, rot, col = '#c9a24e', z = 0.5) {
    for (const d of [-1, 1]) {
      const pts = spiralPts(cx + Math.cos(rot) * d * 14 * s, cy + Math.sin(rot) * d * 14 * s, 12 * s, 1.5 * s, rot + (d > 0 ? Math.PI : 0), d * 1.3, 30);
      L.stroke(smoothPath(pts), 2.4 * s, { albedo: col, height: z, kind: 'gold', metal: 0.85, rough: 0.45 });
    }
    L.stroke(poly([[cx - Math.cos(rot) * 16 * s, cy - Math.sin(rot) * 16 * s], [cx + Math.cos(rot) * 16 * s, cy + Math.sin(rot) * 16 * s]], false), 2.2 * s, { albedo: col, height: z, kind: 'gold', metal: 0.85, rough: 0.45 });
    L.dome(cx, cy, 3 * s, { albedo: col, base: z, peak: z + 0.06, kind: 'gold', metal: 0.85, rough: 0.45 });
  }
  // Guirlande de fanions le long d'une corde qui pend.
  function bunting(L, x0, y0, x1, y1, n, z) {
    const cols = ['#8e2a1e', '#c9a24e', '#2a4a6e', '#2e5a32', '#d6c8a2'];
    const pts = bezierPts([x0, y0], [lerp(x0, x1, 0.33), Math.max(y0, y1) + 30], [lerp(x0, x1, 0.66), Math.max(y0, y1) + 30], [x1, y1], 60);
    L.stroke(poly(pts, false), 1.6, { albedo: '#3a2c1c', height: z, kind: 'cloth', rough: 0.9 });
    const f = getFields();
    for (let k = 0; k < n; k += 1) {
      const i0 = Math.round((k + 0.15) / n * 60), i1 = Math.min(60, Math.round((k + 0.85) / n * 60)); const [ax, ay] = pts[i0], [bx, by] = pts[i1];
      const mx = (ax + bx) / 2, my = (ay + by) / 2 + 26; const c0 = hex(cols[k % cols.length]);
      L.paint(poly([[ax, ay], [bx, by], [mx, my]]), (x, y, px) => { const t = clamp01((y - Math.min(ay, by)) / 26); px.rgb = c0.map((v) => v * (0.72 + 0.3 * (1 - t) + 0.12 * sample(f.mid, x * 2, y * 2))); px.h = z + 0.04 + 0.03 * Math.sin(Math.PI * t); px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.9; });
    }
  }

  /* ---------- marché ambulant : pièces de roulotte ---------- */
  const IRON = { kind: 'iron', metal: 0.8, rough: 0.55 };
  // Deux roues dans les coins bas, entièrement dans le canevas.
  function wagonWheels(L, R, y, z, sides = [-1, 1], inset = 6) {
    for (const m of sides) Pr.wheel(L, C + m * (C - R - inset), y, R, { z, phase: 0.13 * m, mud: 0.9 });
  }
  // Tuyau de poêle qui sort de derrière le cadre, chapeau conique.
  function stovepipe(L, x, yBase, yTop, z) {
    L.tube(poly([[x, yBase], [x, yTop + 14]], false), 22, { albedo: '#302b28', base: z, peak: z + 0.18, ...IRON });
    for (const yy of [yTop + 16, yTop + 44, lerp(yBase, yTop, 0.5)]) L.tube(poly([[x - 13, yy], [x + 13, yy]], false), 6, { albedo: '#4a423c', base: z + 0.14, peak: z + 0.24, ...IRON });
    for (const d of [-1, 1]) L.stroke(poly([[x + d * 7, yTop + 14], [x + d * 9, yTop + 4]], false), 2.4, { albedo: '#2a2624', height: z + 0.2, ...IRON });
    Pr.pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(x - 26, yTop + 6); ctx.quadraticCurveTo(x - 10, yTop - 2, x, yTop - 9); ctx.quadraticCurveTo(x + 10, yTop - 2, x + 26, yTop + 6); ctx.quadraticCurveTo(x, yTop + 2, x - 26, yTop + 6); ctx.closePath(); }, { base: z + 0.16, lift: 0.1, radius: 7, ...IRON, color: (gx, gy, t) => [70 * (0.55 + 0.55 * t), 64 * (0.55 + 0.55 * t), 60 * (0.55 + 0.55 * t)] });
  }
  function smoke(ctx, x, y) {
    ctx.save();
    [[2, 2, 10, 0.55], [-8, -2, 13, 0.46], [-21, -4, 15, 0.38], [-37, -3, 18, 0.3], [-56, 1, 20, 0.21], [-78, 6, 22, 0.12]].forEach(([dx, dy, r, a]) => {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); g.addColorStop(0, `rgba(196,188,178,${a})`); g.addColorStop(0.6, `rgba(170,162,152,${a * 0.5})`); g.addColorStop(1, 'rgba(160,152,142,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  // Poêle et louche suspendues à des crochets.
  function hook(L, x, y, z) {
    rivet(L, x, y - 10, 3, { base: z + 0.08, peak: z + 0.16 });
    L.taper(bezierPts([x, y - 10], [x + 7, y - 8], [x + 6, y + 1], [x, y + 3], 12), [2.6, 2], { albedo: '#2a2624', base: z + 0.12, peak: z + 0.2, ...IRON });
  }
  function hangingPan(L, x, y, r, z) {
    hook(L, x, y, z);
    Pr.pan(L, x, y + r + 50, r, -Math.PI / 2, z);
  }
  function ladle(L, x, y, len, z) {
    hook(L, x, y, z);
    L.torus(x, y + 5, 4, 4, 0, 0.45, { albedo: '#3a3431', base: z + 0.06, peak: z + 0.14, ...IRON });
    L.taper([[x, y + 9], [x, y + len]], [4, 3], { albedo: '#4a4440', base: z + 0.04, peak: z + 0.14, ...IRON });
    Pr.pillow(L, circle(12, x, y + len + 9), { base: z + 0.02, lift: 0.14, radius: 8, ...IRON, color: (gx, gy, t) => [74 * (0.6 + 0.5 * t), 70 * (0.6 + 0.5 * t), 66 * (0.6 + 0.5 * t)] });
  }
  // Guirlande de fanions tendue devant le cadre.
  function garland(L, x0, y0, x1, y1, sag, n, z, len = 22) {
    const cols = ['#b8321e', '#d9b45e', '#2a5a9e', '#2e7a3a', '#e6d8b8'];
    const N = 80; const f = getFields();
    const pts = bezierPts([x0, y0], [lerp(x0, x1, 0.3), Math.max(y0, y1) + sag], [lerp(x0, x1, 0.7), Math.max(y0, y1) + sag], [x1, y1], N);
    for (let k = 0; k < n; k += 1) {
      const [ax, ay] = pts[Math.round(((k + 0.08) / n) * N)], [bx, by] = pts[Math.min(N, Math.round(((k + 0.92) / n) * N))];
      const ang = Math.atan2(by - ay, bx - ax) + Math.PI / 2; const ox = (ax + bx) / 2, oy = (ay + by) / 2;
      const c0 = hex(cols[k % cols.length]);
      L.paint(poly([[ax, ay], [bx, by], [ox + Math.cos(ang) * len, oy + Math.sin(ang) * len]]), (x, y, px) => {
        const t = clamp01(((x - ox) * Math.cos(ang) + (y - oy) * Math.sin(ang)) / len);
        px.rgb = c0.map((v) => v * (0.66 + 0.4 * (1 - t)) * (0.88 + 0.2 * sample(f.mid, x * 2, y * 2))); px.h = z + 0.02 + 0.05 * (1 - t); px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.88;
      });
    }
    L.stroke(poly(pts, false), 2, { albedo: '#3a2c1c', height: z + 0.08, kind: 'cloth', rough: 0.9 });
  }
  // Marchepied de roulotte : limons et trois marches.
  function wagonSteps(L, cx, y0, y1, w0, w1, n, z, dark = false) {
    const f = getFields();
    L.fill(poly([[cx - w0 / 2, y0], [cx + w0 / 2, y0], [cx + w1 / 2, y1], [cx - w1 / 2, y1]]), { albedo: '#1c130c', height: z, kind: 'wood', rough: 0.8, op: 'source-over' });
    for (let k = 0; k < n; k += 1) {
      const t = (k + 0.7) / n; const y = lerp(y0, y1, t); const w = lerp(w0, w1, t) + 6;
      Pr.pillow(L, Pr.roundRectAt(cx, y, w, 15, 0, 3), { base: z + 0.08, lift: 0.08, radius: 5, kind: 'wood', rough: 0.6, color: (gx, gy, tt) => { const g = sample(f.mid, gx * 0.3 + k * 40, gy * 3); const s = (0.62 + 0.4 * g) * (0.55 + 0.5 * tt); return dark ? [80 * s, 70 * s, 60 * s] : [110 * s, 74 * s, 44 * s]; } });
    }
    for (const m of [-1, 1]) L.taper([[cx + m * w0 / 2, y0 - 4], [cx + m * w1 / 2, y1]], [11, 13], { albedo: dark ? '#3a322a' : '#4e3220', base: z + 0.12, peak: z + 0.22, kind: 'wood', rough: 0.62 });
  }

  /* ---------- marché ambulant étrange ---------- */
  const ST = root.Strange;
  const WEIRD = { paint: '#3a2238', band: '#161e24', wood: [74, 64, 56], trim: '#7a6a44', bone: '#cdbf9c', light: [0.5, 1.25, 0.72] };
  // Bois grisé sous une peinture aubergine très écaillée, crasse.
  function weatheredPaint(L, mask, color, o = {}) {
    const f = getFields(); const c0 = hex(color); const at = o.chipAt ?? 0.62;
    L.paint(mask, (x, y, px) => {
      const n = sample(f.mid, x * 1.5, y * 1.5), hi = sample(f.high, x * 1.2, y * 1.2), g = sample(f.mid, x * 0.4 + 90, y * 4);
      const chip = smooth(at, at + 0.06, n * 0.7 + hi * 0.4);
      const wood = WEIRD.wood.map((v) => v * (0.62 + 0.45 * g));
      const grime = smooth(0.55, 0.8, sample(f.low, x * 2.5, y * 2.5)) * 0.35;
      px.rgb = c0.map((v, k) => (v * (0.8 + 0.3 * n) + (wood[k] - v * (0.8 + 0.3 * n)) * chip) * (1 - grime));
      px.h = (o.height ? o.height(x, y) : 0.4) - 0.014 * chip; px.hMode = 'set';
      px.kind = chip > 0.5 ? 'wood' : 'paint'; px.metal = 0; px.rough = chip > 0.5 ? 0.8 : 0.5;
    }, { rule: o.rule });
  }
  function darkWheel(L, x, y, R, z, o = {}) { Pr.wheel(L, x, y, R, { z, mud: 1, wood: '#4a3e34', spokeCol: '#382e26', ...o }); }
  function darkWheels(L, R, y, z, inset = 6) { for (const m of [-1, 1]) darkWheel(L, C + m * (C - R - inset), y, R, z, { phase: 0.13 * m, skip: m < 0 ? [3] : [] }); }
  // Symboles peints à l'os le long d'un anneau.
  function symbolRing(L, r, n, z, o = {}) {
    const seq = o.seq || ['eye', 'moon', 'star', 'moon'];
    for (let k = 0; k < n; k += 1) {
      const a = (k / n) * TAU + (o.phase || 0); if (o.skip && o.skip(a)) continue;
      const [x, y] = P(r, a); const type = seq[k % seq.length];
      ST.paintSymbol(L, type, x, y, o.s || 1, type === 'star' ? 0 : a + Math.PI / 2, z, o.col || WEIRD.bone);
    }
  }
  // Tuyau de poêle tordu, chapeau de travers.
  function crookedPipe(L, x, yBase, z) {
    const pts = [[x, yBase], [x, yBase - 52], [x + 4, yBase - 64], [x + 13, yBase - 76], [x + 17, yBase - 92]];
    L.tube(smoothPath(pts, false), 20, { albedo: '#2c2824', base: z, peak: z + 0.18, ...IRON });
    for (const yy of [yBase - 18, yBase - 46]) L.tube(poly([[x - 12, yy], [x + 12, yy]], false), 6, { albedo: '#40382f', base: z + 0.14, peak: z + 0.22, ...IRON });
    const [tx, ty] = pts[4];
    Pr.pillow(L, (ctx) => { ctx.translate(tx, ty - 8); ctx.rotate(0.28); ctx.beginPath(); ctx.moveTo(-25, 6); ctx.quadraticCurveTo(-10, -2, 0, -10); ctx.quadraticCurveTo(10, -2, 25, 6); ctx.quadraticCurveTo(0, 2, -25, 6); ctx.closePath(); }, { base: z + 0.16, lift: 0.1, radius: 7, ...IRON, color: (gx, gy, t) => [64 * (0.55 + 0.55 * t), 58 * (0.55 + 0.55 * t), 54 * (0.55 + 0.55 * t)] });
    return [tx + 4, ty - 16];
  }
  function greenSmoke(ctx, x, y) {
    ctx.save();
    [[2, 2, 10, 0.5], [-6, -4, 13, 0.42], [-17, -8, 15, 0.34], [-31, -10, 18, 0.26], [-48, -9, 20, 0.18], [-68, -5, 22, 0.1]].forEach(([dx, dy, r, a]) => {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); g.addColorStop(0, `rgba(170,206,174,${a * 1.3})`); g.addColorStop(0.6, `rgba(120,150,126,${a * 0.5})`); g.addColorStop(1, 'rgba(110,140,116,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }

  /* ---------- marchandises par boutique (sur un appui ou un comptoir) ---------- */
  const DISPLAY = {
    market(L, y, z) {
      Pr.basket(L, 150, y - 23, 116, 46, z);
      for (let k = 0; k < 6; k += 1) Pr.apple(L, 112 + k * 15, y - 48 - (k % 2) * 8, 12, { z: z + 0.1 + k * 0.01, color: ['#6e1a12', '#7a2a12', '#566422'][k % 3], blush: '#b07a36' });
      Pr.grapes(L, 236, y - 34, 0.9, z + 0.02);
      Pr.bread(L, 306, y - 16, 92, 32, -0.08, z + 0.02);
      Pr.cheese(L, 396, y - 16, 0.72, z);
    },
    bookshop(L, y, z) {
      [[102, 18, -0.02, '#3e1512', 'spine'], [90, 16, 0.04, '#1e2a44', 'pages'], [96, 18, -0.05, '#27321c', 'spine']].forEach(([w, t, rot, col, face], k) => Pr.book(L, 152 + k * 3, y - 9 - k * 16.5, w, t, rot, { color: col, z: z + k * 0.06, face }));
      Pr.candle(L, 154, y - 52, 30, z + 0.22, { w: 12, halo: 54, holder: false });
      Pr.scroll(L, 300, y - 12, 96, 0.05, z);
      Pr.inkwell(L, 396, y, 0.8, z);
    },
    antique(L, y, z) {
      Pr.hourglass(L, 146, y - 31, 0.8, z);
      Pr.coinPile(L, 206, y - 6, 5, 30, z + 0.02);
      Pr.casket(L, 278, y - 9, 0.85, z);
      Pr.amphora(L, 398, y, 0.8, z);
    },
    armory(L, y, z) {
      Pr.greatHelm(L, 146, y - 26, 0.75, z);
      Pr.sword(L, 196, y - 11, 404, y - 16, z, { width: 12, grip: 34 });
      Pr.heaterShield(L, 408, y - 36, 0.55, 0.12, z + 0.08, { c1: '#4a1214', c2: '#a88a48' });
    },
    'black-market'(L, y, z) {
      Pr.pouch(L, 146, y - 25, 0.95, z);
      Pr.coinPile(L, 232, y - 8, 10, 64, z + 0.02);
      Pr.crown(L, 348, y - 8, 0.75, -0.08, z);
      Pr.dagger(L, 250, y - 12, 404, y - 5, z + 0.1);
    },
    alchemist(L, y, z) {
      Pr.flask(L, 136, y, 0.95, { z, liquid: '#1e5aa8', glow: true, type: 'round', level: 0.6 });
      Pr.flask(L, 188, y, 0.8, { z: z + 0.02, liquid: '#8a1c14', glow: true, type: 'tall', level: 0.5, label: true });
      Pr.crystals(L, 300, y - 8, 0.75, z, '#4e2a78');
      Pr.flask(L, 396, y, 0.8, { z: z + 0.02, liquid: '#b08a2a', glow: true, type: 'cone', level: 0.5 });
    },
    tavern(L, y, z) {
      Pr.tankard(L, 142, y, 0.95, z);
      Pr.tankard(L, 202, y, 0.82, z + 0.02);
      Pr.wineBottle(L, 300, y, 0.78, 0, z);
      Pr.barrel(L, 388, y - 28, 96, 56, z);
    },
    traveling(L, y, z) {
      ST.crystalBall(L, 150, y, 25, z);
      ST.eyeJar(L, 228, y, 0.82, z);
      ST.tarotFan(L, 312, y - 2, 0.82, 0.1, z);
      ST.skullCandle(L, 396, y, 0.8, z);
    },
  };

  /* ---------- A — Vitrine ---------- */
  function vitrine(L, shop) {
    const S = SHOPS[shop]; const trav = shop === 'traveling'; const r = rng(shop.length * 13);
    let smokeAt = null;
    if (trav) { darkWheels(L, 62, 440, 0.22); smokeAt = crookedPipe(L, 448, 134, 0.3); }
    (trav ? weatheredPaint : paintedWood)(L, ringPath(210, 248), trav ? WEIRD.paint : S.paint, { height: (x, y) => { const u = (Math.hypot(x - C, y - C) - 210) / 38; return 0.34 + 0.16 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)); } });
    L.engrave(circle(229), 1.4, 0.3); L.engrave(circle(244), 1, 0.2);
    if (!trav) {
      L.fill(ringPath(170, 212), { albedo: '#2c2a28', height: 0.42, kind: 'iron', metal: 0.5, rough: 0.6, op: 'source-over' });
      const [gr, gg, gb] = S.glass;
      for (const [rr, n, off] of [[181, 38, 0], [201, 44, 0.5]]) for (let k = 0; k < n; k += 1) {
        const a = ((k + off) / n) * TAU; const [x, y] = P(rr, a); const rad = rr === 181 ? 9.4 : 9.8; const lit = 0.55 + 0.45 * r();
        L.paint(circle(rad, x, y), (gx, gy, px) => {
          const d = Math.hypot(gx - x, gy - y) / rad; const ripple = Math.sin(d * 9) * 0.5 + 0.5; const boss = Math.exp(-((d / 0.28) ** 2)); const k2 = (0.35 + 0.25 * ripple + 0.4 * boss) * lit;
          px.rgb = [gr * k2, gg * k2, gb * k2]; px.h = 0.36 + 0.03 * ripple + 0.05 * boss; px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.06;
          px.e = [gr * 0.3 * lit * (0.4 + 0.6 * boss), gg * 0.3 * lit * (0.4 + 0.6 * boss), gb * 0.3 * lit * (0.4 + 0.6 * boss)];
        });
      }
    } else {
      // Roulotte étrange : bandeau d'encre peint d'yeux, de lunes et d'étoiles, rideaux mités.
      weatheredPaint(L, ringPath(170, 212), WEIRD.band, { height: () => 0.42, chipAt: 0.62 });
      symbolRing(L, 191, 12, 0.44, { phase: -Math.PI / 2, s: 0.9 });
      for (let k = 0; k < 40; k += 1) { const [x, y] = P(207, (k / 40) * TAU); L.dome(x, y, 2, { albedo: WEIRD.trim, base: 0.44, peak: 0.5, kind: 'bronze', metal: 0.8, rough: 0.55 }); }
      const f = getFields();
      for (const m of [-1, 1]) {
        const tx = C + m * 134, ty = C + 44;
        const inner = (ctx) => { ctx.quadraticCurveTo(C + m * 112, C + 104, tx, ty); ctx.quadraticCurveTo(C + m * 106, C - 64, C + m * 61.6, C - 158.5); };
        const path = (ctx) => { ctx.beginPath(); if (m < 0) ctx.arc(C, C, 170, Math.PI + 1.2, Math.PI - 1.0, true); else ctx.arc(C, C, 170, -1.2, 1.0, false); inner(ctx); ctx.closePath(); };
        const fold = (x, y) => Math.sin(Math.atan2(y - ty, (x - tx) * m) * 16 + sample(f.mid, x * 0.8, y * 0.8) * 2.5);
        Pr.pillow(L, path, { base: 0.4, lift: 0.14, radius: 14, kind: 'cloth', rough: 0.95, color: (x, y, t) => { const k = (0.3 + 0.7 * (0.5 + 0.5 * fold(x, y)) ** 1.5) * (0.62 + 0.38 * t); return [104 * k, 66 * k, 98 * k]; }, bump: (x, y) => 0.035 * fold(x, y),
          extra: (x, y, t, px) => { const hole = sample(f.high, x * 1.1 + 50, y * 1.1) > 0.88 && sample(f.mid, x * 2, y * 2) > 0.42; const shred = smooth(ty + 30, ty + 96, y) * sample(f.high, x * 0.7 + 20, y * 0.12); if (hole || shred > 0.42) px.skip = true; } });
        L.tube((ctx) => { ctx.beginPath(); ctx.moveTo(C + m * 168, ty - 8); ctx.quadraticCurveTo(C + m * 150, ty + 10, tx - m * 2, ty + 2); }, 5, { albedo: '#3a3028', base: 0.56, peak: 0.66, kind: 'cloth', rough: 0.9 });
        ST.bone(L, tx - 5, ty + 10, tx + 4, ty + 26, 5, 0.62);
      }
    }
    L.fill(ringPath(166, 172), { albedo: '#2c2a28', height: ringStyle(C, C, 166, 172, 0.38, 0.5, 'round'), kind: 'iron', metal: 0.6, rough: 0.5, op: 'source-over' });
    L.fill((ctx) => { ctx.beginPath(); ctx.moveTo(78, 450); ctx.lineTo(434, 450); ctx.lineTo(446, 462); ctx.lineTo(66, 462); ctx.closePath(); }, { albedo: trav ? '#3a3028' : '#5a3a22', height: 0.56, kind: 'wood', rough: 0.6, op: 'source-over' });
    Pr.book(L, 256, 474, 392, 24, 0, { color: trav ? '#2a221c' : '#3a2618', z: 0.5, face: 'spine' });
    L.stroke(poly([[66, 462], [446, 462]], false), 2, { albedo: '#2a1a10', height: 0.58, kind: 'wood', rough: 0.7 });
    DISPLAY[shop](L, 450, 0.6);
    if (trav) {
      L.taper(bezierPts([100, 66], [88, 60], [78, 58], [68, 60], 12), [5, 4], { albedo: '#2c2824', base: 0.62, peak: 0.76, ...IRON });
      rivet(L, 100, 66, 3.6, { base: 0.62, peak: 0.74 });
      ST.birdcage(L, 68, 58, 1, 0.62);
    }
    const name = S.name;
    return {
      opening: 166,
      front(ctx) {
        if (smokeAt) greenSmoke(ctx, smokeAt[0], smokeAt[1]);
        const R = 140; const size = name.length > 11 ? 24 : name.length > 9 ? 29 : 33;
        ctx.save(); ctx.font = FONT(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const widths = [...name].map((ch) => ctx.measureText(ch).width + 4); const total = widths.reduce((s, w) => s + w, 0) / R;
        let a = -Math.PI / 2 - total / 2;
        [...name].forEach((ch, k) => {
          const wa = widths[k] / R; const mid = a + wa / 2;
          ctx.save(); ctx.translate(C + Math.cos(mid) * R, C + Math.sin(mid) * R); ctx.rotate(mid + Math.PI / 2);
          ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(ch, 2, 3);
          ctx.lineWidth = 3; ctx.strokeStyle = '#1a0e06'; ctx.strokeText(ch, 0, 0);
          const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2); if (trav) { g.addColorStop(0, '#f2e8cc'); g.addColorStop(0.5, '#c8b890'); g.addColorStop(1, '#8e8062'); } else { g.addColorStop(0, '#fff0b8'); g.addColorStop(0.45, '#d9ae52'); g.addColorStop(0.55, '#a8782c'); g.addColorStop(1, '#e8c26a'); }
          ctx.fillStyle = g; ctx.fillText(ch, 0, 0);
          ctx.restore(); a += wa;
        });
        ctx.beginPath(); ctx.arc(C, C, 166, 0, TAU); ctx.clip();
        ctx.globalCompositeOperation = 'screen';
        const g2 = ctx.createLinearGradient(C - 170, C - 170, C + 60, C + 60); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.42, 'rgba(255,245,230,0)'); g2.addColorStop(0.47, 'rgba(255,245,230,0.15)'); g2.addColorStop(0.5, 'rgba(255,245,230,0.05)'); g2.addColorStop(0.55, 'rgba(255,245,230,0.11)'); g2.addColorStop(0.6, 'rgba(255,255,255,0)');
        ctx.fillStyle = g2; ctx.fillRect(0, 0, 512, 512);
        ctx.restore();
      },
    };
  }

  /* ---------- B — Enseigne ---------- */
  function enseigne(L, shop) {
    const S = SHOPS[shop]; const trav = shop === 'traveling'; const iron = { kind: 'iron', metal: 0.85, rough: 0.5 };
    if (!trav) {
      L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(4, 4, 26, 118, 4); }, { albedo: '#2c2826', height: 0.5, ...iron, op: 'source-over' });
      for (const y of [18, 62, 106]) rivet(L, 17, y, 4, { base: 0.52, peak: 0.66 });
      L.taper([[20, 28], [490, 28]], [10, 8], { albedo: '#2c2826', base: 0.56, peak: 0.76, ...iron });
      L.dome(492, 28, 7, { albedo: '#2c2826', base: 0.6, peak: 0.8, ...iron });
      L.taper(bezierPts([24, 110], [60, 90], [120, 40], [200, 30], 30), [7, 5], { albedo: '#2c2826', base: 0.54, peak: 0.72, ...iron });
      L.taper(spiralPts(92, 70, 18, 3, Math.PI * 0.2, 1.5, 40), [4.4, 2], { albedo: '#2c2826', base: 0.54, peak: 0.7, ...iron });
    } else {
      // Mât de bois gris, croissant de lune en laiton, roue brisée.
      const f = getFields();
      const grey = (g) => WEIRD.wood.map((v) => v * (0.62 + 0.45 * g));
      L.paint((ctx) => { ctx.beginPath(); ctx.rect(14, 22, 22, 490); }, (x, y, px) => { const u = (x - 14) / 22; const g = sample(f.mid, x * 3, y * 0.2); px.rgb = grey(g).map((v) => v * (0.6 + 0.4 * Math.sin(Math.PI * u))); px.h = 0.46 + 0.14 * Math.sin(Math.PI * u); px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.7; });
      L.paint((ctx) => { ctx.beginPath(); ctx.rect(14, 18, 486, 18); }, (x, y, px) => { const u = (y - 18) / 18; const g = sample(f.mid, x * 0.2, y * 3); px.rgb = grey(g).map((v) => v * (0.6 + 0.4 * Math.sin(Math.PI * u))); px.h = 0.5 + 0.14 * Math.sin(Math.PI * u); px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.7; });
      L.taper([[36, 120], [150, 36]], [8, 7], { albedo: '#4a4038', base: 0.5, peak: 0.66, kind: 'wood', rough: 0.7 });
      for (const [x, y] of [[25, 27], [150, 27], [490, 27]]) rivet(L, x, y, 3.4, { base: 0.62, peak: 0.72 });
      L.paint(circle(13, 25, 11), (x, y, px) => { if (Math.hypot(x - 31, y - 7) < 10.5) { px.skip = true; return; } const d = Math.hypot(x - 25, y - 11) / 13; px.rgb = ST.shade([128, 108, 66], 0.6 + 0.5 * Math.sqrt(Math.max(0, 1 - d * d))); px.h = 0.64 + 0.12 * Math.sqrt(Math.max(0, 1 - d * d)); px.hMode = 'set'; px.kind = 'bronze'; px.metal = 0.85; px.rough = 0.45; });
      darkWheel(L, 72, 442, 62, 0.3, { phase: 0.2, skip: [5] });
    }
    for (const m of [-1, 1]) chain(L, [[C + m * 118, 34], [C + m * 118, 84]], 10, { albedo: '#3a3431' });
    (trav ? weatheredPaint : paintedWood)(L, ringPath(168, 238), trav ? WEIRD.paint : S.paint, { height: (x, y) => 0.4 + 0.08 * Math.sqrt(Math.max(0, 1 - ((2 * (Math.hypot(x - C, y - C) - 168) / 70) - 1) ** 2)) });
    for (let k = -3; k <= 3; k += 1) L.engrave(poly([[C + k * 60, C - 240], [C + k * 60, C + 240]], false), 1.4, 0.25, { clip: ringPath(168, 238) });
    const trim = trav ? WEIRD.trim : S.accent === '#9a1e18' || S.accent === '#5a3a6e' || S.accent === '#d8c8a2' ? '#b8923e' : S.accent;
    L.stroke(circle(180), 2.2, { albedo: trim, height: 0.5, kind: 'gold', metal: 0.9, rough: 0.4 });
    L.stroke(circle(226), 2.2, { albedo: trim, height: 0.5, kind: 'gold', metal: 0.9, rough: 0.4 });
    if (trav) symbolRing(L, 203, 12, 0.5, { phase: Math.PI / 12, skip: (a) => Math.sin(a) > 0.5 || Math.sin(a) < -0.75 });
    L.tube(circle(240), 9, { albedo: '#2e2a28', base: 0.44, peak: 0.66, ...iron });
    for (let k = 0; k < 12; k += 1) rivet(L, ...P(240, (k / 12) * TAU + 0.26), 2.6, { base: 0.62, peak: 0.72 });
    for (const m of [-1, 1]) L.torus(C + m * 118, 90, 8, 8, 0, 0.4, { albedo: '#3a3431', base: 0.6, peak: 0.78, ...iron });
    const [ex, ey] = P(204, -Math.PI / 2);
    if (trav) ST.charmString(L, 36, 34, 452, 36, 34, ['rag', 'bone', 'key', 'rag', 'skull', 'feather', 'vial', 'rag', 'bell', 'bone', 'rag', 'key', 'feather', 'rag'], 0.66, { scale: 1.1 });
    else L.stroke((ctx) => symbols[shop](ctx, ex, ey, 34), 4.2, { albedo: '#c9a24e', height: 0.5, kind: 'gold', metal: 0.9, rough: 0.4 });
    banner(L, 104, 408, 440, 18, 44, S.name, { color: trav ? '#aa9a7a' : '#d6c8a2', dark: trav ? '#5e5442' : '#8a7a5a', ink: trav ? '#1a1210' : '#2a1a10', trim: trav ? '#5e5238' : undefined, size: S.name.length > 11 ? 21 : S.name.length > 9 ? 24 : 28, spacing: S.name.length > 11 ? 2 : 3 });
    const lx = 470, ly = 110;
    L.stroke(poly([[lx, 36], [lx, ly - 30]], false), 2, { albedo: '#2c2826', height: 0.7, ...iron });
    if (trav) { ST.greenLantern(L, lx, ly, 0.9, 0.62); ST.crow(L, lx + 2, ly - 42, 0.86, true, 0.8); }
    else Pr.lantern(L, lx, ly, 0.9, 0.62);
    return { opening: 166, lights: [[lx, ly - 10, 60, trav ? WEIRD.light : [1.5, 0.95, 0.42]]] };
  }

  /* ---------- C — Auvent ---------- */
  function auvent(L, shop) {
    const S = SHOPS[shop]; const f = getFields(); const trav = shop === 'traveling'; const tattered = S.tattered;
    const cols = S.stripes.map(hex);
    L.fill(ringPath(170, 232), { albedo: trav ? '#3e342c' : '#5a3a22', height: ringStyle(C, C, 170, 232, 0.3, 0.44, 'round'), kind: 'wood', rough: 0.62 });
    for (let k = 0; k < 18; k += 1) L.engrave(poly([P(172, k * TAU / 18), P(230, k * TAU / 18)], false), 1.2, 0.25);
    const a0 = Math.PI * 1.1, a1 = Math.PI * 1.9, rIn = 196, rOut = 258, n = 14;
    const holes = tattered ? [[0.24, 0.5, 7], [0.58, 0.4, 9], [0.84, 0.65, 6]] : trav ? [[0.08, 0.6, 5], [0.19, 0.3, 7], [0.33, 0.72, 5], [0.46, 0.45, 8], [0.61, 0.25, 5], [0.7, 0.66, 7], [0.86, 0.38, 6], [0.93, 0.7, 4]] : [];
    const patchPal = [[74, 58, 70], [92, 88, 80], [132, 120, 94], [52, 68, 72], [104, 84, 52], [62, 42, 54]];
    L.paint((ctx) => { ctx.beginPath(); ctx.arc(C, C, rOut, a0, a1); ctx.arc(C, C, rIn, a1, a0, true); ctx.closePath(); }, (x, y, px) => {
      let a = Math.atan2(y - C, x - C); if (a < 0) a += TAU; const rr = Math.hypot(x - C, y - C);
      const t = clamp01((a - a0) / (a1 - a0)); const k = Math.min(n - 1, Math.max(0, Math.floor(t * n))); const ft = t * n - k; const u = clamp01((rr - rIn) / (rOut - rIn));
      for (const [ht, hu, hr] of holes) if (Math.hypot((t - ht) * 560, (u - hu) * 62) < hr * (0.7 + 0.6 * sample(f.high, x * 2, y * 2))) { px.skip = true; return; }
      const nn = sample(f.mid, x * 1.2, y * 1.2); let c; let hh = 0.5 + 0.2 * u;
      if (trav) {
        const shift = u > 0.5 ? 0.5 : 0; const pi = Math.floor(t * 9 + shift); const pj = u > 0.5 ? 1 : 0; const pr = rng(pi * 7 + pj * 31)();
        c = patchPal[Math.floor(pr * patchPal.length)];
        const pt = t * 9 + shift - pi; const edge = Math.min(pt, 1 - pt) * 50 < 2 || Math.abs(u - 0.5) * 60 < 1.2;
        if (edge) { c = c.map((v) => v * 0.55); hh -= 0.01; }
        if ([0.25, 0.5, 0.75].some((rt) => Math.abs(t - rt) * 400 < 3.5)) { c = [70, 48, 30]; hh += 0.03; }
        c = c.map((v) => v * (0.78 + 0.3 * nn));
      } else {
        c = cols[k % 2].map((v) => v * (0.78 + 0.28 * Math.sin(Math.PI * ft)) * (0.8 + 0.25 * u)); hh += 0.04 * Math.sin(Math.PI * ft);
      }
      const stain = smooth(0.6, 0.76, nn) * 0.35;
      px.rgb = c.map((v) => v * (1 - stain)); px.h = hh; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.92;
    });
    for (let k = 0; k < n; k += 1) {
      const aa0 = a0 + (a1 - a0) * (k / n), aa1 = a0 + (a1 - a0) * ((k + 1) / n), am = (aa0 + aa1) / 2;
      const c = trav ? patchPal[k % patchPal.length] : cols[k % 2]; const drop = tattered || trav ? 10 + 10 * rng(k + 4)() : 16;
      L.fill((ctx) => { ctx.beginPath(); ctx.moveTo(...P(rIn + 1, aa0)); ctx.quadraticCurveTo(...P(rIn - drop * 1.9, am), ...P(rIn + 1, aa1)); ctx.closePath(); }, { albedo: `rgb(${c[0] * 0.82 | 0},${c[1] * 0.82 | 0},${c[2] * 0.82 | 0})`, height: 0.66, kind: 'cloth', rough: 0.92, op: 'source-over' });
    }
    L.stroke((ctx) => { ctx.beginPath(); ctx.arc(C, C, rIn + 2, a0, a1); }, 3.4, { albedo: '#2a1f14', height: 0.72, kind: 'leather', rough: 0.7 });
    L.stroke((ctx) => { ctx.beginPath(); ctx.arc(C, C, rOut - 2, a0, a1); }, 3.4, { albedo: '#2a1f14', height: 0.72, kind: 'leather', rough: 0.7 });
    for (const a of [a0, a1]) L.dome(...P(rOut - 4, a), 6, { albedo: '#8a6a34', base: 0.7, peak: 0.84, kind: 'gold', metal: 0.9, rough: 0.4 });
    if (trav) { ST.birdcage(L, 36, 178, 0.72, 0.7); Pr.herbs(L, 482, 186, 58, 0.7); ST.bone(L, 462, 214, 470, 236, 5, 0.74); }
    L.fill(poly([[46, 404], [466, 404], [486, 420], [26, 420]]), { albedo: trav ? '#3e342a' : '#6a4a2c', height: 0.6, kind: 'wood', rough: 0.55, op: 'source-over' });
    root.StallLab.planks(L, 26, 420, 460, 58, 'h', 2, { albedo: trav ? '#2e2620' : '#4a3020', base: 0.52, lift: 0.06, seed: 7, nails: [0.04, 0.3, 0.7, 0.96] });
    L.stroke(poly([[26, 420], [486, 420]], false), 2.4, { albedo: '#2a1a10', height: 0.62, kind: 'wood', rough: 0.7 });
    DISPLAY[shop](L, 408, 0.62);
    if (trav) { ST.crow(L, 88, 404, 0.8, false, 0.7); for (const x of [58, 454]) darkWheel(L, x, 460, 50, 0.64, { phase: x * 0.01, skip: x < 100 ? [7] : [] }); }
    const tx = trav ? 356 : 432, ty = 458;
    L.stroke(poly([[tx - 8, 422], [tx, ty - 18]], false), 1.2, { albedo: '#2a2016', height: 0.7, kind: 'cloth', rough: 0.9 });
    L.fill((ctx) => { ctx.translate(tx, ty); ctx.rotate(0.18); ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(16, -18); ctx.lineTo(16, 18); ctx.lineTo(0, 26); ctx.lineTo(-16, 18); ctx.closePath(); }, { albedo: '#d2c4a0', height: 0.72, kind: 'cloth', rough: 0.9, op: 'source-over' });
    const price = { market: '3', bookshop: '12', antique: '40', armory: '25', 'black-market': '?', alchemist: '8', tavern: '2', traveling: '13' }[shop];
    L.text(price, tx, ty - 2, 0.18, { font: FONT(price.length > 1 ? 15 : 18), albedo: '#3a1a10', depth: 0.1 });
    L.text('PO', tx + 1, ty + 13, 0.18, { font: FONT(10), albedo: '#3a1a10', depth: 0.1 });
    L.engraveFill(circle(2.4, tx - 2, ty - 13), 0.5);
    return { opening: 168, lights: trav ? [[150, 400, 60, [0.6, 0.45, 1.1]], [396, 380, 50, WEIRD.light]] : [] };
  }

  /* ---------- D — Porte ---------- */
  function porte(L, shop) {
    const S = SHOPS[shop]; const trav = shop === 'traveling'; const f = getFields(); const iron = { kind: 'iron', metal: 0.85, rough: 0.5 };
    if (trav) darkWheels(L, 62, 440, 0.22);
    const doorPaint = hex(trav ? WEIRD.paint : S.paint); const chipAt = trav ? 0.62 : 0.64;
    L.paint(ringPath(168, 244), (x, y, px) => {
      const a = Math.atan2(y - C, x - C), rr = Math.hypot(x - C, y - C); const k = Math.floor((a + Math.PI) / TAU * 20); const fk = (a + Math.PI) / TAU * 20 - k;
      const gap = smooth(0, 0.05, Math.min(fk, 1 - fk)); const g = sample(f.mid, a * 120 + k * 17, rr * 2.5);
      const n = sample(f.mid, x * 1.5, y * 1.5), hi = sample(f.high, x * 1.2, y * 1.2); const chip = smooth(chipAt, chipAt + 0.06, n * 0.7 + hi * 0.4);
      const wood = (trav ? WEIRD.wood : [84, 56, 34]).map((v) => v * (0.7 + 0.4 * g)); const paint = doorPaint.map((v) => v * (0.85 + 0.25 * n));
      const c = paint.map((v, i) => v + (wood[i] - v) * chip).map((v) => v * (0.4 + 0.6 * gap) * (0.9 + 0.2 * rng(k + 9)()));
      px.rgb = c; px.h = 0.34 + 0.08 * gap - 0.01 * chip; px.hMode = 'set'; px.kind = chip > 0.5 ? 'wood' : 'paint'; px.metal = 0; px.rough = chip > 0.5 ? 0.7 : 0.42;
    });
    if (trav) [[-0.34, 'star'], [-0.13, 'moon'], [0.12, 'dot'], [0.81, 'star'], [1, 'moon'], [-0.82, 'star']].forEach(([t, type]) => { const a = t * Math.PI; const [x, y] = P(206, a); ST.paintSymbol(L, type, x, y, 1.05, type === 'star' ? 0 : a + Math.PI / 2, 0.44, WEIRD.bone); });
    else for (let k = 0; k < 20; k += 1) { const a = (k / 20) * TAU + TAU / 40; for (const rr of [184, 228]) rivet(L, ...P(rr, a), 3.4, { base: 0.44, peak: 0.6, albedo: '#34302c' }); }
    L.tube(circle(170), 8, { albedo: '#2e2a28', base: 0.4, peak: 0.62, ...iron });
    L.tube(circle(242), 8, { albedo: '#2e2a28', base: 0.4, peak: 0.62, ...iron });
    for (const a of [Math.PI * 0.9, Math.PI * 1.1]) { L.taper([P(176, a), P(250, a)], [12, 8], { albedo: '#2e2a28', base: 0.46, peak: 0.66, ...iron }); L.dome(...P(250, a), 7, { albedo: '#2e2a28', base: 0.5, peak: 0.7, ...iron }); }
    L.torus(...P(206, 0.05), 14, 14, 0, 0.3, { albedo: '#34302c', base: 0.5, peak: 0.72, ...iron });
    L.dome(...P(206, -0.12), 7, { albedo: '#34302c', base: 0.5, peak: 0.7, ...iron });
    const [ex, ey] = P(206, Math.PI * 0.72);
    if (trav) ST.paintSymbol(L, 'eye', ex, ey, 1.7, Math.PI * 0.72 + Math.PI / 2, 0.46, WEIRD.bone);
    else L.stroke((ctx) => symbols[shop](ctx, ex, ey, 30), 3.6, { albedo: '#c9a24e', height: 0.46, kind: 'gold', metal: 0.9, rough: 0.4 });
    const bx = 116, by = 96;
    L.taper(bezierPts([60, 40], [74, 36], [96, 42], [bx, by - 30], 30), [5, 4], { albedo: '#2e2a28', base: 0.62, peak: 0.8, ...iron });
    L.taper(spiralPts(60, 50, 12, 2, -Math.PI / 2, -1.2, 30), [4, 2], { albedo: '#2e2a28', base: 0.6, peak: 0.76, ...iron });
    Pr.pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(bx - 6, by - 30); ctx.quadraticCurveTo(bx - 16, by - 26, bx - 18, by); ctx.quadraticCurveTo(bx - 22, by + 10, bx - 26, by + 14); ctx.lineTo(bx + 26, by + 14); ctx.quadraticCurveTo(bx + 22, by + 10, bx + 18, by); ctx.quadraticCurveTo(bx + 16, by - 26, bx + 6, by - 30); ctx.closePath(); }, { base: 0.62, lift: 0.22, radius: 14, kind: trav ? 'bronze' : 'gold', metal: 0.95, rough: trav ? 0.48 : 0.32, color: (x, y, t) => trav ? ST.mix([120 * (0.6 + 0.45 * t), 100 * (0.6 + 0.45 * t), 62 * (0.6 + 0.45 * t)], [70, 100, 84], smooth(0.5, 0.75, sample(f.mid, x * 2, y * 2)) * 0.6) : [168 * (0.6 + 0.45 * t), 128 * (0.6 + 0.45 * t), 58 * (0.6 + 0.45 * t)] });
    L.dome(bx, by + 18, 5, { albedo: '#8a6a34', base: 0.7, peak: 0.84, kind: 'gold', metal: 0.9, rough: 0.35 });
    if (trav) {
      const lx = 474, ly = 112;
      L.taper(bezierPts([424, 92], [440, 70], [458, 60], [lx + 4, 58], 20), [6, 4], { albedo: '#2e2a28', base: 0.62, peak: 0.8, ...iron });
      L.taper(spiralPts(446, 88, 10, 2, 0.4, 1.3, 30), [3.6, 2], { albedo: '#2e2a28', base: 0.6, peak: 0.76, ...iron });
      L.stroke(poly([[lx, 58], [lx, ly - 40]], false), 2, { albedo: '#2c2826', height: 0.74, ...iron });
      ST.greenLantern(L, lx, ly, 0.85, 0.66);
      ST.crow(L, 444, 72, 0.76, false, 0.84);
    }
    const px0 = 392, py0 = 420, rot = 0.14;
    rivet(L, 400, 360, 4, { base: 0.6, peak: 0.74 });
    L.stroke(poly([[400, 360], [px0 - 48, py0 - 24]], false), 1.6, { albedo: '#3a2c1c', height: 0.72, kind: 'cloth', rough: 0.9 });
    L.stroke(poly([[400, 360], [px0 + 46, py0 - 12]], false), 1.6, { albedo: '#3a2c1c', height: 0.72, kind: 'cloth', rough: 0.9 });
    (trav ? weatheredPaint : paintedWood)(L, (ctx) => { ctx.translate(px0, py0); ctx.rotate(rot); ctx.beginPath(); ctx.roundRect(-58, -26, 116, 52, 6); }, trav ? '#241a22' : '#2a3a2a', { height: () => 0.7, wear: 0.6, chipAt: 0.66 });
    L.stroke((ctx) => { ctx.translate(px0, py0); ctx.rotate(rot); ctx.beginPath(); ctx.roundRect(-52, -20, 104, 40, 4); }, 1.6, { albedo: trav ? '#9a8c6c' : '#c9b27a', height: 0.72, kind: 'paint', rough: 0.5 });
    L.text(trav ? 'ENTREZ' : 'OUVERT', px0, py0 + 1, rot, { font: FONT(22), albedo: trav ? '#d2c6a4' : '#e2d4ae', raise: 0.72 });
    const size = S.name.length > 11 ? 15 : 18; L.a.save(); L.a.font = FONT(size); const tw = L.a.measureText(S.name).width; L.a.restore();
    const pw = tw + 34; const [nx, ny] = P(206, -Math.PI / 2);
    L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(nx - pw / 2 - 6, ny - 17, pw + 12, 34, 6); }, { albedo: trav ? '#6a5a3c' : '#8a6a34', height: 0.6, kind: trav ? 'bronze' : 'gold', metal: 0.9, rough: trav ? 0.5 : 0.4, op: 'source-over' });
    L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(nx - pw / 2, ny - 12, pw, 24, 4); }, { albedo: trav ? '#241a22' : S.paint, height: 0.62, kind: 'paint', rough: 0.4, op: 'source-over' });
    L.text(S.name, nx, ny + 1, 0, trav ? { font: FONT(size), albedo: WEIRD.bone, raise: 0.64, kind: 'paint', rough: 0.5 } : { font: FONT(size), albedo: '#d9b45e', raise: 0.64, kind: 'gold', metal: 0.9, rough: 0.4 });
    for (const d of [-1, 1]) rivet(L, nx + d * (pw / 2 - 2), ny, 2.6, { base: 0.64, peak: 0.74, albedo: '#8a6a34' });
    if (trav) wagonSteps(L, C, 420, 508, 112, 150, 3, 0.62, true);
    return { opening: 164, lights: trav ? [[474, 100, 60, WEIRD.light]] : [] };
  }

  const CONCEPTS = { vitrine: { label: 'Vitrine', build: vitrine }, enseigne: { label: 'Enseigne', build: enseigne }, auvent: { label: 'Auvent', build: auvent }, porte: { label: 'Porte', build: porte } };
  const ITEMS = [];
  for (const c of Object.keys(CONCEPTS)) for (const shop of ORDER) ITEMS.push({ id: `${c}-${shop}`, concept: c, shop, name: `${CONCEPTS[c].label} — ${LABELS[shop]}`, short: LABELS[shop], build: (L) => CONCEPTS[c].build(L, shop) });

  function renderItem(it, img, po) {
    const L = createLayers();
    const spec = it.build(L) || {};
    const lights = [{ dir: [-0.45, -0.62, 0.64], color: [1.5, 1.36, 1.1] }, { dir: [0.7, 0.45, 0.5], color: [0.14, 0.16, 0.26], shadow: false }];
    for (const [x, y, z, col] of spec.lights || []) lights.push({ pos: [x, y, z], radius: 160, color: col });
    const opening = spec.opening || 166;
    const lit = render(L, { seed: it.id.length, lights, room: [0.24, 0.21, 0.17], opening, sheen: 0.35 });
    const portrait = portraitCanvas(img, opening + 4, po ? { ...po, zoom: po.fit ? 256 / (opening + 4) : po.zoom } : { focus: [0.52, 0.34] });
    return compose({ portrait, frame: lit, opening, front: spec.front });
  }

  root.ShopPack2 = { items: ITEMS, concepts: CONCEPTS, render: renderItem };
}(window));
