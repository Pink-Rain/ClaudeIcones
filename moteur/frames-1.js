// Labo Eraser — cadres épiques 1 à 5 (hors application).
(function (root) {
  'use strict';
  const { C, TAU, rng, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample } = root.Relief;
  const { feather, fanWing, ringText, knot, wing, beads, rope, plait, facetRay, matting, P, circle, ringPath, arcPath, sectorPath, polar, polarPts, poly, smoothPath, bezierPts, spiralPts, lerp, voronoi, scatter, rivet, gem, skull, runePath } = root.Helpers;
  const { add, innerLip, FONT, glowDot, cutOpening, angleDiff } = root.FrameKit;

  /* ------------------------------------------------------------------ */
  /* 1 — Entrelacs des wyrms : bronze doré nordique, tresse, runes, têtes affrontées. */
  function wyrmHead(L, x, y, s, mirror, o) {
    const T = (pts) => pts.map(([px, py]) => [x + (mirror ? -px : px) * s, y + py * s]);
    const mat = { kind: 'gold', metal: 0.95, rough: 0.42 };
    const col = o.albedo;
    const upper = T([[63, -1], [58, -7], [47, -9], [38, -13], [27, -17], [13, -19], [0, -17], [-10, -11], [-15, -1], [-9, 8], [8, 8], [24, 5], [42, 3], [58, 2]]);
    const lower = T([[24, 8], [40, 10], [52, 13], [58, 17], [52, 20], [38, 18], [20, 15], [6, 13], [-6, 10]]);
    const [cx, cy] = T([[16, -4]])[0];
    const [jx, jy] = T([[30, 13]])[0];
    // Cornes balayées vers l'arrière (derrière la tête).
    L.taper(T(bezierPts([6, -15], [-8, -30], [-26, -36], [-40, -30])), (t) => 8 * (1 - t) + 1.2, { albedo: col, base: 0.42, peak: (t) => 0.86 - 0.2 * t, ...mat });
    L.taper(T(bezierPts([-2, -12], [-14, -20], [-26, -20], [-34, -14])), (t) => 6 * (1 - t) + 1, { albedo: col, base: 0.4, peak: 0.72, ...mat });
    for (const shape of [upper, lower]) {
      L.stroke(smoothPath(shape, true), 7 * s, { albedo: o.plate, height: 0.26, op: 'source-over', kind: 'bronze', metal: 0.9, rough: 0.5 });
      L.fill(smoothPath(shape, true), { albedo: o.plate, height: 0.26, op: 'source-over', kind: 'bronze', metal: 0.9, rough: 0.5 });
    }
    L.fill(smoothPath(lower, true), { albedo: col, height: domeStyle(jx, jy, 30 * s, 0.4, 0.74), ...mat });
    L.fill(smoothPath(upper, true), { albedo: col, height: domeStyle(cx, cy, 48 * s, 0.4, 0.94), ...mat });
    // Gueule ouverte : fond sombre, crocs.
    L.engraveFill(smoothPath(T([[58, 3], [44, 4], [26, 6], [24, 8], [40, 10], [54, 13]]), true), 0.55, { albedo: '#1c1008' });
    for (const [fx, fy, d, l] of [[53, 3, 1, 6], [41, 4, 1, 5], [48, 12, -1, 5], [34, 9, -1, 4]]) L.taper(T([[fx, fy], [fx - 1, fy + d * l]]), [2.6 * s, 0.4], { albedo: '#e6d7b0', base: 0.5, peak: 0.72, kind: 'bone', rough: 0.45 });
    // Arcade lourde, œil fendu, narine, écailles de joue.
    L.taper(T([[4, -12], [18, -16], [34, -13]]), [7 * s, 3 * s], { albedo: col, base: 0.62, peak: 1, ...mat });
    L.engraveFill(smoothPath(T([[12, -8], [20, -11], [30, -9], [21, -6]]), true), 0.5, { albedo: '#1a0d06' });
    L.fill(smoothPath(T([[15, -8.4], [21, -10.2], [27, -8.8], [21, -7]]), true), { albedo: '#8e1418', height: 0.62, kind: 'glass', rough: 0.1, op: 'lighten', emissive: 'rgba(170,20,10,0.35)' });
    L.engrave(poly(T([[21, -10.4], [21, -6.8]]), false), 0.9 * s, 0.4);
    L.engrave(smoothPath(T(spiralPts(52, -3, 3.2, 0.6, 0, 1.2, 18))), 1.1 * s, 0.35);
    for (let k = 0; k < 4; k += 1) L.engrave(smoothPath(T([[6 - k * 5, -6 + k], [2 - k * 5, 0 + k], [4 - k * 5, 5]])), 1 * s, 0.28);
    // Barbillon enroulé sous la mâchoire.
    L.taper(T(bezierPts([10, 13], [4, 24], [-8, 26], [-12, 16])), [4.5 * s, 1.2 * s], { albedo: col, base: 0.42, peak: 0.72, ...mat });
    return T;
  }

  add('wyrms', 'Entrelacs des wyrms', (L) => {
    const bronze = { kind: 'bronze', metal: 0.9, rough: 0.5 };
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.42 };
    const G = '#a98a4e', PLATE = '#5e452b';
    L.fill(ringPath(170, 248), { albedo: PLATE, height: ringStyle(C, C, 170, 248, 0.2, 0.3, 'bevel'), ...bronze });
    matting(L, ringPath(198, 234), { depth: 0.1, step: 3 });
    // Bande de runes.
    L.fill(ringPath(178, 196), { albedo: '#4a3622', height: 0.26, ...bronze, op: 'source-over' });
    beads(L, 181, 120, 1.5, { albedo: G, ...gilt, base: 0.26, peak: 0.4 });
    beads(L, 193, 128, 1.5, { albedo: G, ...gilt, base: 0.26, peak: 0.4 });
    const r = rng(11);
    for (let k = 0; k < 40; k += 1) { const a = (k / 40) * TAU; const [x, y] = P(187, a); L.engrave(runePath(x, y, a + Math.PI / 2, 8, r), 1.3, 0.42, { albedo: '#20150b' }); }
    // Tresse principale à trois brins dorés ; elle s'interrompt sous les têtes.
    const top = -Math.PI / 2;
    plait(L, 216, 13, 3, 10, 9.5, { ribbon: true, style: { albedo: G, base: 0.32, peak: 0.7, ...gilt, gapAlbedo: PLATE, gapHeight: 0.24 }, skip: (a) => Math.abs(angleDiff(a, top)) < 0.3 });
    rope(L, 241, 11, 150, { albedo: G, ...gilt, base: 0.28, peak: 0.62 });
    for (const a of [0, Math.PI]) { const [x, y] = P(216, a); gem(L, x, y, 8, { color: '#6b0d16', cut: 'cabochon', setting: 3.5, setAlbedo: G, base: 0.5, lift: 0.3, prongs: 4 }); }
    // Triquetra en bas.
    const [tx, ty] = P(214, Math.PI / 2);
    L.dome(tx, ty, 29, { albedo: PLATE, base: 0.3, peak: 0.4, ...bronze });
    L.engrave(circle(29, tx, ty), 1.5, 0.3);
    knot(L, (t) => { const a = t * TAU; return [tx + (Math.sin(a) + 2 * Math.sin(2 * a)) * 8, ty + 3 + (Math.cos(a) - 2 * Math.cos(2 * a)) * 8]; }, 6, { style: { albedo: G, base: 0.44, peak: 0.74, ...gilt, gapAlbedo: PLATE, gapHeight: 0.4 } });
    // Têtes affrontées mordant la gemme.
    for (const mirror of [false, true]) {
      const hx = mirror ? C + 82 : C - 82;
      const T = wyrmHead(L, hx, 46, 0.95, mirror, { albedo: G, plate: PLATE });
      const [nx, ny] = T([[-12, 6]])[0];
      const [px2, py2] = P(222, top + (mirror ? 0.42 : -0.42));
      L.taper(bezierPts([nx, ny], [nx + (mirror ? 6 : -6), ny + 16], [px2 + (mirror ? -10 : 10), py2 - 10], [px2, py2]), [15, 10], { albedo: G, base: 0.34, peak: 0.74, ...gilt, gap: 5, gapAlbedo: PLATE, gapHeight: 0.26, over: true });
    }
    gem(L, C, 42, 12, { color: '#6d0d18', base: 0.5, lift: 0.42, setting: 4.5, setAlbedo: G, prongs: 4 });
    innerLip(L, 168, gilt, G, 8);
    return { opening: 170, options: { seed: 1, wear: 0.6 } };
  });

  /* ------------------------------------------------------------------ */
  /* 2 — Gloire aux épines : ostensoir doré, couronne d'épines, croix fleuronnée. */
  add('thorns', 'Gloire aux épines', (L) => {
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.36 };
    const wood = { kind: 'wood', metal: 0, rough: 0.5 };
    const G = '#b0904f', G2 = '#957640';
    const r = rng(21);
    for (let k = 0; k < 36; k += 1) {
      const a = (k / 36) * TAU + TAU / 72;
      facetRay(L, a, 188, (k % 3 === 0 ? 256 : 248) - r() * 3, 8.5, { albedo: G, albedo2: G2, ...gilt, height: 0.3, tilt: 0.6, slope: 0.3 });
    }
    for (let k = 0; k < 36; k += 1) {
      const a = (k / 36) * TAU;
      const pts = []; for (let i = 0; i <= 40; i += 1) { const t = i / 40; pts.push(P(196 + 46 * t, a + Math.sin(t * Math.PI * 2.5) * 0.05 * (1 - t * 0.5))); }
      L.taper(pts, (t) => 9 * (1 - t) + 1, { albedo: G2, base: 0.3, peak: 0.52, ...gilt });
    }
    // Couronne : deux branches torsadées, passages alternés.
    const strand = (sidx) => (a) => 210 + 7 * Math.sin(6 * a + sidx * Math.PI) + 1.5 * Math.sin(17 * a + sidx * 2);
    const bark = { albedo: '#3a2a1f', base: 0.42, peak: 0.86, ...wood, steps: 10 };
    for (let sidx = 0; sidx < 2; sidx += 1) L.tube(polar(strand(sidx), 0, TAU, 720), 12, bark);
    for (let k = 0; k < 12; k += 1) { const a = (k * Math.PI) / 6; L.tube(polar(strand(k % 2), a - 0.13, a + 0.13, 24), 12, { ...bark, gap: 4, gapAlbedo: '#261a12', gapHeight: 0.36 }); }
    // Écorce : fentes allongées.
    for (let k = 0; k < 260; k += 1) {
      const a = r() * TAU; const fn = strand(k % 2); const rr = fn(a) + (r() - 0.5) * 8;
      const [x, y] = P(rr, a); const t = a + Math.PI / 2 + (r() - 0.5) * 0.3; const l = 3 + r() * 5;
      L.engrave(poly([[x - Math.cos(t) * l, y - Math.sin(t) * l], [x + Math.cos(t) * l, y + Math.sin(t) * l]], false), 1, 0.22);
    }
    // Épines, quelques gouttes de sang séché.
    for (let k = 0; k < 52; k += 1) {
      const a = (k / 52) * TAU + r() * 0.05; const fn = strand(k % 2); const [x, y] = P(fn(a), a);
      const out = r() < 0.75;
      const dir = out ? a + (r() - 0.5) * 1.5 : a + Math.PI + (r() - 0.5) * 0.9;
      const len = out ? 12 + r() * 18 : 7 + r() * 7;
      const bend = (r() - 0.5) * 0.7;
      const pts = [0, 0.25, 0.5, 0.75, 1].map((t) => [x + Math.cos(dir + bend * t) * len * t, y + Math.sin(dir + bend * t) * len * t]);
      L.taper(pts, (t) => 6.5 * Math.pow(1 - t, 1.3) + 0.5, { albedo: '#4a3526', base: 0.55, peak: (t) => 0.95 - t * 0.25, ...wood });
      if (r() < 0.16) L.ellipse(pts[4][0], pts[4][1] + 2, 2.2, 3.6, 0, { albedo: '#3c0606', base: 0.75, peak: 0.95, kind: 'glass', rough: 0.12 });
    }
    // Bande d'inscription.
    L.fill(ringPath(170, 190), { albedo: G2, height: ringStyle(C, C, 170, 190, 0.3, 0.44, 'bevel'), ...gilt, op: 'source-over' });
    ringText(L, '✠ AVE · CRVX · SPES · VNICA ', 180.5, { size: 12, depth: 0.5, albedo: '#3b2a12' });
    // Croix fleuronnée au sommet.
    const cross = { albedo: G, base: 0.5, peak: 0.86, ...gilt, groove: true, grooveDepth: 0.15 };
    L.ribbon(poly([[C, 60], [C, 10]], false), 9, cross);
    L.ribbon(poly([[C - 22, 28], [C + 22, 28]], false), 9, cross);
    for (const [ex, ey, dx, dy] of [[C, 8, 0, -1], [C - 24, 28, -1, 0], [C + 24, 28, 1, 0]]) {
      L.dome(ex + dx * 3, ey + dy * 3, 4.5, { albedo: G, base: 0.6, peak: 0.9, ...gilt });
      L.dome(ex - dy * 5, ey + dx * 5, 3.6, { albedo: G, base: 0.6, peak: 0.86, ...gilt });
      L.dome(ex + dy * 5, ey - dx * 5, 3.6, { albedo: G, base: 0.6, peak: 0.86, ...gilt });
    }
    gem(L, C, 28, 6, { color: '#6a0c14', base: 0.7, lift: 0.25, setting: 2.5, setAlbedo: G });
    innerLip(L, 164, gilt, G, 7);
    return {
      opening: 166,
      options: { seed: 2, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.8, 1.4, 0.95] }, { dir: [0.7, 0.45, 0.5], color: [0.2, 0.13, 0.1], shadow: false }] },
      portrait: { tint: 'rgba(90,40,10,0.08)' },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 3 — Sceau du Liche : argent noirci, colonne vertébrale, crâne couronné, mains, phylactère. */
  function vertebra(L, a, rad, s, col) {
    const ca = Math.cos(a), sa = Math.sin(a), ct = -sa, st = ca;
    const T = (pts) => pts.map(([u, v]) => [C + ca * (rad + v * s) + ct * u * s, C + sa * (rad + v * s) + st * u * s]);
    const mat = { kind: 'bone', metal: 0, rough: 0.66 };
    const [bx, by] = T([[-1, 0]])[0];
    // Lames en papillon.
    L.fill(smoothPath(T([[-10, -4], [-8, -11], [0, -12], [6, -8], [9, 0], [6, 8], [0, 12], [-8, 11], [-10, 4], [-7, 0]]), true), { albedo: col, height: domeStyle(bx, by, 15 * s, 0.34, 0.6), ...mat });
    // Apophyses transverses (ailes latérales), terminées par un bouton.
    for (const d of [-1, 1]) {
      const pts = T([[-1, d * 9], [-3, d * 15], [-5, d * 21]]);
      L.taper(pts, [6.5 * s, 4 * s], { albedo: col, base: 0.38, peak: 0.58, ...mat });
      L.dome(pts[2][0], pts[2][1], 3.4 * s, { albedo: col, base: 0.4, peak: 0.6, ...mat });
    }
    // Apophyses articulaires.
    for (const d of [-1, 1]) { const [fx, fy] = T([[-8, d * 6]])[0]; L.dome(fx, fy, 3.2 * s, { albedo: col, base: 0.46, peak: 0.66, ...mat }); }
    // Apophyse épineuse : courte lame inclinée vers la vertèbre suivante.
    L.taper(T([[-3, 0], [4, 0], [9, 0]]), (t) => (6.5 - 3 * t) * s, { albedo: col, base: 0.5, peak: (t) => 0.72 + 0.08 * t, ...mat });
  }

  const T0 = (sx, sy, s) => { const pts = []; for (let i = 0; i <= 20; i += 1) { const t = i / 20; const ang = Math.PI + t * Math.PI; pts.push([sx + Math.cos(ang) * 29 * s, sy - 26 * s + Math.sin(ang) * 7 * s]); } return pts; };
  add('lich', 'Sceau du Liche', (L) => {
    const silver = { kind: 'silver', metal: 0.95, rough: 0.34 };
    const BONE = '#a8946c';
    L.fill(ringPath(172, 248), { albedo: '#77787c', height: ringStyle(C, C, 172, 248, 0.22, 0.34, 'bevel'), ...silver });
    L.fill(ringPath(174, 196), { albedo: '#8a8b8f', height: ringStyle(C, C, 174, 196, 0.3, 0.44, 'bevel'), ...silver, op: 'source-over' });
    ringText(L, 'NON · OMNIS · MORIAR · ✠ · MEMENTO · MORI · ✠ · ', 185, { size: 13, depth: 0.55, albedo: '#10181c', emissive: 'rgba(70,170,210,0.45)' });
    beads(L, 243, 150, 2.4, { albedo: '#9d9ea2', ...silver, base: 0.3, peak: 0.48 });
    for (let k = 0; k < 50; k += 1) vertebra(L, (k / 50) * TAU + 0.02, 218, 1.05, BONE);
    // Givre sur les parties hautes.
    const f = getFields();
    L.paint(ringPath(172, 250), (x, y, px) => {
      const n = sample(f.mid, x * 1.7, y * 1.7), h = sample(f.fine, x * 1.3, y * 1.3);
      const frost = smooth(0.62, 0.72, n) * smooth(0.55, 0.85, h) * smooth(0.45, 0.2, (y - 40) / 440);
      if (frost < 0.02) { px.skip = true; return; }
      px.rgb = [222, 236, 244]; px.alpha = frost * 0.55; px.rough = 0.55;
    });
    // Phylactère.
    const [qx, qy] = P(218, Math.PI / 2);
    L.dome(qx, qy, 20, { albedo: '#6d6e72', base: 0.5, peak: 0.66, ...silver });
    gem(L, qx, qy, 13, { color: '#17607c', facets: 6, setKind: 'silver', setAlbedo: '#a2a3a7', base: 0.55, lift: 0.4, glow: 'rgba(80,210,255,0.75)', glowSize: 1.7, prongs: 6 });
    innerLip(L, 166, silver, '#909195', 8);
    // Crâne couronné : couronne de pointes derrière, bandeau sur le front.
    const sx = C, sy = 66, s = 1.02;
    for (let k = -3; k <= 3; k += 1) {
      const bx = sx + k * 10 * s, by = sy - 34 * s + Math.abs(k) * 2.5; const hgt = (k === 0 ? 30 : Math.abs(k) === 1 ? 24 : Math.abs(k) === 2 ? 18 : 12) * s;
      L.taper([[bx, by], [bx + k * 3, by - hgt]], [10 * s, 1.2], { albedo: '#7a7672', base: 0.5, peak: 0.95, kind: 'silver', metal: 0.95, rough: 0.34 });
      if (k === 0 || Math.abs(k) === 2) gem(L, bx + k * 1.4, by - hgt * 0.45, 2.3, { color: '#1b5f7c', cut: 'cabochon', setting: 0.8, setKind: 'silver', setAlbedo: '#9a9b9e', base: 0.8, lift: 0.12, glow: k === 0 ? 'rgba(80,200,255,0.8)' : undefined });
    }
    skull(L, sx, sy, s, 0, { eyes: 'rgba(110,225,255,0.85)', base: 0.46, lift: 0.52, seed: 4, albedo: '#c3b28a', teeth: '#bba77c' });
    L.taper(T0(sx, sy, s), [6 * s, 6 * s], { albedo: '#8a8682', base: 0.86, peak: 1, kind: 'silver', metal: 0.95, rough: 0.32 });
    return {
      opening: 168,
      options: { seed: 3, lights: [{ dir: [-0.5, -0.62, 0.6], color: [1.1, 1.22, 1.42] }, { dir: [0.7, 0.4, 0.5], color: [0.1, 0.2, 0.32], shadow: false }, { pos: [C, 470, 60], radius: 120, color: [0.2, 0.7, 0.9] }], tint: [0.95, 1.0, 1.06], saturation: 0.7, room: [0.26, 0.29, 0.33] },
      portrait: { tint: 'rgba(30,70,110,0.14)', filter: 'saturate(0.7) contrast(1.08) brightness(0.95)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 200, C, C, 262); g.addColorStop(0, 'rgba(90,190,230,0.35)'); g.addColorStop(1, 'rgba(40,90,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 4 — Forge primordiale : croûte de basalte, magma, crampons nains, clef de voûte runique. */
  add('forge', 'Forge primordiale', (L) => {
    const seeds = scatter(120, (x, y) => { const d = Math.hypot(x - C, y - C); return d > 160 && d < 262; }, 41, 14);
    const vor = voronoi(seeds, 24);
    const f = getFields();
    const edge = (a) => 238 + Math.sin(a * 7 + 1) * 5 + Math.sin(a * 17) * 3 + Math.sin(a * 31 + 2) * 2;
    const mask = (ctx) => { const pts = polarPts(edge, 0, TAU, 360); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.moveTo(C + 168, C); ctx.arc(C, C, 168, 0, TAU, true); };
    L.paint(mask, (x, y, px) => {
      const q = vor.query(x, y);
      const e = q.edge; const n = sample(f.mid, x * 1.5, y * 1.5); const hn = sample(f.high, x * 1.2, y * 1.2);
      const hv = smooth(0.32, 0.66, sample(f.low, x * 3.2, y * 3.2));
      const width = 0.45 + n * 1.1 + hv * 0.7;
      const crack = 1 - smooth(width * 0.3, width, e);
      const rr = rng(q.i * 13 + 5); rr(); const plateH = 0.46 + rr() * 0.16;
      const dome = smooth(0, 4, e);
      px.h = crack > 0.4 ? 0.1 : plateH * (0.8 + 0.2 * dome) + (n - 0.5) * 0.1 + (hn - 0.5) * 0.06;
      px.hMode = 'set';
      const ash = smooth(0.6, 0.85, sample(f.low, x * 2, y * 2)) * dome;
      const heat = Math.max(0, 1 - e / (3 + hv * 3)) * hv;
      px.rgb = [13 + hn * 9 + ash * 22 + heat * 70, 12 + hn * 7 + ash * 20 + heat * 12, 13 + hn * 7 + ash * 19];
      px.kind = 'obsidian'; px.metal = 0; px.rough = 0.42 + ash * 0.4 + hn * 0.1;
      if (crack > 0.02) {
        const core = smooth(0.6, 1, crack) * hv;
        const k = crack * (0.15 + 0.85 * hv);
        px.e = [230 * k, (40 + 150 * core) * k, (6 + 60 * core * core) * k];
        px.rgb = [240, 80 + 120 * core, 20 + 40 * core]; px.alpha = crack; px.kind = 'glass'; px.rough = 0.5;
      } else if (heat > 0) px.e = [130 * heat * heat, 18 * heat * heat, 0];
    });
    // Crampons de fer forgé, rivetés, rougis sur les bords.
    const iron = { kind: 'iron', metal: 0.85, rough: 0.55 };
    for (const a of [-Math.PI / 4 - 0.1, -3 * Math.PI / 4 + 0.1, Math.PI / 4, 3 * Math.PI / 4]) {
      const wd = 0.12;
      L.fill(sectorPath(162, 252, a - wd, a + wd), { albedo: '#2f2a27', height: (ctx) => { const g = ctx.createRadialGradient(C, C, 162, C, C, 252); g.addColorStop(0, gray(0.5)); g.addColorStop(0.06, gray(0.78)); g.addColorStop(0.94, gray(0.8)); g.addColorStop(1, gray(0.55)); return g; }, ...iron, op: 'source-over' });
      for (const rr2 of [170, 246]) L.engrave(arcPath(rr2, a - wd, a + wd), 1.4, 0.28);
      for (const rr2 of [184, 207, 230]) for (const s2 of [-1, 1]) { const [x, y] = P(rr2, a + s2 * wd * 0.6); rivet(L, x, y, 4.2, { base: 0.78, peak: 0.95 }); }
      L.glow((e) => { e.save(); e.filter = 'blur(4px)'; e.fillStyle = 'rgba(190,45,5,0.5)'; for (const s2 of [-1, 1]) { e.beginPath(); e.arc(C, C, 252, a + s2 * wd - 0.014, a + s2 * wd + 0.014); e.arc(C, C, 162, a + s2 * wd + 0.014, a + s2 * wd - 0.014, true); e.closePath(); e.fill(); } e.restore(); });
    }
    // Clef de voûte : bloc de basalte gravé d'une rune ardente.
    const key = poly([[C - 46, 4], [C + 46, 4], [C + 30, 70], [C - 30, 70]]);
    L.stroke(key, 6, { albedo: '#1d1818', height: 0.4, op: 'source-over', kind: 'stone', metal: 0, rough: 0.85 });
    L.fill(key, { albedo: '#1f1b1a', height: (ctx) => { const g = ctx.createLinearGradient(C, 4, C, 70); g.addColorStop(0, gray(0.86)); g.addColorStop(1, gray(0.78)); return g; }, kind: 'stone', metal: 0, rough: 0.85, op: 'source-over' });
    L.engrave(key, 3, 0.3);
    const rune = (ctx) => { ctx.beginPath(); ctx.moveTo(C, 16); ctx.lineTo(C, 60); ctx.moveTo(C, 22); ctx.lineTo(C + 14, 34); ctx.lineTo(C, 44); ctx.moveTo(C, 40); ctx.lineTo(C - 14, 52); };
    L.engrave(rune, 6, 0.55, { albedo: '#ff8a2a', emissive: 'rgba(255,120,30,0.95)', emissiveWidth: 3.5 });
    // Coulures de métal en fusion sous l'anneau.
    for (const [a, len] of [[Math.PI / 2 - 0.25, 18], [Math.PI / 2 + 0.05, 26], [Math.PI / 2 + 0.3, 14]]) {
      const [x, y] = P(234, a);
      L.taper([[x, y], [x, y + len]], (t) => 6 - 2.5 * t + 3 * smooth(0.75, 1, t), { albedo: '#ff9a3a', base: 0.5, peak: 0.7, kind: 'glass', rough: 0.4, emissive: 'rgba(255,110,20,0.9)' });
    }
    innerLip(L, 164, iron, '#2c2624', 7);
    return {
      opening: 166,
      options: { seed: 4, lights: [{ dir: [-0.5, -0.62, 0.6], color: [0.75, 0.7, 0.68] }, { pos: [C, 470, 60], radius: 260, color: [2.2, 0.8, 0.2] }, { pos: [C, C, 40], radius: 160, color: [0.9, 0.32, 0.07] }, { pos: [C, 40, 60], radius: 80, color: [1.2, 0.45, 0.1] }], exposure: 1.05, saturation: 0.85, room: [0.12, 0.08, 0.06], bloom: 0.75 },
      portrait: { tint: 'rgba(170,60,0,0.14)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 200, C, C, 262); g.addColorStop(0, 'rgba(255,90,20,0.45)'); g.addColorStop(1, 'rgba(120,20,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
      front(ctx) {
        const r2 = rng(44); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 40; i += 1) { const a = -Math.PI / 2 + (r2() - 0.5) * 2.8; const [x, y] = P(232 + r2() * 26, a); const s2 = 0.6 + r2() * 1.6; const g = ctx.createRadialGradient(x, y, 0, x, y, s2 * 3); g.addColorStop(0, 'rgba(255,230,150,1)'); g.addColorStop(0.4, 'rgba(255,140,30,0.8)'); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s2 * 3, 0, TAU); ctx.fill(); }
        ctx.restore();
      },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 5 — Étreinte de l'archange : deux grandes ailes d'ivoire bordées d'or enveloppent le médaillon. */
  add('seraph', 'Étreinte de l’archange', (L) => {
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.36 };
    const G = '#b39552';
    const plume = { albedo: '#bfb49c', rachis: '#ece4d2', kind: 'cloth', rough: 0.76, edge: '#9c7c3e', edgeMat: gilt, asym: 0.75, profile: 'blade' };
    const eye = (x, y) => {
      L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, 0, 0, TAU); }, { albedo: '#ebe2ce', height: 0.95, kind: 'bone', rough: 0.4, op: 'lighten' });
      gem(L, x, y, 2.8, { color: '#35698f', cut: 'cabochon', setting: 0, base: 0.92, lift: 0.08, glow: 'rgba(120,200,255,0.95)', glowSize: 2.4 });
      L.engrave((ctx) => { ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, 0, 0, TAU); }, 1, 0.45);
    };
    // Rangs de plumes posés le long de l'anneau, pointant vers le haut, en tuiles.
    const rows = [
      { r: 224, count: 30, len: [40, 92], width: [24, 30], tilt: 0.42, base: 0.3 },
      { r: 208, count: 26, len: [30, 52], width: [22, 26], tilt: 0.36, base: 0.4 },
      { r: 196, count: 20, len: [20, 30], width: [18, 20], tilt: 0.3, base: 0.5, eyes: true },
    ];
    let lift = 0;
    for (const row of rows) {
      for (const m of [-1, 1]) {
        for (let i = row.count - 1; i >= 0; i -= 1) {
          const t = i / (row.count - 1);
          const a = m > 0 ? Math.PI / 2 - 0.25 - t * (Math.PI + 0.1) : Math.PI / 2 + 0.25 + t * (Math.PI + 0.1);
          const [bx, by] = P(row.r, a);
          const dir = a - m * Math.PI / 2 + m * row.tilt * (0.5 + t);
          const len = lerp(row.len[0], row.len[1], Math.pow(t, 1.6));
          const b = row.base + lift; lift += 0.0015;
          feather(L, bx, by, len, lerp(row.width[0], row.width[1], t), dir, { ...plume, base: b, peak: b + 0.26, op: 'source-over', seed: i + (m > 0 ? 50 : 0), curve: -0.06 * m, eye: row.eyes && i % 4 === 2 ? eye : null });
        }
      }
    }
    // Médaillon doré par-dessus.
    L.fill(ringPath(158, 190), { albedo: G, height: ringStyle(C, C, 158, 190, 0.62, 0.78, 'bevel'), ...gilt, op: 'source-over' });
    ringText(L, 'SANCTVS · SANCTVS · SANCTVS · ', 174, { size: 14, depth: 0.5, albedo: '#3b2c14' });
    beads(L, 162, 104, 1.8, { albedo: G, ...gilt, base: 0.62, peak: 0.8 });
    beads(L, 187, 120, 1.8, { albedo: G, ...gilt, base: 0.62, peak: 0.8 });
    for (const a of [-Math.PI / 2, Math.PI / 2]) { const [x, y] = P(174, a); gem(L, x, y, 8, { color: '#2d5f86', setting: 2.5, setAlbedo: G, base: 0.78, lift: 0.28, glow: 'rgba(130,200,255,0.45)' }); }
    innerLip(L, 152, gilt, G, 7);
    cutOpening(L, 152);
    return {
      opening: 154,
      options: { seed: 5, lights: [{ dir: [-0.42, -0.6, 0.68], color: [1.6, 1.46, 1.24] }, { dir: [0.7, 0.45, 0.5], color: [0.22, 0.24, 0.32], shadow: false }], room: [0.32, 0.3, 0.26], saturation: 0.8 },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 130, C, C, 262); g.addColorStop(0, 'rgba(255,236,190,0.45)'); g.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });
}(window));
