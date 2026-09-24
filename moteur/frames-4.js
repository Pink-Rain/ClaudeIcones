// Labo Eraser — cadres épiques 16 à 20 (hors application).
(function (root) {
  'use strict';
  const { C, TAU, rng, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample } = root.Relief;
  const { ringText, beads, rope, P, circle, ringPath, arcPath, sectorPath, polar, polarPts, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, rivet, gem, leaf } = root.Helpers;
  const { add, innerLip, FONT, glowDot, cutOpening, angleDiff } = root.FrameKit;

  /* ------------------------------------------------------------------ */
  /* 16 — Miroir de la Lune elfique : filigrane d'argent, croissants, pierres de lune. */
  add('moon', 'Miroir de la Lune elfique', (L) => {
    const silver = { kind: 'silver', metal: 0.95, rough: 0.26 };
    const S = '#c3c4c8';
    const moonstone = (x, y, rad, glow = 0.55) => gem(L, x, y, rad, { color: '#b9c6d8', cut: 'cabochon', setting: 1.6, setKind: 'silver', setAlbedo: S, base: 0.5, lift: 0.34, glow: `rgba(150,190,255,${glow})`, glowSize: 1.8 });
    L.fill(ringPath(166, 186), { albedo: '#b4b5ba', height: ringStyle(C, C, 166, 186, 0.3, 0.52, 'round'), ...silver });
    beads(L, 190, 110, 1.6, { albedo: S, ...silver, base: 0.3, peak: 0.44 });
    // Filigrane : volutes en coup de fouet, symétriques.
    const wire = (pts, w = 3.2) => L.taper(pts, [w, w * 0.45], { albedo: S, base: 0.34, peak: 0.6, ...silver });
    for (let k = 0; k < 6; k += 1) {
      for (const m of [-1, 1]) {
        const a = -Math.PI / 2 + m * (0.35 + k * 0.48);
        const d = m;
        const p0 = P(192, a), p1 = P(214, a + d * 0.12), p2 = P(236, a + d * 0.05), p3 = P(244, a + d * 0.24);
        const s1 = bezierPts(p0, p1, p2, p3, 30);
        wire(s1);
        const sp = spiralPts(p3[0] - Math.cos(a) * 9, p3[1] - Math.sin(a) * 9, 9, 1.5, a, d * 1.4, 30);
        wire(sp, 2.6);
        const q = bezierPts(P(196, a + d * 0.2), P(222, a + d * 0.32), P(206, a + d * 0.42), P(226, a + d * 0.5), 24);
        wire(q, 2.4);
        leaf(L, ...P(218, a + d * 0.2), 13, 6, a + d * 1.6, { albedo: S, kind: 'silver', metal: 0.95, rough: 0.3, base: 0.36, peak: 0.56, veins: false, ribWidth: 0.8 });
        for (let g = 0; g < 3; g += 1) L.dome(...P(200 + g * 12, a + d * (0.36 + g * 0.02)), 1.6, { albedo: S, base: 0.4, peak: 0.54, ...silver });
      }
      const [mx, my] = P(214, Math.PI / 2 + (k - 2.5) * 0.9);
      if (k !== 2 && k !== 3) moonstone(mx, my, 5.5, 0.4);
    }
    // Grand croissant au sommet, qui berce une pierre de lune.
    const cx = C, cy = 44;
    L.fill(circle(38, cx, cy), { albedo: S, height: domeStyle(cx, cy, 38, 0.46, 0.84), ...silver, clip: (ctx) => { ctx.beginPath(); ctx.rect(0, 0, 512, 512); ctx.arc(cx, cy - 12, 33, 0, TAU, true); }, clipRule: 'evenodd' });
    L.engrave((ctx) => { ctx.beginPath(); ctx.arc(cx, cy, 33, 0.25, Math.PI - 0.25); }, 1.2, 0.3);
    moonstone(cx, cy - 6, 14, 0.7);
    for (const [sx, sy, sz] of [[cx - 58, 28, 6], [cx + 60, 34, 5], [cx - 44, 8, 3.5], [cx + 42, 10, 4]]) {
      L.fill(poly([[sx, sy - sz * 2], [sx + sz * 0.45, sy - sz * 0.45], [sx + sz * 2, sy], [sx + sz * 0.45, sy + sz * 0.45], [sx, sy + sz * 2], [sx - sz * 0.45, sy + sz * 0.45], [sx - sz * 2, sy], [sx - sz * 0.45, sy - sz * 0.45]]), { albedo: S, height: domeStyle(sx, sy, sz * 2, 0.4, 0.7), ...silver, emissive: 'rgba(170,200,255,0.25)' });
    }
    // Goutte de pierre de lune en bas, suspendue à un petit croissant.
    const [bx, by] = P(236, Math.PI / 2);
    L.fill(circle(18, bx, by - 6), { albedo: S, height: domeStyle(bx, by - 6, 18, 0.44, 0.74), ...silver, clip: (ctx) => { ctx.beginPath(); ctx.rect(0, 0, 512, 512); ctx.arc(bx, by + 2, 16, 0, TAU, true); }, clipRule: 'evenodd' });
    L.ellipse(bx, by + 4, 7, 10, 0, { albedo: '#b9c6d8', base: 0.5, peak: 0.86, kind: 'glass', rough: 0.08 });
    L.glow(glowDot(bx, by + 4, 16, 'rgba(150,190,255,0.5)'));
    innerLip(L, 160, silver, S, 7);
    return {
      opening: 162,
      options: { seed: 16, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.25, 1.3, 1.5] }, { dir: [0.7, 0.45, 0.5], color: [0.24, 0.18, 0.36], shadow: false }], room: [0.3, 0.3, 0.36], tint: [0.98, 0.99, 1.05], saturation: 0.8 },
      portrait: { tint: 'rgba(60,70,130,0.1)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 170, C, C, 262); g.addColorStop(0, 'rgba(130,120,220,0.3)'); g.addColorStop(1, 'rgba(60,50,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 17 — Laurier impérial : porphyre gravé d'or, couronne de laurier dorée, ruban pourpre. */
  add('laurel', 'Laurier impérial', (L) => {
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.36 };
    const f = getFields();
    // Anneau de porphyre poli.
    L.paint(ringPath(164, 210), (x, y, px) => {
      const rr = Math.hypot(x - C, y - C); const u = (rr - 164) / 46;
      const n = sample(f.mid, x * 1.5, y * 1.5), sp = sample(f.fine, x * 1.1, y * 1.1);
      px.rgb = sp > 0.9 ? [150, 120, 120] : [70 + 24 * n, 24 + 10 * n, 34 + 12 * n];
      px.h = 0.3 + 0.14 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)); px.hMode = 'set'; px.kind = 'stone'; px.metal = 0; px.rough = 0.18;
    });
    ringText(L, 'IMPERATOR · INVICTVS · SPQR · ', 187, { size: 15, depth: 0.5, albedo: '#b8923e', kind: 'gold', metal: 0.9, rough: 0.4 });
    // Deux branches de laurier depuis le nœud du bas jusqu'au sommet.
    const r = rng(171);
    for (const m of [-1, 1]) {
      const stem = []; for (let i = 0; i <= 60; i += 1) { const t = i / 60; stem.push(P(226 - 4 * Math.sin(Math.PI * t), Math.PI / 2 + m * (0.28 + t * (Math.PI - 0.5)))); }
      L.taper(stem, [5, 2.5], { albedo: '#9c7a3c', base: 0.36, peak: 0.6, ...gilt });
      for (let k = 0; k < 22; k += 1) {
        const t = 0.04 + (k / 22) * 0.94; const idx = Math.round(t * 60); const p = stem[idx], q = stem[Math.min(60, idx + 1)];
        const dir = Math.atan2(q[1] - p[1], q[0] - p[0]);
        for (const side of [-1, 1]) {
          const ang = dir + side * (0.55 + r() * 0.15);
          const len = 26 + r() * 6 - t * 6;
          leaf(L, p[0], p[1], len, 11 - t * 2, ang, { albedo: ['#b08c42', '#9e7c3a', '#bf9a4c'][k % 3], kind: 'gold', metal: 0.95, rough: 0.34, base: 0.44 + k * 0.004, peak: 0.66 + k * 0.004, op: 'source-over', ribDepth: 0.2 });
        }
        if (k % 4 === 2) L.dome(p[0] + Math.cos(dir + Math.PI / 2) * 6, p[1] + Math.sin(dir + Math.PI / 2) * 6, 3.4, { albedo: '#7a1f1a', base: 0.6, peak: 0.78, kind: 'glass', rough: 0.2 });
      }
    }
    // Ruban pourpre noué en bas, pans frangés d'or.
    const [kx, ky] = P(226, Math.PI / 2);
    const cloth = { kind: 'cloth', metal: 0, rough: 0.8 };
    for (const m of [-1, 1]) {
      L.fill(smoothPath([[kx, ky], [kx + m * 20, ky - 18], [kx + m * 38, ky - 13], [kx + m * 33, ky + 8], [kx + m * 15, ky + 5]], true), { albedo: '#33091f', height: domeStyle(kx + m * 22, ky - 5, 28, 0.6, 0.84), ...cloth, op: 'source-over' });
      const tail = [[kx + m * 6, ky + 6], [kx + m * 18, ky + 18], [kx + m * 14, ky + 30], [kx + m * 28, ky + 40]];
      L.taper(tail, [15, 12], { albedo: '#2c0819', base: 0.56, peak: 0.74, ...cloth });
      L.stroke(poly([[kx + m * 22, ky + 44], [kx + m * 34, ky + 36]], false), 3, { albedo: '#b8923e', height: 0.74, ...gilt, dash: [1.5, 1.5] });
    }
    L.dome(kx, ky, 10, { albedo: '#33091f', base: 0.66, peak: 0.88, ...cloth });
    // Camée au sommet.
    L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(C, 36, 20, 26, 0, 0, TAU); }, { albedo: '#a8843e', height: domeStyle(C, 36, 26, 0.5, 0.7), ...gilt, op: 'source-over' });
    L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(C, 36, 15, 21, 0, 0, TAU); }, { albedo: '#4b2a22', height: 0.64, kind: 'stone', rough: 0.3, op: 'source-over' });
    const profile = smoothPath([[C - 3, 20], [C + 5, 22], [C + 8, 30], [C + 11, 34], [C + 7, 36], [C + 8, 41], [C + 4, 44], [C + 2, 52], [C - 8, 52], [C - 10, 40], [C - 9, 28]], true);
    L.fill(profile, { albedo: '#e3d6c0', height: domeStyle(C, 36, 18, 0.66, 0.82), kind: 'bone', rough: 0.45 });
    L.engrave(smoothPath([[C - 9, 26], [C - 2, 24], [C + 4, 26]]), 1, 0.3);
    innerLip(L, 158, gilt, '#a8843e', 7);
    return {
      opening: 160,
      options: { seed: 17, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.7, 1.5, 1.2] }, { dir: [0.7, 0.45, 0.5], color: [0.2, 0.12, 0.2], shadow: false }], room: [0.3, 0.26, 0.24], saturation: 0.86 },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 18 — Phénix : plumes de flammes en tourbillon, tête couronnée, or calciné, braises. */
  add('phoenix', 'Phénix', (L) => {
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.42 };
    const r = rng(181);
    const flame = (t) => (t < 0.5 ? `rgb(${Math.round(120 + 60 * t)},${Math.round(22 + 30 * t)},${Math.round(14 + 6 * t)})` : `rgb(${Math.round(150 + 90 * (t - 0.5) * 2)},${Math.round(37 + 110 * (t - 0.5) * 2)},${Math.round(17 + 30 * (t - 0.5) * 2)})`);
    // Deux couches de plumes-flammes qui tourbillonnent.
    for (const layer of [0, 1]) {
      const n = layer ? 26 : 30;
      for (let k = 0; k < n; k += 1) {
        const a = (k / n) * TAU + layer * 0.12 + (r() - 0.5) * 0.04;
        const len = (layer ? 40 : 58) + r() * 22;
        const r0 = layer ? 196 : 200;
        const sweep = 0.22 + r() * 0.16;
        const pts = bezierPts(P(r0, a), P(r0 + len * 0.4, a + sweep * 0.2), P(r0 + len * 0.75, a + sweep * 0.75), P(Math.min(255, r0 + len), a + sweep), 28);
        L.taper(pts, (t) => (layer ? 16 : 20) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.2)), 0.8) + 1, { albedo: (t) => flame(t * 0.9 + layer * 0.1), base: 0.32 + layer * 0.08, peak: (t) => 0.62 + layer * 0.08 - 0.15 * t, kind: 'cloth', rough: 0.55, emissive: (t) => `rgba(255,${Math.round(60 + 120 * t)},20,${Math.max(0, (t - 0.55) * 0.7) * (layer ? 0.9 : 0.7)})` });
        L.engrave(poly(pts.slice(2, 22), false), 1, 0.2);
      }
    }
    // Anneau d'or calciné.
    L.fill(ringPath(166, 198), { albedo: '#8a6a34', height: ringStyle(C, C, 166, 198, 0.46, 0.64, 'bevel'), ...gilt, op: 'source-over' });
    const f = getFields();
    L.paint(ringPath(166, 198), (x, y, px) => { const n = sample(f.mid, x * 1.4, y * 1.4); const soot = smooth(0.5, 0.7, n); if (soot < 0.05) { px.skip = true; return; } px.rgb = [30, 22, 18]; px.alpha = soot * 0.75; px.rough = 0.9; });
    for (let k = 0; k < 12; k += 1) { const [x, y] = P(182, (k / 12) * TAU + Math.PI / 12); gem(L, x, y, 4.2, { color: '#9a1a0e', cut: 'cabochon', setting: 1.4, setAlbedo: '#8a6a34', base: 0.62, lift: 0.22, glow: 'rgba(255,80,20,0.35)' }); }
    // Tête de phénix au sommet, bec crochu, aigrette de flammes.
    const hx = C + 6, hy = 50;
    const T = (pts) => localPts(hx, hy, 0, 1.25, pts);
    for (const [ang, len] of [[-2.2, 46], [-1.9, 56], [-1.6, 50], [-1.3, 40]]) L.taper(bezierPts(T([[-6, -10]])[0], T([[-6 + Math.cos(ang) * len * 0.5 - 8, -10 + Math.sin(ang) * len * 0.5]])[0], T([[-6 + Math.cos(ang) * len * 0.8 - 14, -10 + Math.sin(ang) * len * 0.8]])[0], T([[-6 + Math.cos(ang) * len - 10, -10 + Math.sin(ang) * len]])[0], 20), (t) => 9 * (1 - t) + 1, { albedo: (t) => flame(t), base: 0.6, peak: 0.84, kind: 'cloth', rough: 0.5, emissive: (t) => `rgba(255,${Math.round(140 - 90 * t)},20,${0.6 - 0.5 * t})` });
    const head = T([[-26, 18], [-22, -2], [-12, -14], [4, -18], [18, -12], [26, -4], [40, 2], [30, 6], [22, 10], [8, 20], [-6, 28]]);
    L.stroke(smoothPath(head, true), 6, { albedo: '#2a0f08', height: 0.5, op: 'source-over', kind: 'cloth', rough: 0.6 });
    L.fill(smoothPath(head, true), { albedo: '#8e2a12', height: domeStyle(hx, hy, 44, 0.6, 0.96), kind: 'cloth', rough: 0.5, op: 'source-over' });
    L.fill(smoothPath(T([[20, -8], [40, 0], [34, 10], [26, 14], [22, 4]]), true), { albedo: '#c9a24a', height: domeStyle(hx + 30, hy + 2, 16, 0.8, 0.96), ...gilt, op: 'source-over' });
    L.engrave(smoothPath(T([[24, 4], [36, 4]])), 1, 0.4);
    const [ex, ey] = T([[10, -6]])[0];
    L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(ex, ey, 4.5, 3.2, -0.2, 0, TAU); }, { albedo: '#ffd27a', height: 0.95, kind: 'glass', rough: 0.05, emissive: 'rgba(255,210,120,0.95)', op: 'source-over' });
    for (let k = 0; k < 5; k += 1) L.engrave(smoothPath(T([[-18 + k * 6, 16 - k * 2], [-10 + k * 6, 8 - k * 2], [-6 + k * 6, -2 - k * 2]])), 1, 0.25);
    innerLip(L, 160, gilt, '#8a6a34', 7);
    cutOpening(L, 160);
    return {
      opening: 162,
      options: { seed: 18, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.45, 1.15, 0.85] }, { pos: [C, C, 80], radius: 220, color: [0.9, 0.3, 0.08] }, { dir: [0.7, 0.45, 0.5], color: [0.3, 0.08, 0.03], shadow: false }], room: [0.2, 0.13, 0.09], saturation: 0.9, bloom: 0.55 },
      portrait: { tint: 'rgba(160,60,10,0.12)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 180, C, C, 262); g.addColorStop(0, 'rgba(255,90,20,0.35)'); g.addColorStop(1, 'rgba(160,20,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
      front(ctx) { const r2 = rng(188); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 36; i += 1) { const [x, y] = P(220 + r2() * 40, r2() * TAU); const s2 = 0.6 + r2() * 1.6; const g = ctx.createRadialGradient(x, y, 0, x, y, s2 * 3); g.addColorStop(0, 'rgba(255,230,160,1)'); g.addColorStop(0.4, 'rgba(255,140,30,0.8)'); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s2 * 3, 0, TAU); ctx.fill(); } ctx.restore(); },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 19 — Rosace gothique : remplage de pierre, lancettes de vitrail rétroéclairées. */
  add('rose', 'Rosace gothique', (L) => {
    const stone = { kind: 'stone', metal: 0, rough: 0.9 };
    const S = '#8d877b';
    const jewels = [[128, 16, 22], [22, 40, 118], [22, 84, 48], [160, 104, 24], [76, 26, 86], [128, 16, 22], [22, 40, 118]];
    const r = rng(191);
    const n = 16;
    L.fill(ringPath(170, 250), { albedo: S, height: ringStyle(C, C, 170, 250, 0.4, 0.62, 'bevel'), ...stone });
    const lancet = (a0, a1, r0, r1, r2) => (ctx) => { const mid = (a0 + a1) / 2; ctx.beginPath(); ctx.moveTo(...P(r0, a0)); ctx.lineTo(...P(r1, a0)); ctx.quadraticCurveTo(...P(r2 - 3, a0 + 0.004), ...P(r2, mid)); ctx.quadraticCurveTo(...P(r2 - 3, a1 - 0.004), ...P(r1, a1)); ctx.lineTo(...P(r0, a1)); ctx.arc(C, C, r0, a1, a0, true); ctx.closePath(); };
    const RUBY = [170, 14, 24], SAPH = [20, 44, 170], GOLDG = [190, 128, 24], EMER = [18, 110, 52];
    const glassFill = (path, c, clip, k2 = 0.42) => L.fill(path, { albedo: `rgb(${c[0] * 0.4 | 0},${c[1] * 0.4 | 0},${c[2] * 0.4 | 0})`, height: 0.3, kind: 'glass', rough: 0.25, op: 'source-over', emissive: `rgba(${c[0] * k2 | 0},${c[1] * k2 | 0},${c[2] * k2 | 0},0.85)`, clip });
    const lead = { albedo: '#242220', height: 0.42, kind: 'iron', metal: 0.4, rough: 0.7 };
    for (let k = 0; k < n; k += 1) {
      const a0 = (k / n) * TAU + 0.035, a1 = ((k + 1) / n) * TAU - 0.035; const mid = (a0 + a1) / 2;
      const shape = lancet(a0, a1, 182, 220, 242);
      const inner = lancet(a0 + 0.012, a1 - 0.012, 185, 219, 239);
      const dom = k % 2 ? RUBY : SAPH;
      glassFill(shape, [120, 70, 20], undefined, 0.3);
      glassFill(inner, dom, shape);
      // Bordure perlée : petits segments ambre et verts.
      for (let q = 0; q < 6; q += 1) { const rr = 188 + q * 6; for (const side of [a0 + 0.009, a1 - 0.009]) { const [x, y] = P(rr, side); L.stroke(poly([[x, y - 0.1], [x, y + 0.1]], false), 1, lead); } }
      // Médaillon central.
      const [mx, my] = P(206, mid);
      glassFill(circle(9, mx, my), k % 3 === 0 ? EMER : GOLDG, undefined, 0.5);
      L.stroke(circle(9, mx, my), 2, lead);
      L.stroke(poly([P(186, mid), P(197, mid)], false), 1.8, lead);
      L.stroke(poly([P(215, mid), P(226, mid)], false), 1.8, lead);
      L.stroke(inner, 1.8, lead);
      // Petit trilobe doré dans la pointe.
      const [tx2, ty2] = P(230, mid); for (let q = 0; q < 3; q += 1) { const qa = (q / 3) * TAU + mid; glassFill(circle(2.6, tx2 + Math.cos(qa) * 2.6, ty2 + Math.sin(qa) * 2.6), GOLDG, undefined, 0.5); }
      L.stroke(circle(5.4, tx2, ty2), 1.4, lead);
      // Grisaille : traits peints qui éteignent la lumière.
      for (let g = 0; g < 8; g += 1) { const [gx, gy] = P(190 + r() * 26, a0 + 0.02 + r() * (a1 - a0 - 0.04)); const gpath = poly([[gx, gy], [gx + (r() - 0.5) * 7, gy + (r() - 0.5) * 7]], false); L.stroke(gpath, 1, { albedo: 'rgba(20,14,10,0.5)', keepMaterial: true }); L.e.save(); L.e.globalCompositeOperation = 'destination-out'; L.e.lineWidth = 1.6; gpath(L.e); L.e.strokeStyle = 'rgba(0,0,0,0.6)'; L.e.stroke(); L.e.restore(); }
      L.stroke(shape, 2.2, lead);
      // Meneau de pierre et trilobe.
      L.fill(sectorPath(178, 246, a1 - 0.004, a1 + 0.074), { albedo: S, height: ringStyle(C, C, 178, 246, 0.56, 0.62, 'bevel'), ...stone, op: 'source-over' });
      const [tx, ty] = P(245, a1 + 0.035);
      for (let q = 0; q < 3; q += 1) { const qa = (q / 3) * TAU + a1; L.torus(tx + Math.cos(qa) * 4, ty + Math.sin(qa) * 4, 4.2, 4.2, 0, 0.45, { albedo: S, base: 0.56, peak: 0.72, ...stone }); }
    }
    // Anneau intérieur à quadrilobes.
    L.fill(ringPath(166, 184), { albedo: '#7d776c', height: ringStyle(C, C, 166, 184, 0.46, 0.64, 'round'), ...stone, op: 'source-over' });
    for (let k = 0; k < 24; k += 1) { const [x, y] = P(175, (k / 24) * TAU); for (let q = 0; q < 4; q += 1) L.engrave(circle(2.4, x + Math.cos(q * Math.PI / 2) * 2.6, y + Math.sin(q * Math.PI / 2) * 2.6), 1, 0.3); }
    L.fill(ringPath(244, 252), { albedo: '#7d776c', height: ringStyle(C, C, 244, 252, 0.5, 0.7, 'round'), ...stone, op: 'source-over' });
    return {
      opening: 166,
      options: { seed: 19, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.15, 1.1, 1.05] }, { dir: [0.7, 0.45, 0.5], color: [0.15, 0.15, 0.22], shadow: false }], room: [0.2, 0.2, 0.22], saturation: 1, bloom: 0.3 },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 20 — Reine-Araignée : obsidienne veinée d'améthyste, toile d'argent, araignée couronnée. */
  add('spider', 'Reine-Araignée', (L) => {
    const obs = { kind: 'obsidian', metal: 0, rough: 0.12 };
    const chitin = { kind: 'obsidian', metal: 0, rough: 0.2 };
    const f = getFields();
    const r = rng(201);
    // Toile d'argent derrière.
    const spokes = 24;
    for (let k = 0; k < spokes; k += 1) { const a = (k / spokes) * TAU + 0.07; L.stroke(poly([P(200, a), P(262, a)], false), 1.1, { albedo: '#b7b9c2', height: 0.3, kind: 'silver', metal: 0.9, rough: 0.3 }); }
    for (const rr of [222, 236, 250]) for (let k = 0; k < spokes; k += 1) { const a0 = (k / spokes) * TAU + 0.07, a1 = ((k + 1) / spokes) * TAU + 0.07; const p0 = P(rr, a0), p1 = P(rr, a1), m = P(rr - 5, (a0 + a1) / 2); L.stroke((ctx) => { ctx.beginPath(); ctx.moveTo(...p0); ctx.quadraticCurveTo(...m, ...p1); }, 0.9, { albedo: '#a9abb5', height: 0.3, kind: 'silver', metal: 0.9, rough: 0.35 }); if (r() < 0.3) L.dome(...P(rr - 3, (a0 + a1) / 2 + (r() - 0.5) * 0.1), 1.6, { albedo: '#dfe6ee', base: 0.32, peak: 0.42, kind: 'glass', rough: 0.05 }); }
    // Anneau d'obsidienne veiné.
    L.paint(ringPath(164, 214), (x, y, px) => {
      const rr = Math.hypot(x - C, y - C); const u = (rr - 164) / 50;
      const v = Math.abs(sample(f.mid, x * 1.2, y * 1.2) - 0.5); const vein = (1 - smooth(0.003, 0.012, v)) * smooth(0.4, 0.7, sample(f.low, x * 3, y * 3));
      const n = sample(f.low, x * 2, y * 2);
      px.rgb = [14 + 10 * n + vein * 70, 10 + 6 * n + vein * 20, 18 + 14 * n + vein * 110];
      px.h = 0.3 + 0.2 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) - vein * 0.03; px.hMode = 'set'; px.kind = 'obsidian'; px.metal = 0; px.rough = 0.1;
      if (vein > 0.2) px.e = [110 * vein, 30 * vein, 190 * vein];
    });
    // Pattes articulées qui enserrent l'anneau.
    const leg = (pts, w) => {
      L.taper(pts.slice(0, 2), [w, w * 0.8], { albedo: '#241d2a', base: 0.55, peak: 0.95, ...chitin, gap: 3, gapAlbedo: '#0c0a0e', gapHeight: 0.4, over: true });
      L.taper(pts.slice(1, 3), [w * 0.8, w * 0.62], { albedo: '#241d2a', base: 0.6, peak: 0.98, ...chitin, gap: 3, gapAlbedo: '#0c0a0e', gapHeight: 0.45, over: true });
      L.taper(pts.slice(2, 4), [w * 0.62, 1.6], { albedo: '#241d2a', base: 0.62, peak: 0.94, ...chitin, gap: 2, gapAlbedo: '#0c0a0e', gapHeight: 0.45, over: true });
      for (const j of [1, 2]) L.dome(pts[j][0], pts[j][1], w * 0.55, { albedo: '#2a2230', base: 0.66, peak: 0.98, ...chitin });
    };
    const body = [C, 58];
    for (const m of [-1, 1]) {
      leg([[body[0] + m * 14, body[1] + 4], [C + m * 74, 22], [C + m * 156, 40], [C + m * 200, 106]], 15);
      leg([[body[0] + m * 16, body[1] + 10], [C + m * 92, 50], [C + m * 200, 70], [C + m * 240, 168]], 14);
      leg([[body[0] + m * 16, body[1] + 16], [C + m * 94, 78], [C + m * 216, 122], [C + m * 250, 236]], 13);
      leg([[body[0] + m * 14, body[1] + 20], [C + m * 84, 98], [C + m * 198, 196], [C + m * 238, 300]], 12);
    }
    // Corps : céphalothorax, abdomen marqué d'un sablier d'améthyste, yeux.
    L.ellipse(C, 28, 38, 28, 0, { albedo: '#1d1722', base: 0.62, peak: 1, ...chitin });
    L.fill(poly([[C - 11, 12], [C + 11, 12], [C + 2, 28], [C + 11, 44], [C - 11, 44], [C - 2, 28]]), { albedo: '#5a2a8a', height: 1, kind: 'glass', rough: 0.1, emissive: 'rgba(150,70,230,0.55)', op: 'lighten' });
    L.ellipse(C, 66, 24, 19, 0, { albedo: '#221b28', base: 0.64, peak: 0.98, ...chitin });
    for (const [ex, ey, er] of [[-8, 58, 3.6], [8, 58, 3.6], [-15, 62, 2.4], [15, 62, 2.4], [-4, 64, 2], [4, 64, 2], [-11, 68, 1.6], [11, 68, 1.6]]) gem(L, C + ex, ey, er, { color: '#8a1a3a', cut: 'cabochon', setting: 0, base: 0.9, lift: 0.1, glow: 'rgba(255,60,120,0.6)', glowSize: 1.6 });
    for (const m of [-1, 1]) L.taper([[C + m * 7, 80], [C + m * 12, 92], [C + m * 6, 100]], [6, 1.5], { albedo: '#2a2230', base: 0.66, peak: 0.94, ...chitin });
    L.fill(ringPath(158, 166), { albedo: '#7a7c86', height: ringStyle(C, C, 158, 166, 0.3, 0.56, 'round'), kind: 'silver', metal: 0.95, rough: 0.28, op: 'source-over' });
    cutOpening(L, 158);
    return {
      opening: 160,
      options: { seed: 20, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.5, 1.4, 1.65] }, { dir: [0.7, 0.45, 0.5], color: [0.28, 0.12, 0.4], shadow: false }], room: [0.2, 0.18, 0.26], saturation: 0.9 },
      portrait: { tint: 'rgba(60,20,90,0.14)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 170, C, C, 262); g.addColorStop(0, 'rgba(120,50,200,0.3)'); g.addColorStop(1, 'rgba(40,10,80,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });
}(window));
