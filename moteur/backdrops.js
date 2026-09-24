// Labo Eraser — fonds de boutique quand aucun PNJ n'est lié au token.
// A · Intérieur : un mur, des étagères, la marchandise, une lumière.
// B · Objet phare : l'objet emblématique de la boutique, seul sous un halo.
(function (root) {
  'use strict';
  const { C, TAU, rng, createLayers, render, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { circle, poly, smoothPath, bezierPts, lerp, rivet, skull } = root.Helpers;
  const Pr = root.Props, ST = root.Strange;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));
  const FULL = (ctx) => { ctx.beginPath(); ctx.rect(0, 0, 512, 512); };
  const FONT = (size) => `700 ${size}px "FreeSerif", "Liberation Serif", serif`;
  const IRON = { kind: 'iron', metal: 0.8, rough: 0.55 };

  /* ---------- murs ---------- */
  function planksWall(L, base, o = {}) {
    const f = getFields(); const c0 = hex(base); const W = o.w || 48; const off = o.offset || 10;
    L.paint(FULL, (x, y, px) => {
      const k = Math.floor((x + off) / W); const u = ((x + off) % W) / W;
      const g = sample(f.mid, k * 37 + x * 0.25, y * 0.05 + k * 11), fine = sample(f.high, x * 1.2 + k * 9, y * 0.16);
      const gap = smooth(0, 0.04, Math.min(u, 1 - u)); const tone = 0.78 + 0.32 * rng(k + 3)();
      let c = shade(c0, (0.6 + 0.44 * g) * (0.88 + 0.2 * fine) * tone * (0.3 + 0.7 * gap));
      c = shade(c, 1 - smooth(0.5, 0.85, sample(f.low, x * 2, y * 2)) * 0.3);
      px.rgb = c; px.h = 0.06 + 0.03 * gap; px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.8;
    });
  }
  function stoneWall(L, base, o = {}) {
    const f = getFields(); const c0 = hex(base); const bh = o.h || 44, bw = o.w || 84;
    L.paint(FULL, (x, y, px) => {
      const row = Math.floor((y + 12) / bh); const off = (row % 2) * bw / 2 + 20; const col = Math.floor((x + off) / bw);
      const u = ((x + off) % bw) / bw, v = ((y + 12) % bh) / bh;
      const edge = Math.min(u * bw, (1 - u) * bw, v * bh, (1 - v) * bh) + (sample(f.high, x * 2, y * 2) - 0.5) * 3;
      const mortar = smooth(1.2, 4.5, edge); const r = rng(row * 31 + col * 7)(); const n = sample(f.mid, x * 1.6, y * 1.6), hi = sample(f.high, x * 1.4, y * 1.4);
      let c = shade(c0, (0.66 + 0.3 * r) * (0.8 + 0.3 * n) * (hi > 0.82 ? 0.9 : 1));
      c = mix(shade(c0, 0.35), c, mortar);
      c = shade(c, 1 - smooth(0.5, 0.85, sample(f.low, x * 2, y * 2)) * 0.3);
      px.rgb = c; px.h = 0.04 + 0.06 * mortar * (0.85 + 0.15 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2))); px.hMode = 'set'; px.kind = 'stone'; px.metal = 0; px.rough = 0.85;
    });
  }
  // Papier peint damassé (antiquaire).
  function damaskWall(L, base, motif) {
    const f = getFields(); const c0 = hex(base), c1 = hex(motif);
    L.paint(FULL, (x, y, px) => {
      const tx = ((x % 64) + 64) % 64 - 32, ty = ((y % 80) + 80) % 80 - 40;
      const ax = Math.abs(tx), ay = Math.abs(ty);
      const lozenge = Math.abs(ax / 32 + ay / 40 - 1) < 0.035;
      const th = Math.atan2(ty, tx), rr = Math.hypot(tx, ty);
      const fleur = rr < 11 * (0.45 + 0.55 * Math.abs(Math.cos(2 * th))) && rr > 2.5 || (Math.abs(ax - 32) < 3 && Math.abs(ay - 40) < 3) || rr < 1.8;
      const n = sample(f.mid, x * 1.4, y * 1.4);
      let c = shade(c0, 0.8 + 0.3 * n); if (lozenge || fleur) c = shade(c1, 0.8 + 0.3 * n);
      c = shade(c, 1 - smooth(0.5, 0.85, sample(f.low, x * 2, y * 2)) * 0.35);
      px.rgb = c; px.h = 0.06 + (lozenge || fleur ? 0.008 : 0); px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.8;
    });
  }
  // Tentures plissées (roulotte).
  function drapeWall(L, base, o = {}) {
    const f = getFields(); const c0 = hex(base);
    L.paint(FULL, (x, y, px) => {
      const w = sample(f.mid, x * 0.4, y * 0.05 + 9) * 2.6; const fold = Math.sin(x * 0.11 + w + Math.sin(y * 0.012) * 0.8);
      const n = sample(f.mid, x * 1.6, y * 1.6);
      let c = shade(c0, (0.42 + 0.58 * (0.5 + 0.5 * fold) ** 1.4) * (0.85 + 0.25 * n));
      c = shade(c, 1 - smooth(0.5, 0.85, sample(f.low, x * 2, y * 2)) * 0.3);
      if (o.holes && sample(f.high, x * 1.1 + 50, y * 1.1) > 0.93 && n > 0.5) c = [10, 8, 12];
      px.rgb = c; px.h = 0.08 + 0.05 * fold; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.92;
    });
  }
  // Enduit uni pour les objets phares.
  function plaster(L, base) {
    const f = getFields(); const c0 = hex(base);
    L.paint(FULL, (x, y, px) => {
      const n = sample(f.mid, x * 1.2, y * 1.2), lo = sample(f.low, x * 2, y * 2), hi = sample(f.high, x * 1.5, y * 1.5);
      px.rgb = shade(c0, (0.78 + 0.3 * n) * (1 - smooth(0.55, 0.85, lo) * 0.3) * (hi > 0.85 ? 0.92 : 1)); px.h = 0.05 + 0.025 * n; px.hMode = 'set'; px.kind = 'plain'; px.metal = 0; px.rough = 0.9;
    });
  }

  /* ---------- mobilier ---------- */
  function shelf(L, y, z, o = {}) {
    const f = getFields(); const c0 = hex(o.color || '#5a3c24'); const x0 = o.x0 ?? 0, x1 = o.x1 ?? 512;
    for (const bx of o.brackets || [96, 416]) {
      Pr.pillow(L, poly([[bx - 6, y + 12], [bx + 6, y + 12], [bx + 6, y + 58], [bx - 6, y + 24]]), { base: z - 0.08, lift: 0.06, radius: 3, kind: 'wood', rough: 0.7, color: (gx, gy, t) => shade(c0, (0.45 + 0.35 * t) * (0.8 + 0.3 * sample(f.mid, gx * 3, gy))) });
    }
    L.paint((ctx) => { ctx.beginPath(); ctx.rect(x0, y - 9, x1 - x0, 9); }, (x, yy, px) => { const g = sample(f.mid, x * 0.12, yy * 3 + 40); px.rgb = shade(c0, (0.8 + 0.35 * g) * (0.75 + 0.35 * (yy - y + 9) / 9)); px.h = z; px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.6; });
    L.paint((ctx) => { ctx.beginPath(); ctx.rect(x0, y, x1 - x0, 13); }, (x, yy, px) => { const u = (yy - y) / 13; const g = sample(f.mid, x * 0.12, yy * 3); px.rgb = shade(c0, (0.5 + 0.35 * g) * (0.95 - 0.35 * u)); px.h = z + 0.02 * Math.sin(Math.PI * u); px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.65; });
    L.stroke(poly([[x0, y + 13.5], [x1, y + 13.5]], false), 1.5, { albedo: '#140c08', height: z - 0.02, kind: 'wood', rough: 0.8 });
  }
  function booksRow(L, yBase, x0, x1, z, seed, o = {}) {
    const r = rng(seed); const cols = o.colors || ['#5a1a14', '#1e3a2a', '#23304e', '#4a2a18', '#3a1a2e', '#6a4a1e', '#2a2622', '#1a3a3a', '#5a3a1a'];
    let x = x0;
    while (x < x1) {
      const t = 12 + r() * 11; const h = (o.h || 50) + r() * 20;
      if (o.gap && x + t > o.gap[0] && x < o.gap[1]) { x = o.gap[1]; continue; }
      const lean = r() < 0.1 && x + t + 16 < x1 ? 0.22 : 0; const cx = x + t / 2 + (lean ? h * 0.1 : 0);
      Pr.book(L, cx, yBase - h / 2 + (lean ? 2 : 0), h, t, Math.PI / 2 + lean, { color: cols[Math.floor(r() * cols.length)], z: z + r() * 0.03, face: 'spine' });
      x += t + (lean ? 12 : 0.5);
    }
  }
  function barrelEnd(L, x, y, r, z, mark) {
    const f = getFields();
    L.paint(circle(r, x, y), (gx, gy, px) => {
      const d = Math.hypot(gx - x, gy - y) / r; const sw = r * 0.26; const k = Math.floor((gx - x + r) / sw); const su = ((gx - x + r) / sw) % 1;
      const gap = smooth(0, 0.06, Math.min(su, 1 - su)); const g = sample(f.mid, k * 29 + gx * 0.1, gy * 0.35);
      let c = shade([112, 76, 46], (0.62 + 0.4 * g) * (0.45 + 0.55 * gap) * (0.9 + 0.2 * rng(k + 5)()));
      let h = z + 0.08 + 0.02 * gap;
      if (d > 0.8 && d < 0.93) { c = mix(shade([60, 56, 52], 0.8 + 0.4 * sample(f.mid, gx * 2, gy * 2)), [96, 54, 30], smooth(0.6, 0.8, sample(f.low, gx * 3, gy * 3)) * 0.5); h = z + 0.12 + 0.03 * Math.sin(Math.PI * (d - 0.8) / 0.13); px.kind = 'iron'; px.metal = 0.8; px.rough = 0.5; }
      else { px.kind = 'wood'; px.metal = 0; px.rough = 0.7; }
      if (d >= 0.93) { c = shade([70, 46, 28], 0.7 + 0.3 * (1 - d)); h = z + 0.1 - 0.06 * (d - 0.93) / 0.07; }
      px.rgb = c; px.h = h; px.hMode = 'set';
    });
    Pr.pillow(L, Pr.roundRectAt(x, y + r * 0.46, r * 0.22, r * 0.2, 0, 3), { base: z + 0.14, lift: 0.08, radius: 3, kind: 'wood', rough: 0.6, color: (gx, gy, t) => shade([96, 64, 36], 0.6 + 0.45 * t) });
    L.taper([[x, y + r * 0.56], [x, y + r * 0.74]], [r * 0.08, r * 0.06], { albedo: '#5a3a20', base: z + 0.16, peak: z + 0.24, kind: 'wood', rough: 0.6 });
    if (mark) L.text(mark, x, y - r * 0.32, 0, { font: FONT(Math.round(r * 0.34)), albedo: '#d6ccb8', depth: 0.02 });
  }
  function crate(L, x, y, w, h, z, mark) {
    const f = getFields();
    L.paint(Pr.roundRectAt(x, y, w, h, 0, 2), (gx, gy, px) => {
      const rows = 3; const v = (gy - (y - h / 2)) / h; const k = Math.floor(v * rows); const fv = v * rows - k;
      const gap = smooth(0, 0.08, Math.min(fv, 1 - fv)); const g = sample(f.mid, gx * 0.15 + k * 30, gy * 2.5);
      const frame = Math.min(gx - (x - w / 2), (x + w / 2) - gx) < 9;
      let c = shade([104, 78, 50], (0.6 + 0.4 * g) * (0.45 + 0.55 * gap)); if (frame) c = shade([84, 60, 38], 0.7 + 0.35 * g);
      px.rgb = c; px.h = z + (frame ? 0.06 : 0.03 * gap); px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.75;
    });
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) rivet(L, x + dx * (w / 2 - 4.5), y + dy * (h / 2 - 5), 1.8, { base: z + 0.06, peak: z + 0.1 });
    if (mark) L.text(mark, x, y + 2, -0.04, { font: FONT(Math.round(h * 0.3)), albedo: '#1a120c', depth: 0.02 });
  }
  function cobweb(L, x, y, s, flipX, flipY) {
    const mx = flipX ? -1 : 1, my = flipY ? -1 : 1; const col = 'rgba(200,196,188,0.55)';
    for (let k = 0; k <= 5; k += 1) { const a = (k / 5) * Math.PI / 2; L.stroke(poly([[x, y], [x + mx * Math.cos(a) * 90 * s, y + my * Math.sin(a) * 90 * s]], false), 0.9, { albedo: col, height: 0.3, kind: 'cloth', rough: 0.9 }); }
    for (let j = 1; j <= 4; j += 1) { const rr = j * 20 * s; const pts = []; for (let k = 0; k <= 5; k += 1) { const a = (k / 5) * Math.PI / 2; pts.push([x + mx * Math.cos(a) * rr, y + my * Math.sin(a) * rr]); } L.stroke((ctx) => { ctx.beginPath(); ctx.moveTo(...pts[0]); for (let k = 1; k < pts.length; k += 1) { const [px0, py0] = pts[k - 1], [px1, py1] = pts[k]; const mxp = (px0 + px1) / 2 - mx * 3 * s, myp = (py0 + py1) / 2 - my * 3 * s; ctx.quadraticCurveTo(mxp, myp, px1, py1); } }, 0.8, { albedo: col, height: 0.3, kind: 'cloth', rough: 0.9 }); }
  }
  function pictureFrame(L, x, y, w, h, z) {
    const f = getFields();
    L.paint(Pr.roundRectAt(x, y, w - 20, h - 20, 0, 1), (gx, gy, px) => {
      const v = (gy - (y - h / 2 + 10)) / (h - 20); const u = (gx - (x - w / 2 + 10)) / (w - 20);
      const hill = 0.62 + 0.1 * Math.sin(u * 7) + 0.06 * sample(f.mid, gx, 3);
      let c = v < hill ? mix([70, 64, 60], [34, 30, 34], v / hill) : shade([28, 30, 24], 0.8 + 0.3 * sample(f.mid, gx * 2, gy * 2));
      if (Math.hypot(u - 0.72, v - 0.26) < 0.07) c = [150, 140, 110];
      c = shade(c, 0.85 + 0.2 * sample(f.high, gx * 3, gy * 3));
      px.rgb = c; px.h = z; px.hMode = 'set'; px.kind = 'paint'; px.metal = 0; px.rough = 0.5;
    });
    Pr.pillow(L, (ctx) => { ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.rect(x - w / 2 + 10, y - h / 2 + 10, w - 20, h - 20); }, { rule: 'evenodd', base: z + 0.02, lift: 0.1, radius: 5, kind: 'gold', metal: 0.9, rough: 0.4, color: (gx, gy, t) => mix(shade([168, 132, 64], 0.55 + 0.5 * t), [90, 70, 40], smooth(0.55, 0.8, sample(f.mid, gx * 2, gy * 2)) * 0.5) });
  }
  function globe(L, x, y, r, z) {
    const f = getFields(); const cy = y - r - 16;
    L.fill(poly([[x - r * 0.6, y], [x + r * 0.6, y], [x + 6, y - 16], [x - 6, y - 16]]), { albedo: '#5a3a22', height: z + 0.06, kind: 'wood', rough: 0.6, op: 'source-over' });
    L.paint(circle(r, x, cy), (gx, gy, px) => {
      const dx = (gx - x) / r, dy = (gy - cy) / r; const prof = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
      const lon = Math.atan2(dx, prof) * 2.2, lat = Math.asin(Math.max(-1, Math.min(1, dy)));
      const land = sample(f.mid, lon * 40 + 100, lat * 40 + 100) > 0.55;
      let c = land ? [150, 124, 80] : [70, 90, 88]; c = shade(c, 0.55 + 0.5 * prof);
      if (Math.abs(((lon * 3 / Math.PI) % 1 + 1) % 1 - 0.5) > 0.47 || Math.abs(((lat * 4 / Math.PI) % 1 + 1) % 1 - 0.5) > 0.47) c = shade(c, 0.6);
      px.rgb = c; px.h = z + 0.08 + 0.2 * prof; px.hMode = 'set'; px.kind = 'paint'; px.metal = 0; px.rough = 0.45;
    });
    L.stroke((ctx) => { ctx.beginPath(); ctx.arc(x, cy, r + 5, Math.PI * 0.15, Math.PI * 1.15); }, 3.4, { albedo: '#8a6a34', height: z + 0.32, kind: 'bronze', metal: 0.85, rough: 0.45 });
  }
  function hangingCloak(L, x, y, z) {
    const f = getFields();
    L.dome(x, y, 5, { albedo: '#3a3431', base: z + 0.1, peak: z + 0.2, ...IRON });
    Pr.pillow(L, smoothPath([[x, y + 2], [x + 16, y + 24], [x + 24, y + 58], [x + 40, y + 72], [x + 52, y + 176], [x + 26, y + 192], [x + 2, y + 180], [x - 24, y + 194], [x - 54, y + 176], [x - 40, y + 72], [x - 24, y + 58], [x - 16, y + 24]], true), { base: z, lift: 0.16, radius: 20, kind: 'cloth', rough: 0.92, color: (gx, gy, t) => { const fold = Math.sin((gx - x) * 0.16 + sample(f.mid, gx, gy) * 3); return shade([36, 34, 40], (0.5 + 0.5 * t) * (0.7 + 0.3 * fold)); } });
    Pr.pillow(L, smoothPath([[x - 12, y + 30], [x, y + 20], [x + 12, y + 30], [x + 10, y + 56], [x, y + 62], [x - 10, y + 56]], true), { base: z + 0.14, lift: 0.04, radius: 6, kind: 'cloth', rough: 0.95, color: (gx, gy, t) => shade([12, 10, 14], 0.6 + 0.4 * (1 - t)) });
  }

  /* ---------- A — Intérieurs ---------- */
  const INTERIOR = {
    market(L) {
      planksWall(L, '#5e4028');
      [[118, 22, ['#5a5226', '#6a5a2c', '#4e4a22']], [214, 12, ['#d8ccb0', '#c8bc9a', '#e0d4ba']], [298, 30, ['#5a5226', '#6a5a2c', '#4e4a22']], [394, 18, ['#8a2a1a', '#7a2616', '#6a1e12']]].forEach(([x, y, cols]) => Pr.herbs(L, x, y + 14, 66, 0.3, { colors: cols }));
      shelf(L, 206, 0.34);
      Pr.cheese(L, 128, 206 - 22 * 0.62, 0.62, 0.38); Pr.cheese(L, 180, 206 - 22 * 0.5, 0.5, 0.4);
      Pr.sack(L, 256, 170, 86, 72, 0.36, '#8a7652');
      Pr.flask(L, 334, 206, 0.72, { z: 0.38, liquid: '#b07a1e', type: 'round', level: 0.8 });
      Pr.flask(L, 372, 206, 0.6, { z: 0.4, liquid: '#a8641a', type: 'round', level: 0.7 });
      Pr.bread(L, 420, 194, 70, 26, 0.1, 0.38);
      shelf(L, 346, 0.34);
      Pr.basket(L, 168, 323, 128, 48, 0.38);
      for (let k = 0; k < 7; k += 1) Pr.apple(L, 124 + k * 15, 298 - (k % 2) * 8, 12.5, { z: 0.46 + k * 0.01, color: ['#6e1a12', '#7a2a12', '#661810'][k % 3], blush: '#b07a36' });
      Pr.basket(L, 344, 323, 128, 48, 0.38);
      for (let k = 0; k < 7; k += 1) Pr.apple(L, 300 + k * 15, 298 - (k % 2) * 8, 12, { z: 0.46 + k * 0.01, color: ['#6a7428', '#7a8430', '#5e6a22'][k % 3], blush: '#a8923a' });
      Pr.grapes(L, 256, 322, 0.9, 0.44);
      crate(L, 150, 452, 150, 80, 0.36); crate(L, 350, 452, 150, 80, 0.36);
      return { lights: [[256, 120, 150, [1.3, 1.0, 0.62]]] };
    },
    bookshop(L) {
      planksWall(L, '#3a2a1e');
      shelf(L, 66, 0.34); booksRow(L, 66, 0, 512, 0.38, 11, { h: 46 });
      shelf(L, 206, 0.34); booksRow(L, 206, 0, 512, 0.38, 12, { gap: [222, 292] });
      Pr.candle(L, 257, 206, 46, 0.4, { w: 15, halo: 96 });
      shelf(L, 346, 0.34); booksRow(L, 346, 0, 318, 0.38, 13);
      [[108, 22, 0.02, '#3e1512'], [96, 18, -0.05, '#1e2a44'], [100, 20, 0.04, '#27321c']].forEach(([w, t, rot, col], k) => Pr.book(L, 380 + k * 3, 346 - t / 2 - k * 19, w, t, rot, { color: col, z: 0.38 + k * 0.05, face: k === 1 ? 'pages' : 'spine' }));
      Pr.inkwell(L, 450, 346, 0.8, 0.4);
      shelf(L, 486, 0.34); booksRow(L, 486, 0, 512, 0.38, 14);
      return { lights: [[257, 140, 120, [1.5, 0.95, 0.48]]] };
    },
    antique(L) {
      damaskWall(L, '#2e1c2a', '#4e3446');
      pictureFrame(L, 256, 112, 150, 104, 0.3);
      shelf(L, 222, 0.34, { color: '#3e2a1e' });
      Pr.hourglass(L, 136, 222 - 38.5 * 0.72, 0.72, 0.4);
      Pr.candle(L, 196, 222, 40, 0.4, { w: 12, halo: 70 });
      Pr.amphora(L, 330, 222, 0.8, 0.38);
      Pr.crown(L, 404, 212, 0.55, 0, 0.42);
      shelf(L, 362, 0.34, { color: '#3e2a1e' });
      Pr.casket(L, 160, 362 - 11 * 0.8, 0.8, 0.38);
      globe(L, 268, 362, 34, 0.38);
      Pr.coinPile(L, 360, 356, 9, 50, 0.42);
      Pr.wineBottle(L, 418, 362, 0.62, 0, 0.38);
      return { lights: [[196, 150, 110, [1.4, 0.9, 0.5]]] };
    },
    armory(L) {
      stoneWall(L, '#56565a');
      Pr.sword(L, 168, 250, 356, 44, 0.3, { width: 14, grip: 40 });
      Pr.sword(L, 344, 250, 156, 44, 0.32, { width: 14, grip: 40 });
      Pr.heaterShield(L, 256, 150, 0.95, 0, 0.42, { c1: '#5a1416', c2: '#b09048' });
      Pr.axe(L, 86, 360, 104, 150, 0.34); Pr.axe(L, 426, 360, 408, 150, 0.34);
      shelf(L, 362, 0.34, { color: '#4a3424', brackets: [150, 362] });
      Pr.greatHelm(L, 186, 362 - 34 * 0.72, 0.72, 0.38);
      Pr.greatHelm(L, 326, 362 - 34 * 0.66, 0.66, 0.38);
      Pr.dagger(L, 222, 356, 300, 352, 0.44);
      return { lights: [[256, 60, 160, [1.2, 1.05, 0.85]]] };
    },
    'black-market'(L) {
      stoneWall(L, '#2e2e32');
      cobweb(L, 0, 0, 1.2, false, false); cobweb(L, 512, 0, 1, true, false);
      hangingCloak(L, 120, 110, 0.3);
      crate(L, 350, 208, 120, 86, 0.34, 'XIII'); crate(L, 410, 150, 90, 60, 0.36);
      shelf(L, 346, 0.34, { color: '#3a2c20' });
      Pr.pouch(L, 196, 322, 0.9, 0.4); Pr.pouch(L, 250, 326, 0.7, 0.42, '#3a2a1c');
      Pr.coinPile(L, 320, 338, 12, 70, 0.42);
      Pr.dagger(L, 280, 338, 410, 322, 0.46);
      Pr.crown(L, 400, 330, 0.5, 0.3, 0.4);
      ST.greenLantern(L, 256, 150, 0.9, 0.36);
      L.stroke(poly([[256, 0], [256, 106]], false), 2, { albedo: '#2a2624', height: 0.4, ...IRON });
      return { lights: [[256, 140, 110, [0.4, 1.2, 0.6]]] };
    },
    alchemist(L) {
      stoneWall(L, '#454a44');
      [[110, 26], [180, 12], [338, 18], [404, 28]].forEach(([x, y]) => Pr.herbs(L, x, y + 14, 70, 0.3));
      shelf(L, 206, 0.34, { color: '#3e2c1e' });
      Pr.flask(L, 130, 206, 0.8, { z: 0.38, liquid: '#1e5aa8', glow: true, type: 'round', level: 0.6 });
      Pr.flask(L, 176, 206, 0.72, { z: 0.4, liquid: '#8a1c14', glow: true, type: 'tall', level: 0.5, label: true });
      Pr.flask(L, 222, 206, 0.7, { z: 0.38, liquid: '#2e8a3a', glow: true, type: 'cone', level: 0.5 });
      Pr.flask(L, 300, 206, 0.8, { z: 0.38, liquid: '#b08a2a', glow: true, type: 'round', level: 0.5 });
      Pr.flask(L, 346, 206, 0.7, { z: 0.4, liquid: '#6a2a8a', glow: true, type: 'tall', level: 0.6 });
      Pr.crystals(L, 400, 196, 0.62, 0.38, '#4e2a78');
      shelf(L, 346, 0.34, { color: '#3e2c1e' });
      skull(L, 160, 318, 0.7, 0, { base: 0.38, lift: 0.3, seed: 3 });
      Pr.candle(L, 162, 290, 26, 0.64, { w: 11, halo: 60, holder: false });
      Pr.mortar(L, 246, 336, 0.9, 0.4);
      [[92, 18, 0.03, '#3e1512'], [84, 16, -0.04, '#1e2a44']].forEach(([w, t, rot, col], k) => Pr.book(L, 350, 346 - t / 2 - k * 17, w, t, rot, { color: col, z: 0.38 + k * 0.05, face: 'spine' }));
      Pr.flask(L, 420, 346, 0.7, { z: 0.4, liquid: '#3a8a6a', glow: true, type: 'round', level: 0.7 });
      return { lights: [[160, 250, 110, [1.3, 0.85, 0.45]], [256, 150, 90, [0.4, 0.6, 1.0]]] };
    },
    tavern(L) {
      planksWall(L, '#4a3220');
      Pr.herbs(L, 150, 24, 60, 0.3); Pr.herbs(L, 362, 20, 64, 0.3, { colors: ['#8a2a1a', '#7a2616', '#6a1e12'] });
      shelf(L, 176, 0.34);
      Pr.tankard(L, 112, 176, 0.72, 0.38); Pr.tankard(L, 158, 176, 0.72, 0.38);
      Pr.wineBottle(L, 206, 176, 0.72, 0, 0.38); Pr.wineBottle(L, 232, 176, 0.66, 0, 0.4);
      Pr.tankard(L, 290, 176, 0.72, 0.38); Pr.tankard(L, 336, 176, 0.72, 0.38);
      Pr.wineBottle(L, 384, 176, 0.72, 0, 0.38); Pr.tankard(L, 428, 176, 0.72, 0.38);
      L.fill((ctx) => { ctx.beginPath(); ctx.rect(0, 392, 512, 16); }, { albedo: '#3a2616', height: 0.3, kind: 'wood', rough: 0.7, op: 'source-over' });
      barrelEnd(L, 142, 330, 60, 0.34, 'XX'); barrelEnd(L, 256, 330, 60, 0.36, 'III'); barrelEnd(L, 370, 330, 60, 0.34, 'VII');
      barrelEnd(L, 200, 450, 58, 0.34); barrelEnd(L, 314, 450, 58, 0.34);
      return { lights: [[60, 470, 90, [1.5, 0.7, 0.3]], [256, 120, 120, [1.1, 0.85, 0.55]]] };
    },
    traveling(L) {
      drapeWall(L, '#4a3446', { holes: true });
      ST.charmString(L, -10, 40, 522, 40, 40, ['rag', 'bone', 'key', 'rag', 'skull', 'feather', 'vial', 'rag', 'bell', 'bone', 'rag', 'tooth', 'feather', 'key', 'rag'], 0.3, { scale: 1.2 });
      ST.birdcage(L, 118, 104, 0.9, 0.34);
      L.stroke(poly([[118, 60], [118, 104]], false), 1.6, { albedo: '#3a3028', height: 0.36, kind: 'cloth', rough: 0.9 });
      shelf(L, 240, 0.34, { x0: 316, x1: 512, color: '#3a2e26', brackets: [360, 470] });
      ST.eyeJar(L, 350, 240, 0.8, 0.38); ST.eyeJar(L, 392, 240, 0.64, 0.4, { liquid: '#6a5a2a', iris: '#8a5a2a' }); ST.vial(L, 424, 214, 1.1, 0.4);
      // table drapée
      Pr.pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(120, 382); ctx.lineTo(392, 382); ctx.lineTo(420, 512); ctx.lineTo(92, 512); ctx.closePath(); }, { base: 0.32, lift: 0.08, radius: 10, kind: 'cloth', rough: 0.9, color: (gx, gy, t) => { const fold = Math.sin(gx * 0.12 + Math.sin(gy * 0.05) * 1.5); return shade([60, 34, 52], (0.55 + 0.45 * t) * (0.7 + 0.3 * fold)); } });
      for (let k = 0; k < 28; k += 1) { const t = k / 27; const x = lerp(126, 386, t); L.taper([[x, 384], [x + 1, 400]], [2.4, 1.4], { albedo: '#8a7a56', base: 0.42, peak: 0.46, kind: 'cloth', rough: 0.9 }); }
      ST.crystalBall(L, 256, 384, 46, 0.44);
      ST.tarotFan(L, 168, 384, 0.95, -0.3, 0.42);
      ST.skullCandle(L, 346, 384, 0.95, 0.42);
      ST.greenCandle(L, 408, 240, 30, 0.4);
      return { lights: [[256, 300, 90, [0.8, 0.6, 1.4]], [346, 320, 80, [0.45, 1.1, 0.6]]] };
    },
  };

  /* ---------- B — Objets phares ---------- */
  const HERO = {
    market(L) {
      plaster(L, '#4a3424');
      Pr.bread(L, 176, 300, 118, 42, -0.5, 0.3);
      Pr.basket(L, 262, 332, 196, 78, 0.36);
      const apples = [[196, 290, 21], [234, 285, 22], [272, 284, 22], [310, 288, 21], [344, 296, 20], [214, 262, 20], [254, 256, 22], [292, 258, 21], [330, 268, 19], [272, 232, 20]];
      apples.forEach(([x, y, r], k) => Pr.apple(L, x, y, r, { z: 0.48 + k * 0.01, color: ['#6e1a12', '#7a2a12', '#661810', '#566422'][k % 4], blush: k % 4 === 3 ? '#a8923a' : '#b07a36', leaf: k === 9 }));
      return { lights: [[240, 150, 200, [1.5, 1.2, 0.8]]] };
    },
    bookshop(L) {
      plaster(L, '#1e2a22');
      const stack = [[206, 34, 0.02, '#3e1512', 'spine'], [192, 30, -0.04, '#1e2a44', 'pages'], [198, 32, 0.05, '#27321c', 'spine'], [176, 28, -0.03, '#4a3018', 'spine']];
      let y = 386, z = 0.36;
      stack.forEach(([w, t, rot, col, face], k) => { Pr.book(L, 256 + (k % 2 ? 7 : -5), y - t / 2, w, t, rot, { color: col, z, face, clasp: k === 2 }); y -= t - 1; z += 0.07; });
      Pr.candle(L, 260, y - 2, 70, z + 0.02, { w: 22, halo: 120 });
      return { lights: [[260, y - 90, 150, [1.6, 1.0, 0.5]]] };
    },
    antique(L) {
      plaster(L, '#3a2436');
      Pr.hourglass(L, 162, 396 - 38.5 * 0.95, 0.95, 0.4);
      Pr.amphora(L, 262, 398, 2.05, 0.34);
      Pr.coinPile(L, 338, 392, 8, 56, 0.44);
      return { lights: [[220, 150, 200, [1.5, 1.15, 0.8]]] };
    },
    armory(L) {
      plaster(L, '#34383e');
      Pr.sword(L, 176, 376, 350, 110, 0.3, { width: 18, grip: 54 });
      Pr.sword(L, 336, 376, 162, 110, 0.32, { width: 18, grip: 54 });
      Pr.heaterShield(L, 256, 236, 1.22, 0, 0.44, { c1: '#5a1416', c2: '#b09048' });
      return { lights: [[220, 120, 220, [1.4, 1.3, 1.1]]] };
    },
    'black-market'(L) {
      plaster(L, '#1e2220');
      Pr.pouch(L, 262, 290, 1.8, 0.36);
      ST.key(L, 168, 200, 2.3, 0.62, 0.5, '#8a7a50');
      Pr.coinPile(L, 316, 364, 12, 96, 0.46);
      Pr.coinStack(L, 176, 372, 6, 0.44);
      Pr.dagger(L, 150, 396, 380, 334, 0.58);
      return { lights: [[256, 170, 170, [0.6, 1.25, 0.8]]] };
    },
    alchemist(L) {
      plaster(L, '#1e2a2a');
      Pr.flask(L, 166, 390, 1.1, { z: 0.4, liquid: '#8a1c14', glow: true, type: 'tall', level: 0.5 });
      Pr.flask(L, 256, 392, 2.35, { z: 0.36, liquid: '#1e5aa8', glow: true, type: 'round', level: 0.62, label: true });
      Pr.crystals(L, 344, 384, 1.0, 0.4, '#4e2a78');
      return { lights: [[250, 260, 150, [0.6, 0.9, 1.5]], [256, 110, 200, [1.1, 1.0, 0.9]]] };
    },
    tavern(L) {
      plaster(L, '#3e2a1a');
      Pr.tankard(L, 236, 386, 2.6, 0.36);
      Pr.wineBottle(L, 346, 386, 1.2, 0.1, 0.34);
      return { lights: [[200, 150, 200, [1.5, 1.1, 0.7]]] };
    },
    traveling(L) {
      plaster(L, '#2a1e2a');
      ST.tarotFan(L, 164, 396, 1.15, -0.35, 0.5);
      ST.crystalBall(L, 258, 392, 74, 0.34, { halo: 'rgba(140,110,230,0.45)' });
      ST.crow(L, 362, 312, 1.2, true, 0.5);
      return { lights: [[256, 250, 140, [0.8, 0.6, 1.5]], [256, 110, 200, [0.7, 0.66, 0.8]]] };
    },
  };

  function renderBackdrop(shop, style) {
    const L = createLayers();
    const spec = (style === 'B' ? HERO : INTERIOR)[shop](L) || {};
    const lights = [{ dir: [-0.35, -0.55, 0.76], color: [0.62, 0.58, 0.52] }, { dir: [0.6, 0.4, 0.7], color: [0.1, 0.11, 0.16], shadow: false }];
    for (const [x, y, z, col] of spec.lights || []) lights.push({ pos: [x, y, z], radius: 280, color: col });
    return render(L, { seed: shop.length + (style === 'B' ? 7 : 0), lights, room: [0.12, 0.1, 0.09], inside: () => false, sheen: 0.35, dropShadow: 0, exposure: 1.1, lichen: 0, ...(spec.render || {}) });
  }

  root.Backdrops = { render: renderBackdrop, INTERIOR, HERO };
}(window));
