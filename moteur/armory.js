// Labo Eraser — armurerie complète : 81 icônes d'armes, style A (sans fond).
// Chaque arme est dessinée dans un repère local : axe u le long de la diagonale
// (bas-gauche → haut-droit), v perpendiculaire. Origine au centre du canevas.
(function (root) {
  'use strict';
  const { C, TAU, rng, createLayers, render, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { circle, poly, smoothPath, bezierPts, lerp, localPts, rivet, gem, skull, leaf, feather, chain } = root.Helpers;
  const Pr = root.Props;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));
  const IRON = { kind: 'iron', metal: 0.85, rough: 0.45 };
  const STEEL = { kind: 'silver', metal: 0.95, rough: 0.28 };
  const BRASS = { kind: 'bronze', metal: 0.9, rough: 0.4 };
  const GOLD = { kind: 'gold', metal: 0.95, rough: 0.34 };
  const DIAG = -Math.PI / 4;

  // Repère : T(pts) → points canevas ; p(u, v) → un point ; a = angle de l'axe u.
  function F(cx = C, cy = C, a = DIAG) {
    const T = (pts) => localPts(cx, cy, a, 1, pts);
    return { a, T, p: (u, v) => T([[u, v]])[0], P: (pts, close = true) => poly(T(pts), close), S: (pts, close = true) => smoothPath(T(pts), close) };
  }
  const fields = () => getFields();

  /* ---------- matières ---------- */
  function steel(L, path, z, o = {}) {
    const f = fields(); const col = o.col || [152, 156, 162];
    Pr.pillow(L, path, { base: z, lift: o.lift ?? 0.1, radius: o.radius ?? 7, ...STEEL, rough: o.rough ?? 0.28, rule: o.rule, color: (gx, gy, t) => {
      const n = sample(f.mid, gx * 2.2, gy * 2.2), sc = sample(f.high, gx * 1.5 + gy, gy * 1.5);
      let c = shade(col, (0.6 + 0.48 * t) * (0.85 + 0.25 * n)); if (sc > 0.86) c = shade(c, 1.16);
      if (o.rust) c = mix(c, [110, 62, 32], smooth(0.62, 0.8, n) * o.rust);
      return c; } });
  }
  function metal(L, path, z, col, mat = IRON, o = {}) {
    const f = fields(); const c0 = hex(col);
    Pr.pillow(L, path, { base: z, lift: o.lift ?? 0.1, radius: o.radius ?? 6, ...mat, rule: o.rule, color: (gx, gy, t) => shade(c0, (0.55 + 0.55 * t) * (0.85 + 0.25 * sample(f.mid, gx * 2, gy * 2))) });
  }
  function wood(L, path, z, col = [106, 66, 38], o = {}) {
    const f = fields();
    Pr.pillow(L, path, { base: z, lift: o.lift ?? 0.12, radius: o.radius ?? 8, kind: 'wood', rough: 0.52, rule: o.rule, color: (gx, gy, t) => { const g = sample(f.mid, (gx + gy) * 0.35, (gx - gy) * 2.2); return shade(col, (0.62 + 0.42 * g) * (0.55 + 0.55 * t)); } });
  }
  function cloth(L, path, z, col, o = {}) {
    const f = fields(); const c0 = hex(col);
    Pr.pillow(L, path, { base: z, lift: o.lift ?? 0.1, radius: o.radius ?? 8, kind: o.kind || 'leather', rough: 0.7, rule: o.rule, color: (gx, gy, t) => shade(c0, (0.55 + 0.5 * t) * (0.8 + 0.3 * sample(f.mid, gx * 3, gy * 3))) });
  }
  const tube = (L, path, w, col, z, mat = IRON, h = 0.16) => L.tube(path, w, { albedo: col, base: z, peak: z + h, ...mat });
  const shaft = (L, fr, u0, u1, w, z, col = '#5a3a22') => L.tube(fr.P([[u0, 0], [u1, 0]], false), w, { albedo: col, base: z, peak: z + 0.16, kind: 'wood', rough: 0.55 });
  function wrap(L, fr, u0, u1, w, z, col = '#3a2418') {
    L.fill(fr.P([[u0, -w / 2], [u1, -w / 2], [u1, w / 2], [u0, w / 2]]), { albedo: col, height: z + 0.14, kind: 'leather', rough: 0.65, op: 'source-over' });
    for (let u = u0 + 4; u < u1; u += 7) L.engrave(fr.P([[u, -w / 2], [u + 5, w / 2]], false), 1.4, 0.3);
  }
  function glow(L, x, y, r, col) { L.glow((e) => { const g = e.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y, r, 0, TAU); e.fill(); }); }
  function orb(L, x, y, r, z, c1, c2, e = 0.55) {
    const f = fields(); const a = hex(c1), b = hex(c2);
    L.paint(circle(r, x, y), (gx, gy, px) => { const dx = (gx - x) / r, dy = (gy - y) / r; const d2 = dx * dx + dy * dy; const pr = Math.sqrt(Math.max(0, 1 - d2)); const n = sample(f.mid, gx * 2, gy * 2); let c = mix(a, b, clamp01(n * 1.2 - 0.1)); c = shade(c, 0.5 + 0.6 * pr); const hl = Math.exp(-(((dx + 0.35) ** 2 + (dy + 0.4) ** 2) / 0.02)); c = mix(c, [240, 240, 250], hl * 0.85); px.rgb = c; px.h = z + 0.3 * pr; px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.05; px.e = mix(a, b, n).map((v) => v * e * (0.4 + 0.6 * pr)); });
  }
  function spike(L, x, y, ang, len, w, z, col = [150, 154, 160]) {
    const pts = [[x + Math.cos(ang + Math.PI / 2) * w, y + Math.sin(ang + Math.PI / 2) * w], [x + Math.cos(ang) * len, y + Math.sin(ang) * len], [x - Math.cos(ang + Math.PI / 2) * w, y - Math.sin(ang + Math.PI / 2) * w]];
    steel(L, poly(pts), z, { radius: 3, lift: 0.08, col });
  }

  /* ---------- lames ---------- */
  function blade(L, o) {
    const fr = o.fr || F(); const { T, p } = fr; const z = o.z ?? 0.3; const len = o.len, w = o.w; const N = 40; const top = [], bot = [];
    for (let i = 0; i <= N; i += 1) {
      const t = i / N; const u = o.u0 + t * len; const vc = (o.curve || 0) * t * t * len;
      let hw = w * (1 - (o.taper ?? 0.25) * t); if (o.wavy) hw *= 1 + o.wavy * Math.sin(t * Math.PI * 9);
      const tipT = o.tipStart ?? 0.84; if (t > tipT) hw *= Math.sqrt(Math.max(0, 1 - (t - tipT) / (1 - tipT)));
      if (o.single) { top.push([u, vc - hw * 0.7]); bot.push([u, vc + hw * (t > tipT ? 0.9 : 1.1)]); } else { top.push([u, vc - hw]); bot.push([u, vc + hw]); }
    }
    const outline = [...top, ...bot.reverse()];
    steel(L, poly(T(outline)), z + 0.06, { radius: o.radius ?? Math.min(14, w * 0.6), lift: 0.12, col: o.col, rust: o.rust });
    if (o.fuller !== false) L.engrave(smoothPath(T(top.slice(2, Math.round(N * 0.7)).map(([u, v], i) => [u, (o.single ? v + w * 0.45 : v + (bot[N - 2 - i] ? 0 : 0) + w)])), false), Math.max(2, w * 0.14), 0.3, { albedo: '#5a5e64' });
    if (o.serrate) for (let k = 0; k < o.serrate; k += 1) { const t = 0.15 + k * 0.6 / o.serrate; const u = o.u0 + t * len; L.fill(poly(T([[u, -w - 1], [u + 8, -w + 8], [u + 14, -w - 1]])), { albedo: 'rgba(0,0,0,0)', height: 0, op: 'destination-out' }); }
    return { fr, top, bot };
  }
  function guard(L, fr, u, o) {
    const z = o.z ?? 0.3; const col = o.col || '#8a6a34'; const mat = o.mat || GOLD; const gw = o.gw || 60;
    if (o.type === 'cross' || o.type === 'curved') {
      const pts = o.type === 'curved' ? [[u + 16, -gw], [u, -gw * 0.6], [u - 4, 0], [u, gw * 0.6], [u + 16, gw]] : [[u, -gw], [u - 2, 0], [u, gw]];
      L.tube(fr.S(pts, false), o.th || 16, { albedo: col, base: z + 0.2, peak: z + 0.36, ...mat });
      for (const [uu, vv] of [pts[0], pts[pts.length - 1]]) L.dome(...fr.p(uu, vv), (o.th || 16) * 0.62, { albedo: col, base: z + 0.24, peak: z + 0.38, ...mat });
    } else if (o.type === 'tsuba') {
      L.ellipse(...fr.p(u, 0), 9, gw * 0.7, fr.a, { albedo: col, base: z + 0.2, peak: z + 0.34, ...mat });
    } else if (o.type === 'cup') {
      metal(L, fr.S([[u + 18, -gw * 0.75], [u - 6, -gw * 0.8], [u - 12, 0], [u - 6, gw * 0.8], [u + 18, gw * 0.75], [u + 4, 0]]), z + 0.18, col, mat, { radius: 12 });
    } else if (o.type === 'swept') {
      L.tube(fr.S([[u, -gw], [u - 2, 0], [u, gw]], false), 10, { albedo: col, base: z + 0.22, peak: z + 0.34, ...mat });
      for (const d of [-1, 1]) L.tube(fr.S([[u, d * 8], [u + 22, d * 30], [u + 6, d * 44], [u - 12, d * 30], [u - 6, d * 10]], false), 7, { albedo: col, base: z + 0.22, peak: z + 0.32, ...mat });
      L.tube(fr.S([[u - 6, gw * 0.7], [u - 40, gw * 0.95], [u - (o.grip || 80) + 4, gw * 0.5], [u - (o.grip || 80) - 6, 6]], false), 7, { albedo: col, base: z + 0.22, peak: z + 0.32, ...mat });
    }
  }
  function grip(L, fr, u, len, o = {}) {
    const z = o.z ?? 0.3; const w = o.w || 22; const f = fields();
    if (o.katana) {
      L.fill(fr.P([[u, -w / 2], [u - len, -w / 2], [u - len, w / 2], [u, w / 2]]), { albedo: '#1c1614', height: z + 0.16, kind: 'leather', rough: 0.7, op: 'source-over' });
      for (let k = 0; k < len / 16; k += 1) { const uu = u - 8 - k * 16; L.fill(fr.P([[uu, 0], [uu - 7, -w / 2 + 2], [uu - 14, 0], [uu - 7, w / 2 - 2]]), { albedo: '#d8ccb0', height: z + 0.2, kind: 'cloth', rough: 0.8, op: 'source-over' }); }
    } else {
      Pr.pillow(L, fr.P([[u, -w / 2], [u - len, -w / 2 + 1], [u - len, w / 2 - 1], [u, w / 2]]), { base: z + 0.14, lift: 0.12, radius: w * 0.4, kind: 'leather', rough: 0.6, color: (gx, gy, t) => shade(hex(o.col || '#42221a'), (0.55 + 0.5 * t) * (0.8 + 0.3 * sample(f.mid, gx * 3, gy * 3))) });
      for (let k = 0; k < len / 9; k += 1) L.engrave(fr.P([[u - 5 - k * 9, -w / 2], [u - 11 - k * 9, w / 2]], false), 1.5, 0.3);
    }
    const pu = u - len - (o.pr || 14) * 0.7;
    if (o.pommel !== false) {
      metal(L, circle(o.pr || 16, ...fr.p(pu, 0)), z + 0.16, o.pcol || '#8a6a34', o.pmat || GOLD, { radius: (o.pr || 16) * 0.6, lift: 0.14 });
      if (o.gem) gem(L, ...fr.p(pu, 0), (o.pr || 16) * 0.45, { color: o.gem, cut: 'cabochon', setting: 1, setAlbedo: '#6e5a32', base: z + 0.32, lift: 0.1 });
    }
  }
  function sword(L, o) {
    const fr = o.fr || F(o.cx, o.cy, o.a);
    blade(L, { ...o, fr });
    grip(L, fr, o.u0 - 4, o.grip || 90, { w: o.gripW, katana: o.katana, pr: o.pr, gem: o.gem, pcol: o.pcol, pmat: o.pmat, col: o.gripCol, pommel: o.pommel, z: o.z });
    if (o.guard !== 'none') guard(L, fr, o.u0, { type: o.guard || 'cross', gw: o.gw, col: o.gcol, mat: o.gmat, th: o.th, grip: o.grip, z: o.z });
    return fr;
  }

  /* ---------- hampes ---------- */
  function leafHead(L, fr, u, len, w, z, o = {}) {
    steel(L, fr.S([[u, -w * 0.35], [u + len * 0.35, -w], [u + len, 0], [u + len * 0.35, w], [u, w * 0.35]]), z + 0.08, { radius: w * 0.5, col: o.col, rust: o.rust });
    L.engrave(fr.P([[u + 6, 0], [u + len * 0.8, 0]], false), 2, 0.3);
    metal(L, fr.P([[u - 30, -9], [u + 4, -8], [u + 4, 8], [u - 30, 9]]), z + 0.06, '#3a3634', IRON, { radius: 5 });
  }
  function prongs(L, fr, u, len, spread, z, o = {}) {
    metal(L, fr.S([[u - 20, -10], [u + 10, -spread - 6], [u + 22, -spread - 6], [u + 18, 0], [u + 22, spread + 6], [u + 10, spread + 6], [u - 20, 10]]), z + 0.08, o.base || '#4a4644', o.mat || IRON, { radius: 6 });
    for (const d of o.n === 2 ? [-1, 1] : [-1, 0, 1]) {
      const v = d * spread; const L2 = d === 0 ? len : len * 0.82;
      L.taper(fr.T([[u + 14, v], [u + L2, v]]), [o.w || 10, o.w || 10], { albedo: o.col || '#9a9ea4', base: z + 0.14, peak: z + 0.26, ...(o.mat || STEEL) });
      steel(L, fr.P([[u + L2 - 2, v - (o.w || 10) * 0.7], [u + L2 + 26, v], [u + L2 - 2, v + (o.w || 10) * 0.7]]), z + 0.14, { radius: 3, col: o.tipCol });
      if (o.barbs) steel(L, fr.P([[u + L2 - 2, v - 4], [u + L2 - 14, v - (d === 0 ? 14 : d * 14)], [u + L2 + 8, v - 2]]), z + 0.16, { radius: 2 });
    }
  }

  /* ---------- arcs ---------- */
  function bow(L, o) {
    const fr = F(C + (o.dx || 0), C + (o.dy || 0), -Math.PI / 4); const z = 0.3; const H = o.h || 220; const bulge = o.bulge ?? 70; const f = fields();
    const limb = (s) => { const pts = []; for (let i = 0; i <= 30; i += 1) { const t = i / 30; const v = s * t * H; let u = bulge * (1 - t * t); if (o.recurve && t > 0.8) u -= o.recurve * ((t - 0.8) / 0.2) ** 2; pts.push([u, v]); } return pts; };
    for (const s of [-1, 1]) L.taper(fr.T(limb(s)), (t) => (o.w || 26) * (1 - 0.5 * t), { albedo: o.col || '#6a4526', base: z + 0.08, peak: z + 0.22, kind: o.kind || 'wood', rough: 0.5, metal: o.metal || 0 });
    if (o.bands) for (const [s, t] of [[-1, 0.4], [1, 0.4], [-1, 0.7], [1, 0.7]]) { const [u, v] = limb(s)[Math.round(t * 30)]; L.dome(...fr.p(u, v), (o.w || 16) * 0.55, { albedo: o.bands, base: z + 0.18, peak: z + 0.28, ...(o.bandMat || GOLD) }); }
    const tipU = bulge * 0 - (o.recurve || 0);
    for (const s of [-1, 1]) L.dome(...fr.p(tipU, s * H), 5, { albedo: '#d8ccb0', base: z + 0.2, peak: z + 0.26, kind: 'bone', rough: 0.5 });
    const nock = o.drawn ? -60 : tipU + 4;
    for (const s of [-1, 1]) L.stroke(fr.P([[tipU, s * H], [nock, 0]], false), 3.6, { albedo: '#e0d4b8', height: z + 0.3, kind: 'cloth', rough: 0.8 });
    wrap(L, fr, bulge - 26, bulge + 22, (o.w || 26) + 8, z + 0.1, o.wrap || '#3a2418');
    if (o.arrows) for (const [ang, n] of o.arrows) arrow(L, F(C + (o.dx || 0), C + (o.dy || 0), -Math.PI / 4 + ang), nock, 230, z + 0.32, n);
    return fr;
  }
  function arrow(L, fr, u0, len, z, o = {}) {
    L.taper(fr.T([[u0, 0], [u0 + len, 0]]), [9, 9], { albedo: '#8a6a44', base: z, peak: z + 0.06, kind: 'wood', rough: 0.6 });
    steel(L, fr.P([[u0 + len - 6, -15], [u0 + len + 36, 0], [u0 + len - 6, 15]]), z + 0.02, { radius: 4 });
    for (const d of [-1, 1]) L.fill(fr.P([[u0 + 4, 0], [u0 - 8, d * 20], [u0 + 40, d * 16], [u0 + 46, 0]]), { albedo: o.fletch || '#8a2a1e', height: z + 0.04, kind: 'cloth', rough: 0.8, op: 'source-over' });
  }

  /* ---------- arbalètes ---------- */
  function crossbow(L, o = {}) {
    const s = o.s || 1; const fr = F(C + (o.dx || 0), C + (o.dy || 0), -Math.PI / 4); const { T, p } = fr; const z = 0.3; const S = (pts) => pts.map(([u, v]) => [u * s, v * s]);
    wood(L, fr.S(S([[-200, -30], [-150, -24], [-40, -22], [150, -20], [162, 0], [150, 20], [-40, 24], [-120, 32], [-200, 56], [-218, 14]])), z, o.wood || [116, 72, 40]);
    const limb = (d) => S(bezierPts([120, 0], [118, d * 70], [96, d * 140], [58, d * 176], 20));
    for (const d of [-1, 1]) L.taper(T(limb(d)), (t) => (24 - 12 * t) * s, { albedo: o.limb || '#8a8e94', base: z + 0.14, peak: z + 0.28, ...(o.limbMat || STEEL) });
    for (const d of [-1, 1]) L.stroke(fr.P(S([[58, d * 176], [-34, 0]]), false), 3.2, { albedo: '#d8ccb0', height: z + 0.3, kind: 'cloth', rough: 0.8 });
    L.fill(Pr.roundRectAt(...p(116 * s, 0), 26 * s, 34 * s, fr.a, 3), { albedo: '#2e2a28', height: z + 0.2, ...IRON, op: 'source-over' });
    L.torus(...p(172 * s, 0), 22 * s, 16 * s, fr.a, 0.32, { albedo: '#3a3431', base: z + 0.12, peak: z + 0.24, ...IRON });
    L.taper(T(S([[-60, 18], [-96, 56]])), [7 * s, 4 * s], { albedo: '#2e2a28', base: z + 0.1, peak: z + 0.2, ...IRON });
    for (const u of [-150, -90, 40, 90]) rivet(L, ...p(u * s, 0), 3.2 * s, { base: z + 0.2, peak: z + 0.28, albedo: o.rivet || '#8a6a34' });
    if (o.bolt !== false) {
      L.taper(T(S([[-30, 0], [150, 0]])), [9 * s, 9 * s], { albedo: '#6a4a2c', base: z + 0.22, peak: z + 0.3, kind: 'wood', rough: 0.6 });
      steel(L, fr.P(S([[150, -13], [196, 0], [150, 13]])), z + 0.24, { radius: 3 });
      for (const d of [-1, 1]) L.fill(fr.P(S([[-30, 0], [-50, d * 12], [-38, d * 12], [-20, 0]])), { albedo: o.fletch || '#8a2a1e', height: z + 0.3, kind: 'cloth', rough: 0.8, op: 'source-over' });
    }
    return fr;
  }

  /* ---------- armes à feu ---------- */
  function longgun(L, o) {
    const fr = F(C, C + (o.dy || 0), o.a ?? -0.5); const { T, p } = fr; const z = 0.3; const bl = o.barrel || 250, bw = o.bw || 26;
    const barrels = o.double ? [-10, 10] : [0];
    wood(L, fr.S([[bl - 40, -10], [bl - 36, 12], [-40, 16], [-120, 30], [-230, 64], [-240, 30], [-236, -8], [-150, -12], [-40, -14]]), z, o.wood || [104, 58, 32]);
    for (const dv of barrels) tube(L, fr.P([[-40, -18 + dv], [bl, -18 + dv]], false), bw, '#4a4644', z + 0.1, IRON, 0.2);
    if (o.flare) metal(L, fr.P([[bl - 20, -18 - bw / 2], [bl + 34, -18 - o.flare], [bl + 34, -18 + o.flare], [bl - 20, -18 + bw / 2]]), z + 0.12, o.flareCol || '#8a6a34', BRASS, { radius: 8 });
    for (const u of o.bands || [bl * 0.4, bl * 0.75]) tube(L, fr.P([[u, -18], [u + 5, -18]], false), bw + 5, '#8a6a34', z + 0.12, BRASS, 0.22);
    metal(L, Pr.roundRectAt(...p(-60, 2), 80, 28, fr.a, 10), z + 0.16, '#4a4644', IRON, { radius: 5 });
    if (o.match) { L.taper(T(bezierPts([-80, 0], [-96, -30], [-80, -56], [-56, -52], 16)), [6, 5], { albedo: '#3a3634', base: z + 0.2, peak: z + 0.32, ...IRON }); L.dome(...p(-54, -54), 5, { albedo: '#ff8a3a', base: z + 0.3, peak: z + 0.36, kind: 'glass', rough: 0.3, emissive: 'rgba(255,120,30,0.9)' }); glow(L, ...p(-54, -54), 30, 'rgba(255,120,40,0.5)'); }
    else { L.taper(T(bezierPts([-86, 0], [-100, -30], [-80, -52], [-56, -48], 16)), [9, 7], { albedo: '#3a3634', base: z + 0.2, peak: z + 0.34, ...IRON }); L.fill(Pr.roundRectAt(...p(-52, -46), 14, 12, fr.a, 2), { albedo: '#2a2622', height: z + 0.34, kind: 'stone', rough: 0.7, op: 'source-over' }); }
    L.stroke((ctx) => { const [cx, cy] = p(-110, 36); ctx.beginPath(); ctx.ellipse(cx, cy, 22, 14, fr.a, 0, TAU); }, 4, { albedo: '#8a6a34', height: z + 0.2, ...BRASS });
    metal(L, fr.P([[-232, 66], [-244, 30], [-238, -10], [-226, -8], [-230, 30], [-220, 62]]), z + 0.14, '#8a6a34', BRASS, { radius: 4 });
    if (o.gem) gem(L, ...p(-150, 16), 9, { color: o.gem, cut: 'cabochon', setting: 1, setAlbedo: '#8a6a34', base: z + 0.26, lift: 0.1 });
    return fr;
  }

  /* ---------- bâtons, sceptres ---------- */
  function staff(L, o) {
    const fr = F(C + (o.dx || 0), C + (o.dy || 0)); const z = 0.3; const u1 = o.top ?? 150;
    L.tube(fr.P([[-230, 0], [u1, 0]], false), o.w || 30, { albedo: o.col || '#4a3020', base: z, peak: z + 0.18, kind: 'wood', rough: 0.5 });
    if (o.knots !== false) for (const u of [-150, -40, 60]) L.ellipse(...fr.p(u, 0), 8, (o.w || 22) * 0.62, fr.a, { albedo: o.col || '#4a3020', base: z + 0.06, peak: z + 0.2, kind: 'wood', rough: 0.5 });
    if (o.wrapAt) wrap(L, fr, o.wrapAt[0], o.wrapAt[1], (o.w || 22) + 6, z, o.wrapCol);
    metal(L, fr.P([[-240, -12], [-222, -13], [-222, 13], [-240, 12]]), z + 0.08, o.cap || '#8a6a34', BRASS, { radius: 5 });
    return fr;
  }
  function sceptre(L, o) {
    const fr = F(C - 20, C + 20); const z = 0.3; const len = o.len || 250;
    L.tube(fr.P([[-200, 0], [len - 200, 0]], false), 22, { albedo: o.rod || '#2e2622', base: z, peak: z + 0.18, kind: o.rodKind || 'wood', rough: 0.4, metal: o.rodMetal || 0 });
    for (let k = 0; k < 5; k += 1) L.tube(fr.P([[-160 + k * 44, 0], [-150 + k * 44, 0]], false), 28, { albedo: o.band || '#8a6a34', base: z + 0.04, peak: z + 0.22, ...(o.bandMat || GOLD) });
    metal(L, circle(18, ...fr.p(-206, 0)), z + 0.06, o.band || '#8a6a34', o.bandMat || GOLD, { radius: 10, lift: 0.14 });
    return { fr, hu: len - 200 };
  }

  /* ---------- boucliers ---------- */
  function shieldShape(kind) {
    if (kind === 'round') return (ctx) => { ctx.beginPath(); ctx.arc(C, C, 190, 0, TAU); };
    if (kind === 'scutum') return (ctx) => { ctx.beginPath(); ctx.roundRect(C - 118, C - 200, 236, 400, 30); };
    return (ctx) => { ctx.beginPath(); ctx.moveTo(C - 150, C - 170); ctx.lineTo(C + 150, C - 170); ctx.quadraticCurveTo(C + 156, C + 50, C, C + 200); ctx.quadraticCurveTo(C - 156, C + 50, C - 150, C - 170); ctx.closePath(); };
  }
  function shield(L, kind, paint, o = {}) {
    const f = fields(); const z = 0.3; const shape = shieldShape(kind);
    Pr.pillow(L, shape, { base: z, lift: 0.16, radius: 40, kind: o.kind || 'paint', rough: 0.5, metal: o.metal || 0, color: (gx, gy, t) => { const n = sample(f.mid, gx * 1.8, gy * 1.8); const chip = smooth(0.66, 0.72, n * 0.7 + sample(f.high, gx * 1.2, gy * 1.2) * 0.4) * (o.wear ?? 1); return mix(shade(paint(gx, gy), (0.62 + 0.45 * t) * (0.85 + 0.25 * n)), [96, 70, 44], chip * 0.8); } });
    L.stroke(shape, o.rimW || 14, { albedo: o.rim || '#4a4644', height: z + 0.2, ...(o.rimMat || IRON) });
    return shape;
  }

  /* ---------- poings et griffes ---------- */
  function gauntlet(L, o = {}) {
    const f = fields(); const z = 0.3; const fr = F(C + 10, C + 10, -0.5);
    const col = hex(o.col || '#8a8e94'); const mat = o.mat || STEEL;
    const skin = (gx, gy, t, k = 1) => shade(col, (0.5 + 0.58 * t) * k * (0.85 + 0.25 * sample(f.mid, gx * 2, gy * 2)));
    const cuffC = o.cuffColor || skin; const fistC = o.fistColor || skin;
    Pr.pillow(L, fr.S([[-230, -96], [-90, -76], [-70, 0], [-90, 80], [-230, 104], [-250, 0]]), { base: z, lift: 0.14, radius: 34, ...mat, color: (gx, gy, t) => cuffC(gx, gy, t) });
    Pr.pillow(L, fr.S([[-96, -88], [40, -100], [96, -70], [100, 70], [40, 96], [-96, 84], [-110, 0]]), { base: z + 0.06, lift: 0.16, radius: 40, ...mat, color: (gx, gy, t) => fistC(gx, gy, t) });
    for (let k = 0; k < 4; k += 1) {
      const v = -72 + k * 48;
      Pr.pillow(L, Pr.roundRectAt(...fr.p(118, v), 74, 44, fr.a, 20), { base: z + 0.12, lift: 0.14, radius: 18, ...mat, color: (gx, gy, t) => fistC(gx, gy, t, 0.95) });
      L.engrave(fr.P([[96, v - 20], [96, v + 20]], false), 1.6, 0.3);
    }
    Pr.pillow(L, fr.S([[-40, 60], [40, 70], [120, 104], [130, 128], [60, 130], [-30, 110]]), { base: z + 0.26, lift: 0.12, radius: 22, ...mat, color: (gx, gy, t) => fistC(gx, gy, t, 1.05) });
    return fr;
  }
  function claws(L, o) {
    const fr = F(C - 30, C + 40, -Math.PI / 4); const z = 0.3;
    metal(L, fr.S([[-120, -90], [-20, -96], [10, 0], [-20, 96], [-120, 90], [-140, 0]]), z, o.bar || '#3a3634', IRON, { radius: 16 });
    for (const v of [-60, -20, 20, 60]) { const pts = bezierPts([0, v], [90, v - 6], [160, v + o.curl], [210, v + o.curl * 2.2], 20); L.taper(fr.T(pts), (t) => 16 * (1 - 0.9 * t), { albedo: o.blade || '#a8acb2', base: z + 0.16, peak: z + 0.3, ...STEEL }); }
    for (const v of [-80, 80]) L.torus(...fr.p(-80, v * 0.9), 20, 14, fr.a, 0.3, { albedo: '#3a3634', base: z + 0.1, peak: z + 0.2, ...IRON });
    return fr;
  }

  const W = {};
  const add = (name, cat, draw) => { W[name] = { name, cat, draw }; };

  /* ======== ARCHERIE ======== */
  add('Arbalète', 'Archerie', (L) => { crossbow(L); });
  add('Arbalète à répétition', 'Archerie', (L) => { const fr = crossbow(L, { bolt: false, wood: [80, 50, 32] }); wood(L, fr.P([[-40, -34], [110, -34], [110, 34], [-40, 34]]), 0.62, [86, 54, 32], { radius: 10 }); for (let k = 0; k < 4; k += 1) L.stroke(fr.P([[-30 + k * 36, -34], [-30 + k * 36, 34]], false), 3, { albedo: '#8a6a34', height: 0.8, ...BRASS }); L.taper(fr.T([[-140, -30], [-100, -80], [-60, -84]]), [10, 8], { albedo: '#3a3634', base: 0.6, peak: 0.74, ...IRON }); metal(L, circle(12, ...fr.p(-60, -84)), 0.66, '#8a6a34', BRASS); for (let k = 0; k < 3; k += 1) steel(L, fr.P([[112, -24 + k * 22], [138, -18 + k * 22], [112, -12 + k * 22]]), 0.66, { radius: 2 }); });
  add('Arbalète d’esclavagiste', 'Archerie', (L) => { const fr = crossbow(L, { bolt: false, wood: [70, 44, 30], limb: '#5a5654', limbMat: IRON }); L.taper(fr.T([[-30, 0], [150, 0]]), [9, 9], { albedo: '#3a3634', base: 0.52, peak: 0.6, ...IRON }); L.torus(...fr.p(176, 0), 24, 24, fr.a, 0.4, { albedo: '#4a4644', base: 0.54, peak: 0.7, ...IRON }); L.torus(...fr.p(176, 0), 10, 10, fr.a, 0.4, { albedo: '#2a2624', base: 0.58, peak: 0.66, ...IRON }); chain(L, fr.T(bezierPts([176, 26], [120, 120], [0, 150], [-90, 110], 12)), 13, { albedo: '#4a4644' }); L.torus(...fr.p(-96, 108), 20, 14, fr.a + 0.6, 0.4, { albedo: '#4a4644', base: 0.52, peak: 0.66, ...IRON }); });
  add('Arbalète de poing', 'Archerie', (L) => { const fr = crossbow(L, { s: 0.72, dx: 20, dy: -20 }); wood(L, fr.S([[-110, 16], [-90, 20], [-120, 120], [-160, 118], [-140, 20]]), 0.3, [96, 56, 32]); });
  add('Arbalète marine', 'Archerie', (L) => { const fr = crossbow(L, { bolt: false, wood: [78, 64, 50], rivet: '#b89a58', limb: '#9a8a60', limbMat: BRASS }); L.taper(fr.T([[-30, 0], [170, 0]]), [11, 11], { albedo: '#4a4644', base: 0.52, peak: 0.6, ...IRON }); steel(L, fr.P([[166, -16], [214, 0], [166, 16]]), 0.54, { radius: 3 }); for (const d of [-1, 1]) steel(L, fr.P([[176, d * 4], [160, d * 26], [186, d * 8]]), 0.56, { radius: 2 }); L.stroke(fr.S([[-30, 0], [-80, 60], [-40, 110], [20, 100], [-10, 60]], false), 5, { albedo: '#c8b890', height: 0.5, kind: 'cloth', rough: 0.9 }); });
  add('Arc classique', 'Archerie', (L) => { bow(L, { arrows: [[0, {}]] }); });
  add('Arc de chasse', 'Archerie', (L) => { const fr = bow(L, { col: '#5a3a1e', h: 200, bulge: 64, wrap: '#5a4230', arrows: [[0, { fletch: '#3a4a2a' }]] }); for (const s of [-1, 1]) { const [x, y] = fr.p(38, s * 150); feather(L, x, y, 40, 11, Math.PI / 2 + 0.3 * s, { albedo: '#7a6a4a', base: 0.56, peak: 0.62, seed: 3, curve: 0.05 }); } });
  add('Arc long', 'Archerie', (L) => { bow(L, { h: 250, bulge: 44, w: 22, col: '#7a5230', arrows: [[0, {}]] }); });
  add('Arc lourd', 'Archerie', (L) => { bow(L, { h: 210, bulge: 76, w: 36, col: '#3e2a1a', bands: '#5a5654', bandMat: IRON, wrap: '#2a1a12' }); });
  add('Arc triple', 'Archerie', (L) => { bow(L, { h: 214, bulge: 70, w: 26, col: '#5a3a22', bands: '#8a6a34', drawn: true, arrows: [[-0.16, {}], [0, {}], [0.16, {}]] }); });
  add('Arc’Sây', 'Archerie', (L) => { bow(L, { h: 214, bulge: 80, w: 26, col: '#d8ccb0', kind: 'bone', recurve: 60, bands: '#8a1e18', bandMat: { kind: 'paint', metal: 0, rough: 0.3 }, wrap: '#1a1414', arrows: [[0, { fletch: '#1a1414' }]] }); });
  add('Sarbacane', 'Archerie', (L) => { const fr = F(); L.tube(fr.P([[-230, 0], [220, 0]], false), 18, { albedo: '#8a7a4a', base: 0.3, peak: 0.46, kind: 'wood', rough: 0.4 }); for (const u of [-170, -60, 60, 170]) L.tube(fr.P([[u, 0], [u + 8, 0]], false), 22, { albedo: '#5a4a2a', base: 0.32, peak: 0.5, kind: 'wood', rough: 0.4 }); for (const k of [0, 1, 2]) { const f2 = F(C - 60 + k * 30, C + 110 + k * 12, -0.2); L.taper(f2.T([[-50, 0], [50, 0]]), [3, 3], { albedo: '#6a5a3a', base: 0.5, peak: 0.54, kind: 'wood', rough: 0.6 }); L.dome(...f2.p(-50, 0), 8, { albedo: ['#c8b890', '#8a2a1e', '#d8ccb0'][k], base: 0.52, peak: 0.6, kind: 'cloth', rough: 0.8 }); } });

  /* ======== ARMES À FEU ======== */
  add('Arquebuse', 'Armes à feu', (L) => { longgun(L, { match: true }); });
  add('Mousquet', 'Armes à feu', (L) => { longgun(L, { barrel: 290, bw: 24, bands: [100, 170, 240] }); });
  add('Fusil de chasse', 'Armes à feu', (L) => { longgun(L, { double: true, bw: 20, wood: [120, 70, 36] }); });
  add('Pistolet à silex', 'Armes à feu', (L) => { root.WeaponLab.WEAPONS.pistolet.draw(L, 0.2); });
  add('Tromblon', 'Armes à feu', (L) => { longgun(L, { barrel: 190, bw: 30, flare: 44 }); });
  add('Tromblon supérieur', 'Armes à feu', (L) => { longgun(L, { barrel: 200, bw: 32, flare: 54, flareCol: '#b8923e', wood: [70, 30, 26], gem: '#1a4478', bands: [60, 110, 160] }); });
  add('Canon', 'Armes à feu', (L) => { const fr = F(C, C - 20, -0.35); for (const [x, y] of [[C - 70, C + 120], [C + 90, C + 70]]) Pr.wheel(L, x, y, 70, { z: 0.3, spokes: 10, mud: 0.5 }); wood(L, fr.P([[-170, 30], [80, 30], [80, 70], [-190, 90]]), 0.4, [90, 56, 32]); metal(L, fr.S([[-150, -40], [150, -32], [200, -44], [210, 0], [200, 44], [150, 32], [-150, 40], [-180, 0]]), 0.46, '#7a5a34', BRASS, { radius: 26, lift: 0.18 }); for (const u of [-80, 40, 150]) L.tube(fr.P([[u, -44], [u, 44]], false), 12, { albedo: '#4a4644', base: 0.56, peak: 0.66, ...IRON }); metal(L, circle(20, ...fr.p(-196, 0)), 0.5, '#3a3634'); Pr.wheel(L, C - 70, C + 120, 70, { z: 0.62, spokes: 10, mud: 0.5 }); });

  /* ======== LAMES ======== */
  add('Épée bâtarde', 'Lames', (L) => { root.WeaponLab.WEAPONS.batarde.draw(L, 0.2); });
  add('Claymore', 'Lames', (L) => { sword(L, { cx: C + 10, cy: C - 10, u0: -80, len: 300, w: 26, grip: 110, guard: 'curved', gw: 84, gcol: '#5a5654', gmat: IRON, pcol: '#5a5654', pmat: IRON, pr: 18 }); });
  add('Flamberge', 'Lames', (L) => { sword(L, { u0: -80, len: 310, w: 24, wavy: 0.22, grip: 100, guard: 'cross', gw: 66, gem: '#6a1414' }); });
  add('Rapière', 'Lames', (L) => { sword(L, { u0: -60, len: 300, w: 9, taper: 0.4, grip: 80, gripW: 18, guard: 'swept', gw: 54, fuller: false, pr: 14 }); });
  add('Fleuret', 'Lames', (L) => { sword(L, { u0: -50, len: 300, w: 6, taper: 0.5, grip: 76, gripW: 16, guard: 'cup', gw: 46, gcol: '#b8bcc0', gmat: STEEL, fuller: false, pr: 13, pcol: '#b8bcc0', pmat: STEEL }); });
  add('Cimeterre', 'Lames', (L) => { sword(L, { u0: -70, len: 280, w: 30, taper: -0.3, curve: -0.18, single: true, tipStart: 0.78, grip: 84, guard: 'curved', gw: 50, pr: 14 }); });
  add('Katana', 'Lames', (L) => { sword(L, { u0: -70, len: 290, w: 17, taper: 0.1, curve: -0.07, single: true, grip: 110, gripW: 22, katana: true, guard: 'tsuba', gw: 56, gcol: '#2a2624', gmat: IRON, pr: 12, pcol: '#2a2624', pmat: IRON }); });
  add('Wakizashi', 'Lames', (L) => { sword(L, { cx: C + 20, cy: C - 20, u0: -40, len: 200, w: 16, taper: 0.1, curve: -0.07, single: true, grip: 80, gripW: 22, katana: true, guard: 'tsuba', gw: 50, gcol: '#6a1414', gmat: { kind: 'paint', metal: 0, rough: 0.3 }, pr: 11, pcol: '#2a2624', pmat: IRON }); });
  add('Dague', 'Lames', (L) => { sword(L, { cx: C + 20, cy: C - 20, u0: -20, len: 180, w: 20, taper: 0.4, grip: 70, guard: 'cross', gw: 44, pr: 15 }); });
  add('Dague brise-épée', 'Lames', (L) => { const fr = sword(L, { cx: C + 20, cy: C - 20, u0: -20, len: 200, w: 24, taper: 0.3, grip: 70, guard: 'cross', gw: 48, pr: 15, fuller: false }); for (let k = 0; k < 6; k += 1) { const u = -4 + 20 + k * 22; L.engraveFill(fr.P([[u, -30], [u + 9, -30], [u + 9, -6], [u, -6]]), 0.9, { albedo: '#0c0c0e' }); } });
  add('Poignard', 'Lames', (L) => { sword(L, { cx: C + 30, cy: C - 30, u0: -10, len: 150, w: 18, taper: 0.2, curve: -0.12, grip: 76, gripCol: '#2a1a14', guard: 'none', pr: 13, pcol: '#5a5654', pmat: IRON }); });
  add('Miséricorde', 'Lames', (L) => { sword(L, { cx: C + 20, cy: C - 20, u0: -20, len: 200, w: 11, taper: 0.7, tipStart: 0.9, grip: 70, guard: 'cross', gw: 30, pr: 20, gcol: '#3a3634', gmat: IRON, pcol: '#3a3634', pmat: IRON, fuller: false }); });
  add('Baïonnette', 'Lames', (L) => { const fr = sword(L, { cx: C + 10, cy: C - 10, u0: -60, len: 260, w: 13, taper: 0.5, guard: 'none', grip: 1, pommel: false, fuller: false }); L.tube(fr.P([[-130, 0], [-56, 0]], false), 34, { albedo: '#4a4644', base: 0.34, peak: 0.52, ...IRON }); L.tube(fr.P([[-76, 0], [-60, 0]], false), 40, { albedo: '#5a5654', base: 0.36, peak: 0.56, ...IRON }); L.taper(fr.T([[-60, 0], [-30, 0]]), [22, 13], { albedo: '#8a8e94', base: 0.4, peak: 0.5, ...STEEL }); });
  add('Crochet de pirate', 'Lames', (L) => { const fr = F(C - 20, C + 40, -Math.PI / 4); cloth(L, fr.S([[-220, -60], [-60, -56], [-40, 0], [-60, 56], [-220, 60], [-236, 0]]), 0.3, '#3a2418', { radius: 26 }); for (const u of [-180, -120]) L.stroke(fr.P([[u, -62], [u, 62]], false), 6, { albedo: '#8a6a34', height: 0.5, ...BRASS }); metal(L, circle(40, ...fr.p(-40, 0)), 0.36, '#8a6a34', BRASS, { radius: 14 }); L.taper(fr.T([[-20, 0], [80, 0], ...bezierPts([80, 0], [200, 0], [220, 110], [140, 120], 20), [120, 90]]), (t) => 22 * (1 - 0.8 * t), { albedo: '#a8acb2', base: 0.44, peak: 0.6, ...STEEL }); });

  /* ======== HACHES, MASSES ======== */
  add('Hache de guerre', 'Haches et masses', (L) => { root.WeaponLab.WEAPONS.hache.draw(L, 0.2); });
  add('Hachette', 'Haches et masses', (L) => { const fr = F(C, C, -Math.PI / 4); shaft(L, fr, -170, 110, 22, 0.3, '#6a4428'); wrap(L, fr, -170, -90, 26, 0.3); steel(L, fr.S([[60, 8], [60, -14], [70, -40], [60, -104], [110, -112], [150, -96], [130, -40], [120, -14], [120, 8]]), 0.42, { radius: 10, rust: 0.3 }); L.stroke(fr.S([[60, -104], [110, -112], [150, -96]], false), 5, { albedo: '#d8dce0', height: 0.58, ...STEEL }); metal(L, fr.P([[60, -12], [124, -12], [124, 12], [60, 12]]), 0.44, '#3a3634'); });
  add('Marteau de guerre', 'Haches et masses', (L) => { const fr = F(); shaft(L, fr, -230, 150, 22, 0.3); wrap(L, fr, -230, -140, 26, 0.3); metal(L, fr.P([[110, -70], [200, -70], [200, 30], [110, 30]]), 0.42, '#5a5a5e', IRON, { radius: 14, lift: 0.18 }); metal(L, fr.P([[118, 30], [192, 30], [155, 120]]), 0.42, '#5a5a5e', IRON, { radius: 10 }); for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) L.dome(...fr.p(128 + i * 27, -58 + j * 27), 8, { albedo: '#6a6a6e', base: 0.56, peak: 0.66, ...IRON }); steel(L, fr.P([[196, -20], [240, -10], [196, 0]]), 0.44, { radius: 3 }); });
  add('Marteau Nor’Hoi', 'Haches et masses', (L) => { const fr = F(); shaft(L, fr, -230, 130, 30, 0.3, '#3e2a1a'); cloth(L, fr.S([[-80, -30], [-20, -34], [-10, 0], [-20, 34], [-80, 30]]), 0.4, '#6a5a44', { kind: 'cloth' }); metal(L, fr.S([[90, -120], [230, -110], [240, 0], [230, 110], [90, 120], [80, 0]]), 0.44, '#4a4c52', IRON, { radius: 26, lift: 0.22 }); for (const [u, v] of [[130, -70], [160, 0], [130, 70], [200, -40], [200, 40]]) { const [x, y] = fr.p(u, v); L.stroke((ctx) => { ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x + 6, y); ctx.lineTo(x - 8, y + 10); ctx.moveTo(x - 10, y); ctx.lineTo(x + 8, y); }, 3, { albedo: '#d8ff7a', height: 0.64, kind: 'glass', rough: 0.2, emissive: 'rgba(190,255,90,0.9)' }); } glow(L, ...fr.p(160, 0), 100, 'rgba(170,240,70,0.24)'); for (const v of [-120, 120]) metal(L, fr.P([[86, v * 1.02], [244, v * 0.94], [244, v * 0.84], [86, v * 0.9]]), 0.62, '#8a6a34', BRASS, { radius: 4 }); return { lights: [[...fr.p(160, 0), 90, [0.9, 1.4, 0.4]]] }; });
  add('Morgenstern', 'Haches et masses', (L) => { const fr = F(); shaft(L, fr, -230, 120, 24, 0.3); wrap(L, fr, -230, -140, 28, 0.3); const [x, y] = fr.p(170, 0); for (let k = 0; k < 12; k += 1) { const a = (k / 12) * TAU; spike(L, x + Math.cos(a) * 48, y + Math.sin(a) * 48, a, 36, 11, 0.44); } metal(L, circle(56, x, y), 0.46, '#4a4a4e', IRON, { radius: 30, lift: 0.22 }); for (let k = 0; k < 7; k += 1) { const a = (k / 7) * TAU + 0.3; spike(L, x + Math.cos(a) * 22, y + Math.sin(a) * 22, a, 34, 9, 0.66); } });
  add('Goupillon', 'Haches et masses', (L) => { const fr = F(); shaft(L, fr, -200, 110, 22, 0.3, '#3a2a20'); metal(L, fr.P([[-210, -16], [-190, -16], [-190, 16], [-210, 16]]), 0.36, '#8a6a34', GOLD); const [x, y] = fr.p(160, 0); metal(L, circle(50, x, y), 0.42, '#8a8a8e', STEEL, { radius: 26, lift: 0.2 }); for (let k = 0; k < 8; k += 1) { const a = (k / 8) * TAU; spike(L, x + Math.cos(a) * 44, y + Math.sin(a) * 44, a, 22, 8, 0.44); } for (const [du, dv] of [[0, 0], [16, 0], [-16, 0], [0, 16], [0, -16]]) L.dome(...fr.p(160 + du, dv), 9, { albedo: '#b8923e', base: 0.64, peak: 0.74, ...GOLD }); const beads = []; for (let k = 0; k < 9; k += 1) beads.push(fr.p(80 - k * 18, 30 + Math.sin(k * 0.8) * 16 + k * 5)); beads.forEach(([bx, by]) => L.dome(bx, by, 6, { albedo: '#6a4a2a', base: 0.5, peak: 0.58, kind: 'wood', rough: 0.4 })); });
  add('Fléau', 'Haches et masses', (L) => { const fr = F(C - 40, C + 40); shaft(L, fr, -180, 30, 26, 0.3); wrap(L, fr, -180, -100, 30, 0.3); metal(L, circle(18, ...fr.p(40, 0)), 0.4, '#3a3634'); chain(L, bezierPts(fr.p(50, 0), fr.p(110, -30), fr.p(160, -50), fr.p(200, -40), 10), 14, { albedo: '#4a4644' }); const [x, y] = fr.p(236, -30); for (let k = 0; k < 10; k += 1) { const a = (k / 10) * TAU; spike(L, x + Math.cos(a) * 40, y + Math.sin(a) * 40, a, 28, 10, 0.44); } metal(L, circle(46, x, y), 0.46, '#4a4a4e', IRON, { radius: 24, lift: 0.2 }); for (let k = 0; k < 6; k += 1) { const a = (k / 6) * TAU; spike(L, x + Math.cos(a) * 18, y + Math.sin(a) * 18, a, 28, 8, 0.66); } });

  /* ======== HAMPES ======== */
  add('Lance', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -240, 130, 18, 0.3, '#6a4428'); leafHead(L, fr, 130, 110, 28, 0.3); wrap(L, fr, -40, 20, 22, 0.3, '#5a1e18'); });
  add('Double lance', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -150, 150, 18, 0.3, '#4a3020'); leafHead(L, fr, 150, 90, 24, 0.3); leafHead(L, F(C, C, DIAG + Math.PI), 150, 90, 24, 0.3); wrap(L, fr, -40, 40, 24, 0.3); });
  add('Hallebarde', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -240, 150, 18, 0.3, '#5a3a22'); steel(L, fr.P([[150, -8], [240, 0], [150, 8]]), 0.4, { radius: 3 }); steel(L, fr.S([[100, 8], [120, 30], [96, 110], [150, 116], [196, 92], [170, 30], [150, 8]]), 0.4, { radius: 10, rust: 0.3 }); L.stroke(fr.S([[96, 110], [150, 116], [196, 92]], false), 5, { albedo: '#d8dce0', height: 0.56, ...STEEL }); steel(L, fr.S([[120, -8], [110, -40], [80, -70], [120, -50], [150, -10]]), 0.4, { radius: 5 }); metal(L, fr.P([[90, -12], [160, -12], [160, 12], [90, 12]]), 0.42, '#3a3634'); });
  add('Naginata', 'Hampes', (L) => { const fr = sword(L, { cx: C, cy: C, u0: 70, len: 170, w: 24, taper: -0.1, curve: -0.2, single: true, tipStart: 0.75, guard: 'tsuba', gw: 40, gcol: '#2a2624', gmat: IRON, grip: 1, pommel: false }); L.tube(fr.P([[-240, 0], [66, 0]], false), 18, { albedo: '#2a1414', base: 0.3, peak: 0.46, kind: 'paint', rough: 0.3 }); for (const u of [-200, -120, 40]) L.tube(fr.P([[u, 0], [u + 8, 0]], false), 22, { albedo: '#8a6a34', base: 0.32, peak: 0.5, ...GOLD }); });
  add('Faux de guerre', 'Hampes', (L) => { const fr = F(C - 20, C + 20); shaft(L, fr, -220, 170, 20, 0.3, '#3a2a20'); for (const u of [-80, 60]) L.taper(fr.T([[u, 0], [u + 20, 40]]), [10, 8], { albedo: '#4a3020', base: 0.34, peak: 0.46, kind: 'wood', rough: 0.5 }); steel(L, fr.S([[150, -6], [180, 20], [160, 90], [110, 170], [40, 210], [100, 150], [140, 80], [150, 30]]), 0.42, { radius: 8, rust: 0.4, col: [128, 130, 136] }); L.stroke(fr.S([[180, 20], [160, 90], [110, 170], [40, 210]], false), 4, { albedo: '#d0d4d8', height: 0.56, ...STEEL }); metal(L, fr.P([[140, -14], [186, -14], [186, 14], [140, 14]]), 0.44, '#3a3634'); });
  add('Harpon', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -230, 130, 16, 0.3, '#6a5a44'); steel(L, fr.P([[126, -10], [240, 0], [126, 10]]), 0.4, { radius: 3 }); for (const [u, s] of [[170, 1], [140, 1]]) for (const d of [-1, 1]) steel(L, fr.P([[u, d * 3], [u - 26, d * 24], [u - 6, d * 6]]), 0.42, { radius: 2 }); L.stroke(fr.S([[-10, 8], [-60, 80], [-130, 110], [-190, 60], [-150, 20], [-90, 50], [-60, 110]], false), 5, { albedo: '#c8b890', height: 0.46, kind: 'cloth', rough: 0.9 }); metal(L, fr.P([[110, -12], [130, -12], [130, 12], [110, 12]]), 0.42, '#3a3634'); });
  add('Trident', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -240, 110, 18, 0.3, '#5a3a22'); prongs(L, fr, 110, 110, 40, 0.3); });
  add('Trident de chasse', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -240, 110, 18, 0.3, '#6a4a2a'); prongs(L, fr, 110, 104, 36, 0.3, { barbs: true }); L.stroke(fr.S([[40, 8], [-10, 70], [-80, 90], [-120, 50], [-80, 20]], false), 5, { albedo: '#8a7a56', height: 0.46, kind: 'cloth', rough: 0.9 }); feather(L, ...fr.p(-110, 60), 44, 12, 1.9, { albedo: '#6a5a3a', base: 0.5, peak: 0.56, seed: 2 }); });
  add('Trident électrique', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -240, 110, 18, 0.3, '#2a2a3a'); prongs(L, fr, 110, 110, 40, 0.3, { col: '#8ab8e0', tipCol: [200, 230, 255], base: '#3a4a6a', mat: BRASS }); for (const v of [-40, 0, 40]) { const pts = []; for (let k = 0; k <= 8; k += 1) pts.push([130 + k * 12, v + (k % 2 ? 10 : -10)]); L.stroke(fr.P(pts, false), 2, { albedo: '#e0f4ff', height: 0.7, kind: 'glass', rough: 0.2, emissive: 'rgba(140,210,255,0.7)' }); } glow(L, ...fr.p(180, 0), 90, 'rgba(90,170,255,0.25)'); return { lights: [[...fr.p(180, 0), 90, [0.3, 0.6, 1.0]]] }; });
  add('Trident rapide', 'Hampes', (L) => { const fr = F(); shaft(L, fr, -240, 120, 14, 0.3, '#8a8e94'); prongs(L, fr, 120, 116, 26, 0.3, { w: 7 }); for (const d of [-1, 1]) L.fill(fr.S([[60, 0], [20, d * 30], [-60, d * 44], [-10, d * 10]]), { albedo: '#2a5a8a', height: 0.46, kind: 'cloth', rough: 0.8, op: 'source-over' }); });

  /* ======== BÂTONS, SCEPTRES, BAGUETTE ======== */
  add('Bâton de combat', 'Bâtons et sceptres', (L) => { const fr = staff(L, { top: 230, knots: false, w: 24, wrapAt: [-50, 30] }); metal(L, fr.P([[210, -13], [236, -13], [236, 13], [210, 13]]), 0.38, '#5a5654', IRON, { radius: 5 }); });
  add('Bâton de chance', 'Bâtons et sceptres', (L) => { const fr = staff(L, { top: 140 }); const [x, y] = fr.p(186, 0); for (let k = 0; k < 4; k += 1) { const a = (k / 4) * TAU + 0.3; Pr.pillow(L, circle(38, x + Math.cos(a) * 38, y + Math.sin(a) * 38), { base: 0.44, lift: 0.12, radius: 20, kind: 'organic', rough: 0.5, color: (gx, gy, t) => shade([70, 150, 70], 0.55 + 0.5 * t) }); } L.dome(x, y, 12, { albedo: '#b8923e', base: 0.56, peak: 0.66, ...GOLD }); glow(L, x, y, 90, 'rgba(140,255,120,0.3)'); });
  add('Bâton de déplacement', 'Bâtons et sceptres', (L) => { const fr = staff(L, { top: 150, col: '#3a3a4a' }); const [x, y] = fr.p(186, 0); for (const s of [-1, 1]) for (let k = 0; k < 5; k += 1) feather(L, x, y, 104 - k * 10, 24, fr.a + s * (0.6 + k * 0.28), { albedo: '#e8e2d4', base: 0.46, peak: 0.54, seed: k, curve: 0.08 * s }); orb(L, x, y, 34, 0.5, '#8ac8ff', '#d8f0ff'); glow(L, x, y, 90, 'rgba(160,210,255,0.4)'); });
  add('Bâton de guérison', 'Bâtons et sceptres', (L) => { const fr = staff(L, { top: 140, col: '#5a4a30' }); const [x, y] = fr.p(190, 0); for (let k = 0; k < 6; k += 1) leaf(L, x + Math.cos(k) * 44, y + Math.sin(k) * 44, 66, 28, k * 1.05, { albedo: '#4a8a3a', base: 0.42, peak: 0.52, veins: true }); orb(L, x, y, 36, 0.5, '#60d080', '#e0ffd0'); glow(L, x, y, 100, 'rgba(120,255,150,0.4)'); });
  add('Bâton redoutable', 'Bâtons et sceptres', (L) => { const fr = staff(L, { top: 150, col: '#2a2020' }); const [x, y] = fr.p(190, 0); for (let k = 0; k < 7; k += 1) { const a = fr.a + (k - 3) * 0.42; spike(L, x + Math.cos(a) * 26, y + Math.sin(a) * 26, a, 96, 12, 0.4, [80, 80, 84]); } skull(L, x, y, 1.25, fr.a + Math.PI / 2, { base: 0.46, lift: 0.3, seed: 4, eyes: 'rgba(255,60,40,0.9)' }); });
  add('Bo Shurikens', 'Bâtons et sceptres', (L) => { const fr = staff(L, { top: 230, knots: false, col: '#2a1a14', wrapAt: [-40, 40], wrapCol: '#7a1414' }); for (const u of [236, -236]) { const [x, y] = fr.p(u, 0); star(L, x, y, 34, 4, 0.5); } });
  add('Baguette magique', 'Bâtons et sceptres', (L) => { const fr = F(); L.taper(fr.T([[-190, 0], [170, 0]]), [16, 8], { albedo: '#3a2418', base: 0.3, peak: 0.44, kind: 'wood', rough: 0.4 }); wrap(L, fr, -190, -110, 20, 0.3, '#2a1a12'); for (const u of [-100, -96]) L.tube(fr.P([[u, 0], [u + 3, 0]], false), 22, { albedo: '#b8923e', base: 0.34, peak: 0.5, ...GOLD }); const [x, y] = fr.p(178, 0); L.dome(x, y, 9, { albedo: '#fff4d0', base: 0.46, peak: 0.56, kind: 'glass', rough: 0.2, emissive: 'rgba(255,240,200,1)' }); glow(L, x, y, 70, 'rgba(255,230,160,0.55)'); for (let k = 0; k < 7; k += 1) { const a = k * 0.9; const r = 30 + (k % 3) * 18; star(L, x + Math.cos(a) * r, y + Math.sin(a) * r, 5 + (k % 2) * 3, 4, 0.6, true); } });
  add('Sceptre de canaliseur', 'Bâtons et sceptres', (L) => { const { fr, hu } = sceptre(L, { rod: '#3a3a44' }); const [x, y] = fr.p(hu + 60, 0); L.torus(x, y, 58, 58, 0, 0.3, { albedo: '#8a6a34', base: 0.42, peak: 0.56, ...GOLD }); metal(L, fr.P([[hu - 4, -10], [hu + 6, -10], [hu + 6, 10], [hu - 4, 10]]), 0.42, '#8a6a34', GOLD); Pr.crystals(L, x, y + 30, 0.8, 0.46, '#3a8ac8'); for (let k = 0; k < 6; k += 1) { const a = k * 1.05; star(L, x + Math.cos(a) * 70, y + Math.sin(a) * 70, 6, 4, 0.6, true, '#a8e0ff'); } glow(L, x, y, 110, 'rgba(100,190,255,0.4)'); });
  add('Sceptre de feu', 'Bâtons et sceptres', (L) => { return root.WeaponLab.WEAPONS.sceptreFeu.draw(L, 0.2); });
  add('Sceptre de lumière', 'Bâtons et sceptres', (L) => { const { fr, hu } = sceptre(L, { rod: '#e8e0cc', rodKind: 'bone', band: '#d8b060' }); const [x, y] = fr.p(hu + 50, 0); for (let k = 0; k < 12; k += 1) { const a = (k / 12) * TAU; spike(L, x + Math.cos(a) * 30, y + Math.sin(a) * 30, a, k % 2 ? 40 : 62, 7, 0.44, [220, 190, 110]); } orb(L, x, y, 30, 0.5, '#fff0c0', '#ffffff', 0.9); glow(L, x, y, 140, 'rgba(255,240,190,0.55)'); return { lights: [[x, y, 90, [1.6, 1.4, 1.0]]] }; });
  add('Sceptre du mage', 'Bâtons et sceptres', (L) => { const { fr, hu } = sceptre(L, { rod: '#2a1e34', band: '#8a6a34' }); const [x, y] = fr.p(hu + 50, 0); for (const d of [-1, 1]) L.taper(fr.T(bezierPts([hu, d * 12], [hu + 20, d * 50], [hu + 70, d * 50], [hu + 90, d * 10], 16)), [10, 4], { albedo: '#a8843a', base: 0.44, peak: 0.56, ...GOLD }); orb(L, x, y, 36, 0.46, '#6a3ac8', '#d0a8ff'); glow(L, x, y, 120, 'rgba(160,110,255,0.45)'); return { lights: [[x, y, 90, [0.8, 0.5, 1.5]]] }; });
  add('Sceptre du vent', 'Bâtons et sceptres', (L) => { const { fr, hu } = sceptre(L, { rod: '#8a9aa8', rodKind: 'silver', rodMetal: 0.9, band: '#c8d8e8', bandMat: STEEL }); const [x, y] = fr.p(hu + 40, 0); for (let k = 0; k < 3; k += 1) L.stroke(smoothPath(root.Helpers.spiralPts(x, y, 60 - k * 14, 6, k * 2.1, 1.1, 30), false), 6 - k, { albedo: '#d8f0ff', height: 0.6, kind: 'glass', rough: 0.2, emissive: 'rgba(190,235,255,0.8)' }); for (const s of [-1, 1]) feather(L, x, y, 70, 18, fr.a + s * 0.5, { albedo: '#e8f0f4', base: 0.44, peak: 0.5, seed: 4, curve: 0.06 * s }); orb(L, x, y, 16, 0.5, '#bfe8ff', '#ffffff'); glow(L, x, y, 110, 'rgba(180,230,255,0.4)'); });

  /* ======== BOUCLIERS ======== */
  add('Bouclier à pique', 'Boucliers', (L) => { root.WeaponLab.WEAPONS.bouclierPique.draw(L, 0.2); });
  add('Bouclier de lumière ou d’ombre', 'Boucliers', (L) => { const shape = shield(L, 'round', (x) => x < C ? [220, 190, 120] : [34, 28, 42], { rim: '#6a5a3a', rimMat: GOLD, wear: 0.3 }); L.stroke((ctx) => { ctx.beginPath(); ctx.moveTo(C, C - 190); ctx.lineTo(C, C + 190); }, 6, { albedo: '#8a6a34', height: 0.52, ...GOLD }); const r = 70; L.paint(circle(r), (x, y, px) => { const left = x < C; const d = Math.hypot(x - C, y - C) / r; px.rgb = left ? mix([255, 240, 190], [200, 160, 80], d) : mix([120, 70, 200], [30, 20, 40], d); px.h = 0.5 + 0.14 * Math.sqrt(Math.max(0, 1 - d * d)); px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.2; px.e = left ? [180, 150, 80] : [60, 30, 110]; }); glow(L, C - 40, C, 160, 'rgba(255,230,160,0.35)'); glow(L, C + 40, C, 160, 'rgba(120,70,220,0.35)'); });
  add('Bouclier désarmant', 'Boucliers', (L) => { shield(L, 'heater', () => [60, 64, 70], { kind: 'iron', metal: 0.8 }); for (const s of [-1, 1]) { const x0 = C + s * 150; for (let k = 0; k < 4; k += 1) { const y = C - 150 + k * 40; steel(L, poly([[x0, y], [x0 + s * 50, y + 6], [x0 + s * 44, y + 20], [x0, y + 22]]), 0.44, { radius: 4 }); } } for (const [u, v] of [[-60, -80], [60, -80], [0, 20]]) { steel(L, poly([[C + u - 20, C + v], [C + u, C + v - 30], [C + u + 20, C + v], [C + u, C + v + 30]]), 0.5, { radius: 6 }); } });
  add('Bouclier rédempteur', 'Boucliers', (L) => { shield(L, 'heater', () => [226, 218, 196], { rim: '#b8923e', rimMat: GOLD, wear: 0.4 }); metal(L, poly([[C - 16, C - 150], [C + 16, C - 150], [C + 16, C - 40], [C + 100, C - 40], [C + 100, C - 8], [C + 16, C - 8], [C + 16, C + 140], [C - 16, C + 140], [C - 16, C - 8], [C - 100, C - 8], [C - 100, C - 40], [C - 16, C - 40]]), 0.5, '#b8923e', GOLD, { radius: 8 }); L.stroke(circle(56, C, C - 24), 6, { albedo: '#f0d890', height: 0.62, kind: 'glass', rough: 0.2, emissive: 'rgba(255,230,150,0.8)' }); glow(L, C, C - 24, 130, 'rgba(255,230,160,0.4)'); });
  add('Scutum', 'Boucliers', (L) => { const f = fields(); shield(L, 'scutum', (x, y) => { const eagle = Math.abs(x - C) < 60 && Math.abs(y - C - 120) < 40 ? 0 : 1; return [120, 24, 20]; }, { rim: '#8a6a34', rimMat: BRASS }); for (const [x0, y0, x1, y1] of [[C - 100, C - 130, C + 100, C - 130], [C - 100, C + 130, C + 100, C + 130], [C, C - 190, C, C - 60], [C, C + 60, C, C + 190]]) L.stroke(poly([[x0, y0], [x1, y1]], false), 8, { albedo: '#b8923e', height: 0.52, ...GOLD }); metal(L, circle(56), 0.5, '#8a6a34', BRASS, { radius: 30, lift: 0.2 }); for (const s of [-1, 1]) for (let k = 0; k < 3; k += 1) L.stroke((ctx) => { ctx.beginPath(); ctx.moveTo(C + s * 70, C - 30 + k * 30); ctx.lineTo(C + s * 110, C - 50 + k * 30); }, 6, { albedo: '#b8923e', height: 0.52, ...GOLD }); });

  /* ======== LANCER ======== */
  function star(L, x, y, r, n, z, emissive = false, col = '#a8acb2') {
    const pts = []; for (let k = 0; k < n * 2; k += 1) { const a = (k / (n * 2)) * TAU - Math.PI / 2 + 0.3; const rr = k % 2 ? r * 0.3 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    if (emissive) L.fill(poly(pts), { albedo: col, height: z, kind: 'glass', rough: 0.2, emissive: 'rgba(255,245,210,0.9)', op: 'source-over' });
    else { steel(L, poly(pts), z, { radius: 4 }); L.dome(x, y, r * 0.16, { albedo: '#2a2624', base: z + 0.02, peak: z + 0.06, ...IRON }); }
  }
  add('Shurikens', 'Lancer', (L) => { star(L, C - 60, C + 50, 110, 4, 0.3); star(L, C + 90, C - 80, 70, 6, 0.4); star(L, C + 120, C + 110, 50, 4, 0.44); });
  add('Bolas', 'Lancer', (L) => { const c0 = [C, C - 10]; const balls = [[C - 140, C + 110], [C + 150, C + 80], [C + 10, C - 170]]; for (const [x, y] of balls) L.stroke(smoothPath([c0, [(c0[0] + x) / 2 + 20, (c0[1] + y) / 2 - 20], [x, y]], false), 5, { albedo: '#8a7a56', height: 0.36, kind: 'cloth', rough: 0.9 }); L.dome(...c0, 14, { albedo: '#6a5a3a', base: 0.4, peak: 0.5, kind: 'cloth', rough: 0.9 }); for (const [x, y] of balls) { metal(L, circle(46, x, y), 0.36, '#5a5654', IRON, { radius: 26, lift: 0.22 }); } });
  add('Bolas du chasseur', 'Lancer', (L) => { const f = fields(); const c0 = [C, C - 10]; const balls = [[C - 140, C + 110], [C + 150, C + 80], [C + 10, C - 170]]; for (const [x, y] of balls) L.stroke(smoothPath([c0, [(c0[0] + x) / 2 + 20, (c0[1] + y) / 2 - 20], [x, y]], false), 5, { albedo: '#5a4a30', height: 0.36, kind: 'cloth', rough: 0.9 }); for (const [x, y] of balls) Pr.pillow(L, circle(48, x, y), { base: 0.36, lift: 0.22, radius: 28, kind: 'leather', rough: 0.6, color: (gx, gy, t) => shade([104, 70, 42], (0.5 + 0.55 * t) * (0.8 + 0.3 * sample(f.mid, gx * 3, gy * 3))) }); for (const [x, y] of balls) L.stroke((ctx) => { ctx.beginPath(); ctx.arc(x, y, 34, 0.4, 2.6); }, 2, { albedo: '#d8ccb0', height: 0.6, kind: 'cloth', rough: 0.8, dash: [4, 4] }); Pr.pillow(L, circle(30, ...c0), { base: 0.4, lift: 0.1, radius: 20, kind: 'cloth', rough: 0.95, color: (gx, gy, t) => shade([150, 120, 86], (0.5 + 0.5 * t) * (0.7 + 0.4 * sample(f.high, gx * 3, gy * 3))) }); feather(L, c0[0], c0[1], 60, 16, 2.4, { albedo: '#6a4a2a', base: 0.5, peak: 0.56, seed: 5 }); });
  add('Boomerang', 'Lancer', (L) => { wood(L, smoothPath([[C - 190, C + 90], [C - 60, C - 60], [C + 20, C - 150], [C + 70, C - 120], [C, C - 40], [C + 190, C + 60], [C + 170, C + 110], [C - 30, C + 30], [C - 160, C + 140]], true), 0.3, [150, 100, 56], { radius: 20 }); for (const [x, y] of [[C - 120, C + 60], [C + 110, C + 60], [C + 30, C - 110]]) L.stroke(circle(10, x, y), 3, { albedo: '#e0d0a8', height: 0.48, kind: 'paint', rough: 0.6 }); });
  add('Boomerang à lame', 'Lancer', (L) => { wood(L, smoothPath([[C - 170, C + 80], [C - 60, C - 50], [C + 10, C - 130], [C + 60, C - 110], [C, C - 30], [C + 170, C + 60], [C + 150, C + 104], [C - 30, C + 30], [C - 140, C + 124]], true), 0.3, [70, 48, 34], { radius: 18 }); steel(L, smoothPath([[C - 150, C + 70], [C - 50, C - 56], [C + 10, C - 142], [C - 30, C - 170], [C - 110, C - 20], [C - 196, C + 90]], true), 0.36, { radius: 8 }); steel(L, smoothPath([[C + 20, C - 24], [C + 180, C + 52], [C + 214, C + 30], [C + 60, C - 50]], true), 0.36, { radius: 8 }); });
  add('Lance-pierre', 'Lancer', (L) => { const fr = F(C, C + 40, -Math.PI / 2); wood(L, smoothPath(fr.T([[-200, -16], [-40, -18], [30, -100], [150, -110], [150, -80], [40, -60], [0, 0], [40, 60], [150, 80], [150, 110], [30, 100], [-40, 18], [-200, 16]]), true), 0.3, [110, 72, 40], { radius: 12 }); wrap(L, fr, -200, -80, 36, 0.3); for (const s of [-1, 1]) L.stroke(smoothPath(fr.T([[150, s * 96], [60, s * 40], [20, s * 10]]), false), 5, { albedo: '#6a3a24', height: 0.52, kind: 'leather', rough: 0.6 }); cloth(L, Pr.roundRectAt(...fr.p(16, 0), 34, 40, fr.a, 8), 0.54, '#4a2e1c'); L.dome(...fr.p(16, 0), 14, { albedo: '#8a8478', base: 0.6, peak: 0.7, kind: 'stone', rough: 0.8 }); });
  add('Gant-Fronde', 'Lancer', (L) => { const fr = gauntlet(L, { col: '#6a4428', mat: { kind: 'leather', metal: 0, rough: 0.6 } }); L.stroke(smoothPath(fr.T([[130, -80], [200, -150], [250, -60], [230, 10], [160, 20]]), false), 6, { albedo: '#c8b890', height: 0.62, kind: 'cloth', rough: 0.9 }); cloth(L, circle(34, ...fr.p(236, -80)), 0.6, '#3a2418'); L.dome(...fr.p(236, -80), 20, { albedo: '#8a8478', base: 0.66, peak: 0.76, kind: 'stone', rough: 0.8 }); });
  add('Lasso', 'Lancer', (L) => { for (let k = 0; k < 4; k += 1) L.stroke((ctx) => { ctx.beginPath(); ctx.ellipse(C - 20 + k * 6, C + 20 - k * 4, 150 - k * 12, 120 - k * 10, -0.4, 0, TAU); }, 12, { albedo: '#b09a6a', height: 0.36 + k * 0.03, kind: 'cloth', rough: 0.9 }); L.stroke(smoothPath([[C + 100, C - 60], [C + 170, C - 150], [C + 210, C - 190]], false), 12, { albedo: '#b09a6a', height: 0.5, kind: 'cloth', rough: 0.9 }); L.torus(C + 150, C - 120, 26, 18, 0.6, 0.4, { albedo: '#8a7a56', base: 0.52, peak: 0.62, kind: 'cloth', rough: 0.9 }); });
  add('Fouet', 'Lancer', (L) => { const fr = F(C - 120, C + 150, -Math.PI / 4); wrap(L, fr, -60, 70, 30, 0.34); metal(L, circle(18, ...fr.p(-66, 0)), 0.4, '#8a6a34', BRASS); const pts = bezierPts(fr.p(70, 0), fr.p(260, -40), [C + 230, C - 40], [C + 60, C - 60], 30).concat(bezierPts([C + 60, C - 60], [C - 90, C - 80], [C - 120, C - 200], [C + 80, C - 200], 30)); L.taper(pts, (t) => 18 * (1 - 0.85 * t), { albedo: '#3a2418', base: 0.34, peak: 0.46, kind: 'leather', rough: 0.6 }); });

  /* ======== MAINS NUES ======== */
  add('Bague cloutée', 'Mains', (L) => { const f = fields(); metal(L, Pr.roundRectAt(C, C + 70, 330, 70, 0, 30), 0.3, '#8a8e94', STEEL, { radius: 26, lift: 0.18 }); for (let k = 0; k < 4; k += 1) { const x = C - 120 + k * 80; L.torus(x, C - 20, 44, 44, 0, 0.36, { albedo: '#8a8e94', base: 0.34, peak: 0.52, ...STEEL }); for (let j = 0; j < 3; j += 1) spike(L, x - 20 + j * 20, C - 60, -Math.PI / 2, 36, 8, 0.52); } });
  add('Poing de métal', 'Mains', (L) => { const fr = gauntlet(L, {}); for (let k = 0; k < 4; k += 1) { metal(L, Pr.roundRectAt(...fr.p(60, -72 + k * 48), 40, 40, fr.a, 8), 0.5, '#5a5e64', IRON, { radius: 8 }); rivet(L, ...fr.p(60, -72 + k * 48), 6, { base: 0.62, peak: 0.72 }); } for (const u of [-200, -150]) L.stroke(fr.P([[u, -96], [u, 100]], false), 8, { albedo: '#5a5e64', height: 0.5, ...IRON }); });
  add('Gant en mousse', 'Mains', (L) => { const f = fields(); const moss = (gx, gy, t) => { const n = sample(f.high, gx * 3, gy * 3), m = sample(f.mid, gx * 2, gy * 2); return shade(mix([60, 110, 40], [110, 140, 60], n), (0.5 + 0.55 * t) * (0.8 + 0.35 * m)); }; const fr = gauntlet(L, { mat: { kind: 'organic', metal: 0, rough: 0.95 }, cuffColor: (gx, gy, t) => shade([90, 64, 40], 0.55 + 0.5 * t), fistColor: moss }); for (let k = 0; k < 5; k += 1) { const [x, y] = fr.p(-20 + k * 30, -70 + k * 30); leaf(L, x, y, 26, 11, k, { albedo: '#5a8a3a', base: 0.6, peak: 0.66 }); } });
  add('Griffe de sang', 'Mains', (L) => { const fr = claws(L, { curl: 8, bar: '#3a1a1a', blade: '#b8a0a0' }); for (const v of [-60, -20, 20, 60]) { const [x, y] = fr.p(150, v + 12); L.dome(x, y, 7, { albedo: '#8a0a0a', base: 0.62, peak: 0.7, kind: 'glass', rough: 0.1 }); L.taper([[x, y], [x + 4, y + 26]], [6, 2], { albedo: '#7a0808', base: 0.6, peak: 0.66, kind: 'glass', rough: 0.1 }); } });
  add('Griffe du tigre', 'Mains', (L) => { const f = fields(); const fr = claws(L, { curl: 14, bar: '#8a6a34' }); for (const v of [-80, 80]) L.torus(...fr.p(-80, v * 0.9), 20, 14, fr.a, 0.3, { albedo: '#8a6a34', base: 0.4, peak: 0.5, ...GOLD }); for (let k = 0; k < 5; k += 1) L.stroke(fr.S([[-120 + k * 24, -80], [-110 + k * 24, -30], [-124 + k * 24, 10]], false), 6, { albedo: '#1a1410', height: 0.46, kind: 'paint', rough: 0.5 }); });
  add('Griffe maudite', 'Mains', (L) => { const fr = claws(L, { curl: 20, bar: '#1a1420', blade: '#4a3a5a' }); for (const v of [-60, -20, 20, 60]) L.stroke(fr.S([[40, v], [120, v - 4], [190, v + 30]], false), 2.4, { albedo: '#c8a0ff', height: 0.64, kind: 'glass', rough: 0.2, emissive: 'rgba(170,110,255,0.9)' }); glow(L, ...fr.p(100, 0), 170, 'rgba(140,70,220,0.45)'); return { lights: [[...fr.p(100, 0), 80, [0.9, 0.5, 1.5]]] }; });

  const ORDER = Object.keys(W);
  function renderWeapon(name) {
    const L = createLayers(); const spec = W[name].draw(L) || {};
    const lights = [{ dir: [-0.45, -0.62, 0.64], color: [1.55, 1.42, 1.18] }, { dir: [0.7, 0.45, 0.5], color: [0.16, 0.18, 0.28], shadow: false }];
    for (const [x, y, zz, col] of spec.lights || []) lights.push({ pos: [x, y, zz], radius: 200, color: col });
    return render(L, { seed: name.length, lights, room: [0.26, 0.23, 0.19], inside: () => false, sheen: 0.4, lichen: 0, wear: 0.3, dropShadow: 0.6 });
  }
  root.Armory = { W, ORDER, render: renderWeapon, kit: { F, steel, metal, wood, cloth, glow, orb, spike, wrap, shaft, star, IRON, STEEL, BRASS, GOLD, mix, shade } };
}(window));
