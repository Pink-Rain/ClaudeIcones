// Labo Eraser — cadres épiques 11 à 15 (hors application).
(function (root) {
  'use strict';
  const { C, TAU, rng, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample } = root.Relief;
  const { ringText, beads, rope, P, circle, ringPath, arcPath, sectorPath, polar, polarPts, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, rivet, gem, chain, sigilPath, feather } = root.Helpers;
  const { add, innerLip, FONT, glowDot, cutOpening, angleDiff } = root.FrameKit;

  /* ------------------------------------------------------------------ */
  /* 11 — Ouroboros : le serpent écailleux qui se mord la queue. */
  add('ouroboros', 'Ouroboros', (L) => {
    const f = getFields();
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.4 };
    const RC = 212, W = 30;
    const a0 = -Math.PI / 2 - 0.3; // cou, derrière la tête
    const span = TAU - 0.34; // le corps fait le tour dans le sens antihoraire
    const halfW = (s) => (s < 0.72 ? W : W * (1 - 0.82 * smooth(0.72, 1, s)));
    L.fill(ringPath(166, 178), { albedo: '#a8884a', height: ringStyle(C, C, 166, 178, 0.3, 0.5, 'round'), ...gilt });
    L.paint(ringPath(170, 252), (x, y, px) => {
      const dx = x - C, dy = y - C; const rr = Math.hypot(dx, dy); let a = Math.atan2(dy, dx);
      let s = (a0 - a) / span; s = ((s % (TAU / span)) + TAU / span) % (TAU / span);
      if (s > 1) { px.skip = true; return; }
      const w = halfW(s); const d = rr - RC; if (Math.abs(d) > w) { px.skip = true; return; }
      const u = d / w;
      const along = s * span * RC;
      const profile = Math.sqrt(Math.max(0, 1 - u * u));
      if (u < -0.5) {
        // Plaques ventrales, claires.
        const band = ((along / 9) % 1 + 1) % 1; const plate = smooth(0, 0.18, band) * smooth(1, 0.82, band);
        px.rgb = [150 + 30 * plate, 132 + 24 * plate, 84 + 16 * plate];
        px.h = 0.3 + 0.5 * profile + 0.03 * plate; px.kind = 'organic'; px.rough = 0.38;
      } else {
        const size = 9 + 3 * (u + 0.5);
        const row = Math.floor((u + 0.5) / 0.25); const off = row % 2 ? 0.5 : 0;
        const cu = along / size + off; const cell = Math.floor(cu); const jr = rng(cell * 31 + row * 7)(); const fu = cu - cell - 0.5 + (jr - 0.5) * 0.15, fv = ((u + 0.5) / 0.25) - row - 0.5;
        const dsc = Math.hypot(fu * 1.2, fv * 1.05 + 0.18);
        const bump = clamp01(1 - dsc * 1.45);
        const rim = smooth(0.4, 0.6, dsc);
        const irid = Math.sin(a * 2.5 + u * 2) * 0.5 + 0.5;
        const n = sample(f.mid, x * 0.8, y * 0.8), hn = sample(f.high, x, y);
        const tone = 0.75 + 0.5 * jr;
        const g = (30 + 40 * bump + 14 * n) * tone;
        px.rgb = [(14 + 18 * bump * irid + 10 * n) * tone, g * (1 - 0.55 * rim), (22 + 26 * bump * (1 - irid) + 10 * n) * tone];
        if (hn > 0.78 && bump > 0.3) px.rgb = [px.rgb[0] + 30, px.rgb[1] + 26, px.rgb[2] + 12];
        px.h = 0.3 + 0.5 * profile + 0.045 * Math.sqrt(bump); px.kind = 'organic'; px.rough = 0.26 + 0.3 * rim; px.metal = 0.25;
      }
      px.hMode = 'set';
    });
    // Tête à la verticale du sommet, gueule refermée sur la queue.
    const hx = C + 4, hy = C - RC + 4;
    const T = (pts) => localPts(hx, hy, 0, 1.3, pts);
    const skullO = T([[-44, -14], [-20, -30], [10, -32], [34, -24], [52, -12], [58, -2], [52, 6], [30, 12], [0, 18], [-30, 22], [-50, 14]]);
    const jaw = T([[-20, 16], [10, 16], [40, 16], [58, 24], [50, 32], [20, 32], [-10, 28]]);
    L.fill(smoothPath(jaw, true), { albedo: '#3a4a36', height: domeStyle(hx + 26, hy + 30, 46, 0.52, 0.8), kind: 'organic', rough: 0.35, metal: 0.2, op: 'source-over' });
    L.engraveFill(smoothPath(T([[58, 8], [40, 12], [20, 14], [22, 20], [44, 22], [58, 22]]), true), 0.5, { albedo: '#120a08' });
    L.fill(smoothPath(skullO, true), { albedo: '#2f4634', height: domeStyle(hx, hy - 8, 78, 0.5, 1), kind: 'organic', rough: 0.3, metal: 0.25, op: 'source-over' });
    // Écailles de la tête (grandes plaques).
    L.engrave(smoothPath(T([[-40, 6], [-10, 10], [20, 8], [52, 2]])), 1.2, 0.3);
    L.engrave(smoothPath(T([[-30, -20], [-6, -26], [22, -24]])), 1, 0.22);
    L.taper(T([[-6, -22], [16, -26], [36, -18]]), [7, 3], { albedo: '#2a3d30', base: 0.8, peak: 1, kind: 'organic', rough: 0.3, metal: 0.2 });
    const [ex, ey] = T([[22, -12]])[0];
    L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(ex, ey, 7.5, 4.6, -0.25, 0, TAU); }, { albedo: '#c78a1c', height: 0.95, kind: 'glass', rough: 0.05, emissive: 'rgba(230,140,20,0.45)', op: 'source-over' });
    L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(ex, ey, 1.3, 4.2, -0.25, 0, TAU); }, { albedo: '#0a0604', height: 0.96, kind: 'glass', rough: 0.05, op: 'source-over' });
    L.engrave(smoothPath(T(spiralPts(52, -6, 2.4, 0.6, 0, 1, 12))), 1.1, 0.4);
    // Crocs qui mordent la queue.
    for (const [fx, fy] of [[50, 10], [40, 12]]) L.taper(T([[fx, fy], [fx - 1, fy + 9]]), [3, 0.4], { albedo: '#efe6cc', base: 0.7, peak: 0.9, kind: 'bone', rough: 0.3 });
    innerLip(L, 162, gilt, '#a8884a', 6);
    return {
      opening: 164,
      options: { seed: 11, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.6, 1.5, 1.3] }, { dir: [0.7, 0.45, 0.5], color: [0.18, 0.26, 0.22], shadow: false }], room: [0.24, 0.26, 0.22], saturation: 0.9 },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 12 — Scarabée d'Héliopolis : or, cloisonné de lapis, turquoise et cornaline, ailes éployées. */
  add('scarab', 'Scarabée d’Héliopolis', (L) => {
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.34 };
    const G = '#a98845';
    const LAPIS = '#1c2c55', TURQ = '#4d8578', CARN = '#7a2a1a';
    const inlay = { kind: 'paint', metal: 0, rough: 0.5 };
    L.fill(ringPath(164, 244), { albedo: G, height: ringStyle(C, C, 164, 244, 0.3, 0.42, 'bevel'), ...gilt });
    // Bande cloisonnée : cellules alternées séparées par de fines cloisons d'or.
    const n = 60; const cols = [LAPIS, TURQ, LAPIS, CARN];
    for (let k = 0; k < n; k += 1) { const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU; L.fill(sectorPath(182, 204, a0 + 0.008, a1 - 0.008), { albedo: cols[k % 4], height: 0.36, ...inlay, op: 'source-over' }); }
    for (let k = 0; k < n; k += 1) { const a = (k / n) * TAU; L.stroke(poly([P(181, a), P(205, a)], false), 2, { albedo: G, height: 0.45, ...gilt }); }
    { const rc = rng(121); for (let k = 0; k < 40; k += 1) { let a = rc() * TAU, rr = 183 + rc() * 20; const pts = [P(rr, a)]; for (let q = 0; q < 4; q += 1) { a += (rc() - 0.5) * 0.03; rr += (rc() - 0.5) * 6; pts.push(P(rr, a)); } L.engrave(poly(pts, false), 0.8, 0.3, { albedo: 'rgba(20,14,8,0.6)' }); } }
    L.stroke(circle(181.5), 2.6, { albedo: G, height: 0.46, ...gilt }); L.stroke(circle(204.5), 2.6, { albedo: G, height: 0.46, ...gilt });
    beads(L, 236, 120, 2.6, { albedo: G, ...gilt, base: 0.36, peak: 0.55 });
    // Ailes éployées : rangées de plumes cloisonnées le long du haut de l'anneau.
    const wingRow = (rIn, rOut, a0, a1, count, colors, h) => {
      for (let k = 0; k < count; k += 1) {
        const t0 = a0 + (a1 - a0) * (k / count), t1 = a0 + (a1 - a0) * ((k + 1) / count);
        const lo = Math.min(t0, t1) + 0.006, hi = Math.max(t0, t1) - 0.006;
        const path = (ctx) => { ctx.beginPath(); ctx.arc(C, C, rOut, lo, hi); const [ex, ey] = P(rOut + (hi - lo) * rOut * 0.5, (lo + hi) / 2); ctx.quadraticCurveTo(ex, ey, ...P(rOut, lo)); ctx.closePath(); };
        const cell = (ctx) => { ctx.beginPath(); ctx.arc(C, C, rOut, lo, hi); ctx.arc(C, C, rIn, hi, lo, true); ctx.closePath(); };
        const feat = (ctx, inset) => { const la = lo + inset / rOut, ha = hi - inset / rOut; const [x0, y0] = P(rIn + inset, la); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.arc(C, C, rOut - (hi - lo) * rOut * 0.5 - inset * 0.2, la, ha); const [xt, yt] = P(rOut - inset, (la + ha) / 2); ctx.quadraticCurveTo(...P(rOut - inset, ha), xt, yt); ctx.quadraticCurveTo(...P(rOut - inset, la), ...P(rOut - (hi - lo) * rOut * 0.5 - inset * 0.2, la)); ctx.lineTo(x0, y0); ctx.arc(C, C, rIn + inset, la, ha); ctx.closePath(); };
        const cellShape = (ctx) => { ctx.beginPath(); const mid = (lo + hi) / 2; const wA = (hi - lo) / 2; ctx.moveTo(...P(rIn, lo)); ctx.lineTo(...P(rOut - wA * rOut, lo)); ctx.quadraticCurveTo(...P(rOut + 2, lo), ...P(rOut + 2, mid)); ctx.quadraticCurveTo(...P(rOut + 2, hi), ...P(rOut - wA * rOut, hi)); ctx.lineTo(...P(rIn, hi)); ctx.closePath(); };
        const innerShape = (ctx) => { ctx.beginPath(); const mid = (lo + hi) / 2; const l2 = lo + 0.012, h2 = hi - 0.012; const wA = (h2 - l2) / 2; ctx.moveTo(...P(rIn + 2, l2)); ctx.lineTo(...P(rOut - 2 - wA * rOut, l2)); ctx.quadraticCurveTo(...P(rOut - 1, l2), ...P(rOut - 1, mid)); ctx.quadraticCurveTo(...P(rOut - 1, h2), ...P(rOut - 2 - wA * rOut, h2)); ctx.lineTo(...P(rIn + 2, h2)); ctx.closePath(); };
        L.fill(cellShape, { albedo: G, height: h + 0.06, ...gilt, op: 'source-over' });
        L.fill(innerShape, { albedo: colors[k % colors.length], height: h, ...inlay, op: 'source-over' });
        void feat;
      }
    };
    for (const m of [-1, 1]) {
      const a0 = -Math.PI / 2 + m * 0.22, a1 = -Math.PI / 2 + m * 1.55;
      wingRow(206, 226, a0, a1, 16, [LAPIS, TURQ], 0.5);
      wingRow(226, 250, a0 + m * 0.12, a1 + m * 0.15, 13, [TURQ, LAPIS, CARN], 0.46);
    }
    // Scarabée poussant le disque solaire.
    const sx = C, sy = 56;
    L.dome(sx, 18, 17, { albedo: CARN, base: 0.5, peak: 0.85, ...inlay, rough: 0.2 });
    L.fill(ringPath(17, 20, sx, 18), { albedo: G, height: 0.7, ...gilt });
    for (const d of [-1, 1]) {
      L.taper([[sx + d * 8, sy - 14], [sx + d * 16, sy - 22], [sx + d * 12, sy - 30]], [3.4, 2], { albedo: G, base: 0.7, peak: 0.86, ...gilt });
      L.taper([[sx + d * 14, sy], [sx + d * 28, sy - 4], [sx + d * 34, sy + 6]], [3.2, 2], { albedo: G, base: 0.66, peak: 0.84, ...gilt });
      L.taper([[sx + d * 12, sy + 14], [sx + d * 26, sy + 22], [sx + d * 30, sy + 34]], [3.2, 2], { albedo: G, base: 0.66, peak: 0.84, ...gilt });
    }
    L.ellipse(sx, sy + 12, 17, 22, 0, { albedo: LAPIS, base: 0.62, peak: 0.95, ...inlay, rough: 0.22 });
    L.stroke((ctx) => { ctx.beginPath(); ctx.ellipse(sx, sy + 12, 17, 22, 0, 0, TAU); }, 2.4, { albedo: G, height: 0.8, ...gilt });
    L.stroke(poly([[sx, sy - 4], [sx, sy + 33]], false), 2, { albedo: G, height: 0.96, ...gilt });
    L.ellipse(sx, sy - 8, 13, 8, 0, { albedo: LAPIS, base: 0.62, peak: 0.9, ...inlay, rough: 0.22 });
    L.stroke((ctx) => { ctx.beginPath(); ctx.ellipse(sx, sy - 8, 13, 8, 0, 0, TAU); }, 2.2, { albedo: G, height: 0.8, ...gilt });
    L.fill(poly([[sx - 9, sy - 15], [sx - 5, sy - 20], [sx, sy - 17], [sx + 5, sy - 20], [sx + 9, sy - 15]]), { albedo: G, height: 0.8, ...gilt });
    // Œil oudjat en bas.
    const [ox, oy] = P(221, Math.PI / 2);
    L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(ox, oy - 2, 26, 12, 0, 0, TAU); }, { albedo: G, height: 0.56, ...gilt, op: 'source-over' });
    L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(ox, oy - 2, 16, 8, 0, 0, TAU); }, { albedo: '#e6dcc4', height: 0.58, kind: 'bone', rough: 0.4, op: 'source-over' });
    L.dome(ox, oy - 2, 6.5, { albedo: LAPIS, base: 0.6, peak: 0.78, ...inlay });
    L.taper([[ox - 26, oy - 16], [ox, oy - 19], [ox + 28, oy - 14]], [3.2, 2.4], { albedo: LAPIS, base: 0.62, peak: 0.72, ...inlay });
    L.taper([[ox - 4, oy + 8], [ox - 6, oy + 18], [ox - 2, oy + 24]], [3, 2], { albedo: LAPIS, base: 0.6, peak: 0.7, ...inlay });
    L.taper(spiralPts(ox + 12, oy + 16, 7, 1, -Math.PI / 2, 1, 24), [3, 1.6], { albedo: LAPIS, base: 0.6, peak: 0.7, ...inlay });
    innerLip(L, 158, gilt, G, 8);
    return {
      opening: 160,
      options: { seed: 12, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.7, 1.5, 1.15] }, { dir: [0.7, 0.45, 0.5], color: [0.16, 0.2, 0.3], shadow: false }], room: [0.3, 0.27, 0.21], saturation: 0.86 },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 13 — Pacte infernal : fer noirci, cornes de bélier, chaînes et cadenas, sceaux ardents. */
  add('pact', 'Pacte infernal', (L) => {
    const iron = { kind: 'iron', metal: 0.85, rough: 0.5 };
    const horn = { kind: 'bone', metal: 0, rough: 0.5 };
    const r = rng(131);
    // Cornes de bélier enroulées vers l'extérieur.
    for (const m of [-1, 1]) {
      const pts = []; const ox = C + m * 176, oy = 96;
      const th0 = Math.atan2(C - oy, C - ox);
      for (let i = 0; i <= 100; i += 1) { const t = i / 100; const ang = th0 + m * t * 5.3; const rad = 84 * (1 - 0.74 * t); pts.push([ox + Math.cos(ang) * rad, oy + Math.sin(ang) * rad]); }
      const tp = L.taper(pts, (t) => 44 * (1 - t) + 6, { albedo: (t) => `rgb(${Math.round(56 + 80 * t)},${Math.round(46 + 64 * t)},${Math.round(38 + 48 * t)})`, base: 0.4, peak: (t) => 0.98 - t * 0.2, ...horn });
      for (let k = 2; k < tp.length - 6; k += 3) { const p = tp[k]; const w = (44 * (1 - p.t) + 6) / 2; const nx = Math.cos(p.a + Math.PI / 2), ny = Math.sin(p.a + Math.PI / 2); L.engrave(poly([[p.x - nx * w, p.y - ny * w], [p.x + nx * w, p.y + ny * w]], false), 1.4, 0.28); }
    }
    // Anneau de fer noirci.
    L.fill(ringPath(166, 238), { albedo: '#2f2a28', height: ringStyle(C, C, 166, 238, 0.28, 0.5, 'bevel'), ...iron, op: 'source-over' });
    L.fill(ringPath(176, 202), { albedo: '#26221f', height: 0.4, ...iron, op: 'source-over' });
    ringText(L, 'PACTVM · SANGVINIS · ', 189, { size: 15, depth: 0.55, albedo: '#8a1a08', emissive: 'rgba(255,60,10,0.75)' });
    for (let k = 0; k < 8; k += 1) {
      const a = (k / 8) * TAU + Math.PI / 8; const [x, y] = P(221, a);
      const sg = sigilPath(x, y, 22, r);
      L.engrave(circle(12, x, y), 1.6, 0.45, { albedo: '#5a0c04', emissive: 'rgba(255,50,10,0.6)', emissiveWidth: 1.2 });
      L.engrave(sg.lines, 1.4, 0.5, { albedo: '#7a1406', emissive: 'rgba(255,70,15,0.85)', emissiveWidth: 1.2 });
      sg.rings.forEach((rp) => L.engrave(rp, 1.2, 0.45, { emissive: 'rgba(255,70,15,0.8)' }));
    }
    for (let k = 0; k < 24; k += 1) { const [x, y] = P(232, (k / 24) * TAU); rivet(L, x, y, 3.2, { base: 0.5, peak: 0.66, albedo: '#3a3431' }); }
    // Chaînes en guirlande et cadenas.
    for (const m of [-1, 1]) {
      const p0 = P(236, Math.PI / 2 + m * 0.95); const p1 = [C + m * 16, C + 226];
      const pts = []; for (let i = 0; i <= 20; i += 1) { const t = i / 20; pts.push([lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t) + Math.sin(Math.PI * t) * 22]); }
      chain(L, pts, 17, { albedo: '#7a716a', base: 0.6, peak: 0.9, kind: 'silver' });
    }
    const lx = C, ly = C + 232;
    L.torus(lx, ly - 16, 12, 12, 0, 0.3, { albedo: '#3b3533', base: 0.6, peak: 0.88, ...iron });
    L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(lx - 17, ly - 10, 34, 26, 6); }, { albedo: '#35302d', height: domeStyle(lx, ly + 2, 28, 0.62, 0.95), ...iron, op: 'source-over' });
    L.engraveFill((ctx) => { ctx.beginPath(); ctx.arc(lx, ly + 1, 3.6, 0, TAU); ctx.moveTo(lx - 2, ly + 2); ctx.lineTo(lx + 2, ly + 2); ctx.lineTo(lx + 1.2, ly + 10); ctx.lineTo(lx - 1.2, ly + 10); ctx.closePath(); }, 0.6, { albedo: '#ff5a1a', emissive: 'rgba(255,70,10,0.9)' });
    cutOpening(L, 160);
    innerLip(L, 160, iron, '#3a3431', 8);
    return {
      opening: 162,
      options: { seed: 13, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.35, 1.2, 1.08] }, { dir: [0.7, 0.45, 0.5], color: [0.42, 0.08, 0.03], shadow: false }], room: [0.18, 0.15, 0.14], saturation: 0.9, wear: 0.45 },
      portrait: { tint: 'rgba(120,20,0,0.12)' },
      back(ctx) {
        const r2 = rng(133); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 26; i += 1) { const a = (i / 26) * TAU + r2() * 0.1; const [x0, y0] = P(220, a); const [x1, y1] = P(250 + r2() * 14, a + (r2() - 0.5) * 0.2); const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(255,80,10,0.7)'); g.addColorStop(1, 'rgba(120,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(...P(220, a - 0.1)); ctx.quadraticCurveTo(...P(240, a + 0.08), x1, y1); ctx.quadraticCurveTo(...P(240, a - 0.02), ...P(220, a + 0.1)); ctx.fill(); }
        ctx.restore();
      },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 14 — Hublot du Kraken : laiton vert-de-grisé, boulons, charnière, tentacules et bernacles. */
  add('kraken', 'Hublot du Kraken', (L) => {
    const bronze = { kind: 'bronze', metal: 0.9, rough: 0.45 };
    const flesh = { kind: 'organic', metal: 0, rough: 0.26 };
    const B = '#86683a';
    L.fill(ringPath(164, 232), { albedo: B, height: ringStyle(C, C, 164, 232, 0.3, 0.62, 'round'), ...bronze });
    L.fill(ringPath(158, 170), { albedo: '#2b2622', height: ringStyle(C, C, 158, 170, 0.24, 0.38, 'round'), kind: 'leather', rough: 0.8 });
    L.engrave(circle(176), 1.6, 0.3); L.engrave(circle(222), 1.6, 0.3);
    for (let k = 0; k < 8; k += 1) {
      const a = (k / 8) * TAU + Math.PI / 8; const [x, y] = P(199, a);
      L.fill(poly(Array.from({ length: 6 }, (_, i) => [x + Math.cos(a + i * TAU / 6) * 10, y + Math.sin(a + i * TAU / 6) * 10])), { albedo: '#8a6e3e', height: domeStyle(x, y, 12, 0.66, 0.84), ...bronze, op: 'source-over' });
      L.engrave(circle(4, x, y), 1.2, 0.3);
    }
    // Charnière à gauche, loquet à droite.
    for (const dy of [-38, 38]) { const [x, y] = [C - 236, C + dy]; L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(x - 12, y - 16, 24, 32, 5); }, { albedo: B, height: linearStyle(x - 12, y, x + 12, y, [[0, 0.5], [0.5, 0.84], [1, 0.5]]), ...bronze, op: 'source-over' }); L.dome(x, y, 5, { albedo: B, base: 0.7, peak: 0.9, ...bronze }); }
    L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(C + 218, C - 12, 34, 24, 6); }, { albedo: B, height: domeStyle(C + 235, C, 26, 0.56, 0.84), ...bronze, op: 'source-over' });
    L.taper([[C + 238, C], [C + 252, C - 20]], [9, 7], { albedo: B, base: 0.7, peak: 0.92, ...bronze });
    // Bernacles.
    const r = rng(141);
    for (let k = 0; k < 34; k += 1) {
      const a = Math.PI / 2 + (r() - 0.5) * 1.8; const [x, y] = P(200 + (r() - 0.5) * 50, a); const s = 3 + r() * 5;
      L.dome(x, y, s, { albedo: '#9d9483', base: 0.6, peak: 0.86, kind: 'stone', rough: 0.9 }); for (let q = 0; q < 5; q += 1) L.engrave(poly([P(0, 0, x, y), P(s, q * TAU / 5 + 0.3, x, y)], false), 0.8, 0.25);
      L.engraveFill(circle(s * 0.35, x, y), 0.5, { albedo: '#2a2622' });
    }
    // Algues.
    for (let k = 0; k < 5; k += 1) { const a = Math.PI / 2 + (k - 2) * 0.35; const [x, y] = P(228, a); const pts = []; for (let i = 0; i <= 20; i += 1) { const t = i / 20; pts.push([x + Math.sin(t * 7 + k) * 5, y + t * (18 + k * 3)]); } L.taper(pts, [5, 1], { albedo: '#3f4a22', base: 0.5, peak: 0.66, kind: 'organic', rough: 0.4 }); }
    // Tentacules qui enserrent le hublot.
    const tentacle = (pts0, w0, curl) => {
      const last = pts0[pts0.length - 1], prev = pts0[pts0.length - 2]; const dir = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
      const cx2 = last[0] + Math.cos(dir + curl * Math.PI / 2) * 12, cy2 = last[1] + Math.sin(dir + curl * Math.PI / 2) * 12;
      const tail = []; for (let i = 1; i <= 30; i += 1) { const t = i / 30; const ang = dir - curl * Math.PI / 2 + curl * t * 4.2; const rr2 = 12 * (1 - 0.75 * t); tail.push([cx2 + Math.cos(ang) * rr2, cy2 + Math.sin(ang) * rr2]); }
      const pts = [...pts0, ...tail];
      const wf = (t) => w0 * Math.pow(1 - t, 1.1) + 2.5;
      const tp = L.taper(pts, wf, { albedo: (t) => `rgb(${Math.round(76 + 36 * t)},${Math.round(36 + 20 * t)},${Math.round(44 + 20 * t)})`, base: 0.5, peak: (t) => 0.98 - 0.12 * t, ...flesh, over: true, gap: 2, gapAlbedo: '#2a1e18', gapHeight: 0.45 });
      const rs = rng(Math.round(w0 * 13));
      for (let k = 3; k < tp.length - 4; k += 2) { const p = tp[k]; if (rs() > 0.55) continue; const w = wf(p.t) * 0.3; L.ellipse(p.x + (rs() - 0.5) * w, p.y + (rs() - 0.5) * w, w * 0.5, w * 0.3, p.a, { albedo: 'rgba(40,14,22,0.55)', flat: 0, keepMaterial: true, op: 'lighten' }); }
      const under = tp.map((p) => { const w = wf(p.t) * 0.3; return [p.x + Math.cos(p.a + curl * Math.PI / 2) * w, p.y + Math.sin(p.a + curl * Math.PI / 2) * w]; });
      L.taper(under, (t) => wf(t) * 0.42, { albedo: '#8e665e', base: 0.6, peak: (t) => 0.9 - 0.1 * t, ...flesh, rough: 0.22 });
      for (let k = 6; k < tp.length - 12; k += 7) { const p = tp[k]; const w = wf(p.t) * 0.3; const nx = Math.cos(p.a + curl * Math.PI / 2), ny = Math.sin(p.a + curl * Math.PI / 2); const sx = p.x + nx * w * 1.1, sy = p.y + ny * w * 1.1; L.torus(sx, sy, w * 0.42, w * 0.42, 0, 0.5, { albedo: '#7d5750', base: 0.86, peak: 0.96, ...flesh }); L.engraveFill(circle(w * 0.18, sx, sy), 0.3, { albedo: '#3a2226' }); }
    };
    tentacle(bezierPts([488, 56], [400, 22], [210, 30], [112, 100]), 50, -1);
    tentacle(bezierPts([26, 456], [110, 490], [300, 486], [384, 446]), 44, -1);
    tentacle(bezierPts([496, 340], [466, 300], [492, 240], [458, 202]), 28, 1);
    return {
      opening: 158,
      options: { wear: 1.3, seed: 14, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.4, 1.42, 1.3] }, { dir: [0.7, 0.45, 0.5], color: [0.1, 0.24, 0.26], shadow: false }], room: [0.2, 0.26, 0.26], saturation: 0.85 },
      portrait: { tint: 'rgba(10,60,70,0.16)', filter: 'saturate(0.8) contrast(1.05)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 150, C, C, 262); g.addColorStop(0, 'rgba(40,120,130,0.3)'); g.addColorStop(1, 'rgba(10,40,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 15 — Pierre du Soleil : grès sculpté, rayons, glyphes, jade et restes de pigments. */
  add('sunstone', 'Pierre du Soleil', (L) => {
    const stone = { kind: 'stone', metal: 0, rough: 0.9 };
    const S = '#6e604d';
    const r = rng(151);
    // Grands et petits rayons.
    for (let k = 0; k < 16; k += 1) {
      const a = (k / 16) * TAU - Math.PI / 2; const big = k % 2 === 0; const r1 = big ? 256 : 244; const w = big ? 0.13 : 0.09;
      L.fill(poly([P(226, a - w), P(r1, a), P(226, a + w)]), { albedo: S, height: linearStyle(...P(226, a), ...P(r1, a), [[0, 0.5], [1, 0.4]]), ...stone });
      L.engrave(poly([P(230, a - w * 0.6), P(r1 - 8, a), P(230, a + w * 0.6)]), 1.6, 0.35);
    }
    L.fill(ringPath(164, 234), { albedo: S, height: ringStyle(C, C, 164, 234, 0.4, 0.5, 'bevel'), ...stone, op: 'source-over' });
    // Bande des glyphes (cartouches carrés).
    for (let k = 0; k < 20; k += 1) {
      const a0 = (k / 20) * TAU, a1 = ((k + 1) / 20) * TAU;
      L.engraveFill(sectorPath(172, 196, a0 + 0.02, a1 - 0.02), 0.12);
      L.engrave(sectorPath(172, 196, a0 + 0.02, a1 - 0.02), 1.8, 0.45);
      const [x, y] = P(184, (a0 + a1) / 2); const kind = k % 5; const ta = (a0 + a1) / 2 + Math.PI / 2;
      const Tq = (pts) => localPts(x, y, ta, 1, pts);
      if (kind === 0) { L.engrave(smoothPath(Tq([[-7, 5], [-7, -3], [-2, -7], [5, -6], [7, 0], [3, 6]]), true), 1.6, 0.45); L.engraveFill(circle(2, ...Tq([[1, -1]])[0]), 0.5); L.engrave(poly(Tq([[-3, 3], [3, 3]]), false), 1.2, 0.4); }
      else if (kind === 1) { L.engrave(smoothPath(Tq(spiralPts(0, 0, 8, 1, 0, 1.6, 30).map(([u, v]) => [u - C * 0, v]))), 1.5, 0.45); }
      else if (kind === 2) { for (const [u, v] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0]]) L.engraveFill(circle(1.9, ...Tq([[u, v]])[0]), 0.55); L.engrave(circle(9, x, y), 1.2, 0.35); }
      else if (kind === 3) { L.engrave(poly(Tq([[-7, 6], [-3, -6], [0, 2], [3, -6], [7, 6]]), false), 1.6, 0.45); L.engrave(poly(Tq([[-8, -8], [8, -8]]), false), 1.2, 0.35); }
      else { L.engrave(poly(Tq([[-6, -6], [6, -6], [6, 6], [-6, 6]])), 1.4, 0.4); L.engrave(poly(Tq([[-6, -6], [6, 6]]), false), 1.2, 0.35); L.engrave(poly(Tq([[6, -6], [-6, 6]]), false), 1.2, 0.35); }
    }
    // Frise de quinconces et plumes.
    for (let k = 0; k < 40; k += 1) { const a = (k / 40) * TAU; const [x, y] = P(208, a); L.dome(x, y, 3.2, { albedo: S, base: 0.5, peak: 0.62, ...stone }); }
    for (let k = 0; k < 48; k += 1) { const a = (k / 48) * TAU; L.engrave(arcPath(222, a, a + TAU / 60), 3.5, 0.3); }
    // Disques de jade aux points cardinaux.
    for (let k = 0; k < 4; k += 1) { const [x, y] = P(208, (k / 4) * TAU + Math.PI / 4); L.dome(x, y, 12, { albedo: '#3f7a5c', base: 0.5, peak: 0.72, kind: 'glass', rough: 0.3 }); L.stroke(circle(12.5, x, y), 2.4, { albedo: '#b08a3e', height: 0.62, kind: 'gold', metal: 0.9, rough: 0.5 }); }
    // Fêlures et éclats.
    for (let k = 0; k < 9; k += 1) { let a = r() * TAU, rr = 164 + r() * 10; const pts = [P(rr, a)]; while (rr < 236) { rr += 4 + r() * 7; a += (r() - 0.5) * 0.05; pts.push(P(rr, a)); } L.engrave(poly(pts, false), 1.4, 0.5); }
    // Restes de pigments rouges et bleus dans les creux.
    const f = getFields();
    L.paint(ringPath(164, 256), (x, y, px) => {
      if (px.H > 0.44 || px.A < 0.5) { px.skip = true; return; }
      const n = sample(f.mid, x * 1.3, y * 1.3); const keep = smooth(0.45, 0.6, n);
      if (keep < 0.05) { px.skip = true; return; }
      const blue = sample(f.low, x * 2, y * 2) > 0.6;
      px.rgb = blue ? [46, 96, 104] : [132, 40, 26]; px.alpha = keep * 0.85;
    });
    innerLip(L, 158, stone, '#7a6a52', 8);
    return {
      opening: 160,
      options: { seed: 15, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.75, 1.5, 1.1] }, { dir: [0.7, 0.45, 0.5], color: [0.16, 0.14, 0.14], shadow: false }], room: [0.24, 0.21, 0.17], saturation: 0.9 },
    };
  });
}(window));
