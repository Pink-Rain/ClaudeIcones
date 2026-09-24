// Labo Eraser — accessoires « étranges » : le marché ambulant dark fantasy.
// Laiton terni, peinture aubergine écaillée, os, flammes vertes, corbeau, boule de cristal.
(function (root) {
  'use strict';
  const { TAU, rng, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { circle, poly, smoothPath, bezierPts, lerp, localPts, skull, feather } = root.Helpers;
  const Pr = root.Props;
  const F = () => getFields();
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));
  const IRON = { kind: 'iron', metal: 0.8, rough: 0.55 };
  const BRASS = { kind: 'bronze', metal: 0.85, rough: 0.5 };

  const PAL = {
    wood: '#3a2e26', woodDark: '#241c17', paint: '#3a2238', ink: '#18222a',
    brass: '#7a6a44', bone: '#cdbf9c', boneDark: '#8a7e62', rope: '#4a3c2c',
    flame: '#9cf0b0', core: '#e4fff0', flameGlow: 'rgba(90,230,140,0.9)', coreGlow: 'rgba(210,255,225,1)', halo: 'rgba(50,210,110,0.5)', glass: '#86dca0',
    lanternFlame: 'rgba(110,235,150,0.95)', lanternHalo: 'rgba(50,210,110,0.5)',
    rags: ['#4a3a46', '#5a564e', '#8a7e62', '#34464a', '#6a5634', '#3e2a36'],
    light: [0.55, 1.25, 0.72],
  };

  /* ---------- lumières vertes ---------- */
  function greenCandle(L, x, y, h, z, o = {}) {
    Pr.candle(L, x, y, h, z, { w: 12, holder: false, wax: '#b8b09a', flame: PAL.flame, core: PAL.core, flameGlow: PAL.flameGlow, coreGlow: PAL.coreGlow, haloColor: PAL.halo, wickGlow: 'rgba(80,200,120,0.6)', halo: 56, ...o });
  }
  function greenLantern(L, x, y, s, z) {
    Pr.lantern(L, x, y, s, z, { glass: PAL.glass, flame: PAL.lanternFlame, halo: PAL.lanternHalo });
  }

  /* ---------- corbeau perché (pieds en x, y ; tête à gauche, `flip` pour la droite) ---------- */
  function crow(L, x, y, s, flip, z, o = {}) {
    const m = flip ? -1 : 1; const f = F();
    const X = (u) => x + m * u * s, Y = (v) => y + v * s;
    const pts = (arr) => arr.map(([u, v]) => [X(u), Y(v)]);
    const feathersTex = (gx, gy, t, base) => { const n = sample(f.mid, gx * 2.4, gy * 2.4), g = sample(f.high, gx * 1.6 + gy * 0.8, gy * 1.6); const c = shade(base, (0.55 + 0.7 * t) * (0.84 + 0.22 * n) * (g > 0.8 ? 1.2 : 1)); return mix(c, [88, 84, 128], smooth(0.55, 0.95, t) * smooth(0.45, 0.7, n) * 0.45); };
    // queue
    Pr.pillow(L, poly(pts([[14, -16], [44, 6], [47, -1], [40, -8], [22, -22]])), { base: z, lift: 0.06, radius: 4 * s, kind: 'organic', rough: 0.46, color: (gx, gy, t) => feathersTex(gx, gy, t, [40, 40, 54]) });
    // pattes
    for (const [u0, u1] of [[-6, -6.5], [2, 2.5]]) {
      L.stroke(poly(pts([[u0, -8], [u1, 0]]), false), 2.2 * s, { albedo: '#2a2a2c', height: z + 0.06, kind: 'organic', rough: 0.5 });
      for (const d of [-5, 0, 3]) L.stroke(poly(pts([[u1, 0], [u1 + d, 1.5]]), false), 1.4 * s, { albedo: '#2a2a2c', height: z + 0.06, kind: 'organic', rough: 0.5 });
    }
    // corps
    Pr.pillow(L, smoothPath(pts([[-15, -31], [-21, -20], [-15, -9], [-2, -5], [12, -7], [22, -13], [16, -24], [0, -32]]), true), { base: z + 0.04, lift: 0.18, radius: 12 * s, kind: 'organic', rough: 0.46, color: (gx, gy, t) => feathersTex(gx, gy, t, [40, 40, 54]) });
    // aile repliée
    Pr.pillow(L, smoothPath(pts([[-8, -26], [6, -28], [24, -18], [38, -5], [30, -5], [12, -10], [-4, -15]]), true), { base: z + 0.14, lift: 0.08, radius: 6 * s, kind: 'organic', rough: 0.44, color: (gx, gy, t) => feathersTex(gx, gy, t, [46, 46, 62]) });
    for (let k = 0; k < 4; k += 1) L.engrave(poly(pts([[10 + k * 6, -20 + k * 2], [30 + k * 2.5, -6 + k * 0.4]]), false), 0.9 * s, 0.2);
    // tête et bec
    Pr.pillow(L, circle(9.5 * s, X(-16), Y(-36)), { base: z + 0.12, lift: 0.14, radius: 7 * s, kind: 'organic', rough: 0.46, color: (gx, gy, t) => feathersTex(gx, gy, t, [40, 40, 54]) });
    L.taper(pts([[-23, -38], [-39, -33]]), [6.4 * s, 0.9 * s], { albedo: '#3a3a3e', base: z + 0.16, peak: z + 0.24, kind: 'organic', metal: 0.2, rough: 0.34 });
    L.stroke(poly(pts([[-24, -35.5], [-36, -33.6]]), false), 0.8 * s, { albedo: '#141416', height: z + 0.25 });
    L.dome(X(-18), Y(-38.5), 2.1 * s, { albedo: o.eye || '#c8d070', base: z + 0.2, peak: z + 0.28, kind: 'glass', rough: 0.1, emissive: o.eyeGlow || 'rgba(170,220,90,0.9)' });
    L.dome(X(-18.3), Y(-38.7), 0.9 * s, { albedo: '#0a0a0a', base: z + 0.28, peak: z + 0.3, kind: 'glass', rough: 0.1 });
  }

  /* ---------- cage à oiseau suspendue (x, y = anneau du haut) ---------- */
  function birdcage(L, x, y, s, z, o = {}) {
    const bars = { albedo: o.metal || '#5e5238', ...BRASS };
    feather(L, x - 14 * s, y + 76 * s, 22 * s, 6 * s, -0.12, { albedo: '#26262e', rachis: '#4a4a52', base: z + 0.02, peak: z + 0.06, seed: 9, curve: 0.04, rough: 0.5 });
    L.fill(Pr.roundRectAt(x, y + 80 * s, 56 * s, 9 * s, 0, 2 * s), { albedo: '#4e4430', height: z + 0.2, ...BRASS, op: 'source-over' });
    L.taper([[x - 20 * s, y + 64 * s], [x + 20 * s, y + 64 * s]], [2.6 * s, 2.6 * s], { ...bars, base: z + 0.18, peak: z + 0.24 });
    for (let k = -3; k <= 3; k += 1) {
      const u = k / 3;
      const top = bezierPts([x + u * 2 * s, y + 13 * s], [x + u * 20 * s, y + 13 * s], [x + u * 25 * s, y + 22 * s], [x + u * 25 * s, y + 32 * s], 14);
      L.taper([...top, [x + u * 25 * s, y + 78 * s]], [2.3 * s, 2.3 * s], { ...bars, base: z + 0.22, peak: z + 0.3 });
    }
    for (const yy of [32, 56]) L.stroke((ctx) => { ctx.beginPath(); ctx.ellipse(x, y + yy * s, 25 * s, 4 * s, 0, 0, Math.PI); }, 2.2 * s, { albedo: bars.albedo, height: z + 0.3, ...BRASS });
    L.dome(x, y + 11 * s, 4.5 * s, { albedo: bars.albedo, base: z + 0.26, peak: z + 0.36, ...BRASS });
    L.torus(x, y + 4 * s, 5 * s, 5 * s, 0, 0.45, { albedo: bars.albedo, base: z + 0.26, peak: z + 0.34, ...BRASS });
    // porte ouverte, pivotée sur le côté
    const m = o.flip ? -1 : 1; const dx0 = x + m * 25 * s;
    for (const yy of [40, 72]) L.stroke(poly([[dx0, y + yy * s], [dx0 + m * 18 * s, y + (yy + 5) * s]], false), 2 * s, { albedo: bars.albedo, height: z + 0.32, ...BRASS });
    for (const t of [0.35, 0.7, 1]) L.stroke(poly([[dx0 + m * 18 * s * t, y + (40 + 5 * t) * s], [dx0 + m * 18 * s * t, y + (72 + 5 * t) * s]], false), 1.8 * s, { albedo: bars.albedo, height: z + 0.32, ...BRASS });
    if (o.bird !== false) crow(L, x - m * 2 * s, y + 12 * s, 0.62 * s, o.flip, z + 0.36);
  }

  /* ---------- boule de cristal sur pied de laiton (y = base du pied) ---------- */
  function crystalBall(L, x, y, r, z, o = {}) {
    const f = F(); const cy = y - 0.35 * r - 0.86 * r;
    const mistA = hex(o.mistA || '#7a50c8'), mistB = hex(o.mistB || '#3aa89a');
    Pr.pillow(L, poly([[x - 0.95 * r, y], [x + 0.95 * r, y], [x + 0.58 * r, y - 0.38 * r], [x - 0.58 * r, y - 0.38 * r]]), { base: z, lift: 0.12, radius: 6, ...BRASS, color: (gx, gy, t) => mix(shade([122, 104, 66], 0.55 + 0.5 * t), [70, 96, 80], smooth(0.55, 0.8, sample(f.mid, gx * 2, gy * 2)) * 0.5) });
    L.paint(circle(r, x, cy), (gx, gy, px) => {
      const dx = (gx - x) / r, dy = (gy - cy) / r; const d2 = dx * dx + dy * dy; const prof = Math.sqrt(Math.max(0, 1 - d2));
      const sw = sample(f.mid, (gx - x) * 1.4 + 60 + Math.sin(dy * 4) * 18, (gy - cy) * 1.4 + Math.cos(dx * 4) * 18);
      const mist = smooth(0.32, 0.78, sw) * (0.35 + 0.65 * prof);
      const col = mix(mistA, mistB, smooth(0.3, 0.7, sample(f.low, gx * 3, gy * 3)));
      let c = mix([12, 10, 20], col, mist * 0.85);
      c = shade(c, 0.55 + 0.45 * prof);
      const hl = Math.exp(-(((dx + 0.34) ** 2 + (dy + 0.42) ** 2) / 0.018)); const rim = smooth(0.82, 1, Math.sqrt(d2));
      c = mix(c, [236, 234, 246], hl * 0.9); c = mix(c, col, rim * 0.4);
      px.rgb = c; px.h = z + 0.14 + 0.3 * prof; px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.04;
      px.e = col.map((v) => v * mist * 0.5);
    });
    for (const d of [-1, 0, 1]) L.taper([[x + d * 0.42 * r, y - 0.36 * r], [x + d * 0.66 * r, y - 0.6 * r - (d === 0 ? 0.02 * r : 0)]], [5, 2.4], { albedo: '#6e6040', base: z + 0.3, peak: z + 0.4, ...BRASS });
    L.glow((e) => { const g = e.createRadialGradient(x, cy, r * 0.4, x, cy, r * 2.2); g.addColorStop(0, o.halo || 'rgba(140,110,230,0.34)'); g.addColorStop(1, 'rgba(90,60,200,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, cy, r * 2.2, 0, TAU); e.fill(); });
  }

  /* ---------- bocal avec un œil (y = base) ---------- */
  function eyeJar(L, x, y, s, z, o = {}) {
    const f = F(); const liquid = hex(o.liquid || '#4e6a3a'); const ex = x + 1 * s, ey = y - 27 * s, er = 11.5 * s; const level = y - 47 * s;
    L.paint(Pr.roundRectAt(x, y - 27 * s, 40 * s, 54 * s, 0, 9 * s), (gx, gy, px) => {
      const du = (gx - x) / (20 * s); const prof = Math.sqrt(Math.max(0, 1 - du * du)); const n = sample(f.mid, gx * 2, gy * 2);
      let c = gy > level ? shade(liquid, (0.45 + 0.4 * prof) * (0.85 + 0.25 * n)) : shade([30, 36, 32], 0.6 + 0.5 * prof);
      if (Math.abs(gy - level) < 1.2 * s) c = mix(c, [150, 170, 120], 0.5);
      const dd = Math.hypot(gx - ex, gy - ey) / er;
      if (dd < 1) {
        const sp = Math.sqrt(1 - dd * dd); let e = shade([214, 204, 180], 0.6 + 0.42 * sp);
        const ix = gx - (ex - 2.6 * s), iy = gy - (ey + 1 * s); const di = Math.hypot(ix, iy) / (5.2 * s);
        if (di < 1) { const a = Math.atan2(iy, ix); e = shade(hex(o.iris || '#4e8c6a'), (0.7 + 0.3 * Math.sin(a * 14)) * (0.8 + 0.3 * (1 - di))); if (di < 0.42) e = [12, 10, 10]; }
        const vein = sample(f.high, Math.atan2(gy - ey, gx - ex) * 60, dd * 20); if (dd > 0.55 && di >= 1 && vein > 0.78) e = mix(e, [150, 40, 36], 0.7);
        c = mix(e, liquid, 0.22);
      }
      const streak = Math.exp(-(((du + 0.55) / 0.09) ** 2)) * 0.45 + smooth(0.84, 1, Math.abs(du)) * 0.3;
      c = mix(c, [210, 230, 210], streak);
      px.rgb = c; px.h = z + 0.1 + 0.14 * prof; px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.08;
      if (gy > level) px.e = liquid.map((v) => v * 0.07);
    });
    Pr.pillow(L, Pr.roundRectAt(x, y - 57 * s, 36 * s, 11 * s, 0, 3 * s), { base: z + 0.14, lift: 0.08, radius: 4 * s, kind: 'wax', rough: 0.45, color: (gx, gy, t) => shade([74, 34, 46], 0.6 + 0.45 * t) });
    const r = rng(Math.round(x + y));
    for (let k = 0; k < 3; k += 1) { const dx = (-12 + k * 11 + r() * 4) * s; L.taper([[x + dx, y - 53 * s], [x + dx, y - (46 - r() * 8) * s]], [3.4 * s, 2.2 * s], { albedo: '#4a2230', base: z + 0.2, peak: z + 0.26, kind: 'wax', rough: 0.45 }); }
    L.fill(Pr.roundRectAt(x, y - 10 * s, 26 * s, 11 * s, 0.04, 1.5 * s), { albedo: '#b8a57c', height: z + 0.26, kind: 'paint', rough: 0.8, op: 'source-over' });
    for (let k = 0; k < 2; k += 1) L.stroke(poly([[x - 9 * s, y - (12.5 - k * 4) * s], [x + (6 - k * 5) * s, y - (12 - k * 4) * s]], false), 0.9 * s, { albedo: '#3a2a1e', height: z + 0.27 });
  }

  /* ---------- tarot en éventail (x, y = pivot en bas) ---------- */
  function tarotFan(L, x, y, s, rot, z) {
    const f = F(); const w = 30 * s, h = 48 * s;
    const cards = [{ a: -0.34, sym: 'moon' }, { a: 0, sym: 'eye' }, { a: 0.34, sym: 'star' }];
    cards.forEach(({ a, sym }, k) => {
      const ang = rot + a; const [cx, cy] = [x + Math.sin(ang) * (h / 2 - 6 * s), y - Math.cos(ang) * (h / 2 - 6 * s)];
      Pr.local(L, cx, cy, ang, (ctx) => { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 3 * s); }, (u, v, px, gx, gy) => {
        const n = sample(f.mid, gx * 2.2, gy * 2.2); const edge = Math.min(w / 2 - Math.abs(u), h / 2 - Math.abs(v));
        let c = shade([204, 190, 156], 0.8 + 0.25 * n);
        if (edge < 3.2 * s) c = shade([74, 30, 32], 0.8 + 0.3 * n);
        else if (edge < 4.4 * s) c = [150, 120, 64];
        else {
          const su = u / s, sv = (v + 2 * s) / s; let ink = false, gold = false;
          if (sym === 'moon') { ink = Math.hypot(su, sv) < 9 && Math.hypot(su - 4.5, sv - 2) > 7.6; }
          if (sym === 'eye') { const al = Math.abs(sv) < 6 * (1 - (su / 12) ** 2) && Math.abs(su) < 12; const ir = Math.hypot(su, sv); ink = al && (Math.abs(sv) > 6 * (1 - (su / 12) ** 2) - 1.4 || ir < 1.6); gold = al && ir < 3.8 && ir >= 1.6; }
          if (sym === 'star') { const th = Math.atan2(sv, su), rr = Math.hypot(su, sv); ink = rr < 11 * (0.28 + 0.72 * Math.abs(Math.cos(2 * th)) ** 6); }
          if (Math.abs(v) > h / 2 - 11 * s && Math.abs(u) < w / 2 - 7 * s && Math.abs(Math.abs(v) - (h / 2 - 8 * s)) < 0.7 * s) ink = true;
          if (ink) c = [40, 30, 44]; else if (gold) c = [176, 138, 62];
        }
        px.rgb = c; px.h = z + 0.03 + k * 0.012 + 0.008 * Math.min(1, edge / (3 * s)); px.hMode = 'set'; px.kind = 'paint'; px.metal = 0; px.rough = 0.6;
      });
    });
  }

  /* ---------- os, clés, breloques ---------- */
  function bone(L, x0, y0, x1, y1, w, z, col = PAL.bone) {
    const a = Math.atan2(y1 - y0, x1 - x0); const nx = -Math.sin(a), ny = Math.cos(a);
    L.taper([[x0, y0], [x1, y1]], [w * 0.55, w * 0.55], { albedo: col, base: z, peak: z + 0.1, kind: 'bone', rough: 0.6 });
    for (const [ex, ey] of [[x0, y0], [x1, y1]]) for (const d of [-1, 1]) L.dome(ex + nx * d * w * 0.38, ey + ny * d * w * 0.38, w * 0.52, { albedo: col, base: z + 0.02, peak: z + 0.12, kind: 'bone', rough: 0.6 });
  }
  function key(L, x, y, s, rot, z, col = '#6a5a3c') {
    const P2 = (u, v) => localPts(x, y, rot, s, [[u, v]])[0];
    L.torus(x, y, 7 * s, 7 * s, rot, 0.45, { albedo: col, base: z, peak: z + 0.1, ...BRASS });
    L.taper([P2(7, 0), P2(38, 0)], [3.4 * s, 3.4 * s], { albedo: col, base: z, peak: z + 0.08, ...BRASS });
    L.fill(poly(localPts(x, y, rot, s, [[30, 1], [37, 1], [37, 9], [34, 9], [34, 6], [30, 6]])), { albedo: col, height: z + 0.06, ...BRASS, op: 'source-over' });
    L.dome(...P2(9, 0), 2.6 * s, { albedo: col, base: z + 0.04, peak: z + 0.12, ...BRASS });
  }
  function smallBell(L, x, y, s, z) {
    Pr.pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(x - 3 * s, y); ctx.quadraticCurveTo(x - 7 * s, y + 2 * s, x - 8 * s, y + 11 * s); ctx.lineTo(x + 8 * s, y + 11 * s); ctx.quadraticCurveTo(x + 7 * s, y + 2 * s, x + 3 * s, y); ctx.closePath(); }, { base: z, lift: 0.1, radius: 5 * s, ...BRASS, color: (gx, gy, t) => mix(shade([120, 100, 60], 0.6 + 0.45 * t), [70, 100, 84], 0.3) });
    L.dome(x, y + 12 * s, 2 * s, { albedo: '#3a3020', base: z + 0.06, peak: z + 0.1, ...BRASS });
  }
  function vial(L, x, y, s, z, liquid = '#6a2a8a') {
    const c0 = hex(liquid);
    L.paint(Pr.roundRectAt(x, y + 11 * s, 9 * s, 16 * s, 0, 3 * s), (gx, gy, px) => { const du = (gx - x) / (4.5 * s); const prof = Math.sqrt(Math.max(0, 1 - du * du)); px.rgb = mix(shade(c0, 0.5 + 0.5 * prof), [220, 220, 230], Math.exp(-(((du + 0.45) / 0.18) ** 2)) * 0.5); px.h = z + 0.06 * prof; px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.08; px.e = c0.map((v) => v * 0.18); });
    L.fill(Pr.roundRectAt(x, y + 2 * s, 6 * s, 4 * s, 0, 1), { albedo: '#6a4a2a', height: z + 0.06, kind: 'wood', rough: 0.7, op: 'source-over' });
  }
  function rag(L, x, y, len, w, z, col, seed = 1) {
    const r = rng(seed); const bend = (r() - 0.5) * 10;
    const pts = bezierPts([x, y], [x + bend * 0.3, y + len * 0.35], [x + bend, y + len * 0.7], [x + bend * 1.2, y + len], 12);
    L.taper(pts, (t) => w * (1 - 0.25 * t) * (t > 0.86 ? 0.6 + 0.4 * Math.sin(t * 60) ** 2 : 1), { albedo: col, base: z, peak: z + 0.05, kind: 'cloth', rough: 0.92 });
  }
  // Corde tendue avec des breloques pendues : os, clés, crânes, plumes, clochettes, chiffons, fioles.
  function charmString(L, x0, y0, x1, y1, sag, items, z, o = {}) {
    const N = 60; const pts = bezierPts([x0, y0], [lerp(x0, x1, 0.3), Math.max(y0, y1) + sag], [lerp(x0, x1, 0.7), Math.max(y0, y1) + sag], [x1, y1], N);
    const r = rng(o.seed ?? 5); const sc = o.scale ?? 1.3;
    items.forEach((type, k) => {
      const [px, py] = pts[Math.round(((k + 1) / (items.length + 1)) * N)]; const drop = (6 + r() * 10) * sc; const hx = px + (r() - 0.5) * 3, hy = py + drop;
      if (type !== 'rag') L.stroke(poly([[px, py], [hx, hy]], false), 1.1, { albedo: PAL.rope, height: z + 0.02, kind: 'cloth', rough: 0.9 });
      if (type === 'bone') bone(L, hx - 7 * sc, hy + 2 * sc, hx + 6 * sc, hy + 16 * sc, 5 * sc, z + 0.02);
      else if (type === 'key') key(L, hx, hy + 6 * sc, 0.5 * sc, Math.PI / 2 + (r() - 0.5) * 0.3, z + 0.02);
      else if (type === 'skull') skull(L, hx, hy + 9 * sc, 0.3 * sc, (r() - 0.5) * 0.3, { base: z + 0.02, lift: 0.14, seed: k + 2, albedo: PAL.bone });
      else if (type === 'feather') feather(L, hx, hy, 30 * sc, 8 * sc, Math.PI / 2 + (r() - 0.5) * 0.4, { albedo: '#26262e', rachis: '#4a4a52', base: z + 0.02, peak: z + 0.08, seed: k, curve: 0.05, rough: 0.5 });
      else if (type === 'bell') smallBell(L, hx, hy, 0.9 * sc, z + 0.02);
      else if (type === 'vial') vial(L, hx, hy, 0.9 * sc, z + 0.02, ['#6a2a8a', '#2a7a5a', '#8a5a1a'][k % 3]);
      else if (type === 'rag') rag(L, px, py - 1, (24 + r() * 14) * sc, 7 * sc, z + 0.01, PAL.rags[k % PAL.rags.length], k + 3);
      else if (type === 'tooth') L.taper([[hx, hy], [hx + 1, hy + 11 * sc]], [4.4 * sc, 0.8], { albedo: '#d8ccaa', base: z + 0.02, peak: z + 0.08, kind: 'bone', rough: 0.5 });
    });
    L.stroke(poly(pts, false), 1.8, { albedo: PAL.rope, height: z + 0.06, kind: 'cloth', rough: 0.9 });
  }

  /* ---------- crâne avec bougie verte (y = base du crâne) ---------- */
  function skullCandle(L, x, y, s, z) {
    skull(L, x, y - 24 * s, 0.62 * s, 0, { base: z, lift: 0.3, seed: 7, albedo: PAL.bone });
    greenCandle(L, x + 1 * s, y - 42 * s, 24 * s, z + 0.3, { w: 11 * s, halo: 50 });
    const r = rng(Math.round(x));
    for (let k = 0; k < 4; k += 1) { const dx = (-9 + k * 6 + r() * 3) * s; L.taper([[x + dx, y - 44 * s], [x + dx + (r() - 0.5) * 2, y - (36 - r() * 10) * s]], [3.4 * s, 2 * s], { albedo: '#c8c0a8', base: z + 0.32, peak: z + 0.38, kind: 'wax', rough: 0.4 }); }
  }

  /* ---------- symboles peints à l'os : œil, lune, étoile ---------- */
  function paintSymbol(L, type, x, y, s, rot, z, col = PAL.bone) {
    const paint = { albedo: col, height: z, kind: 'paint', rough: 0.55 };
    if (type === 'eye') {
      const almond = localPts(x, y, rot, s, Array.from({ length: 25 }, (_, i) => { const t = (i / 24) * TAU; return [Math.cos(t) * 13, Math.sin(t) * 6.4 * (1 - 0.15 * Math.cos(t) ** 2)]; }));
      L.stroke(poly(almond), 2.4 * s, paint);
      L.stroke(circle(4.2 * s, x, y), 2 * s, paint);
      L.fill(circle(1.8 * s, x, y), { ...paint });
      for (const d of [-1, 0, 1]) L.stroke(poly(localPts(x, y, rot, s, [[d * 7, -7.5], [d * 9.5, -11.5]]), false), 1.6 * s, paint);
    } else if (type === 'moon') {
      const [bx, by] = localPts(x, y, rot, s, [[4.8, -2.4]])[0];
      L.paint(circle(9.5 * s, x, y), (gx, gy, px) => { if (Math.hypot(gx - bx, gy - by) < 8 * s) { px.skip = true; return; } px.rgb = hex(col); px.h = z; px.hMode = 'max'; px.kind = 'paint'; px.metal = 0; px.rough = 0.55; });
    } else if (type === 'star') {
      const pts = []; for (let k = 0; k < 8; k += 1) { const a = rot + (k / 8) * TAU - Math.PI / 2; const rr = (k % 2 ? 3 : 9.5) * s; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
      L.fill(poly(pts), paint);
    } else if (type === 'dot') {
      L.fill(circle(2.2 * s, x, y), paint);
    }
  }

  root.Strange = { PAL, greenCandle, greenLantern, crow, birdcage, crystalBall, eyeJar, tarotFan, bone, key, smallBell, vial, rag, charmString, skullCandle, paintSymbol, mix, shade };
}(window));
