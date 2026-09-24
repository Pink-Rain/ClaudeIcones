// Labo Eraser — nouvelles idées pour 6 (hiver), 11 (serpents) et 19 (sorcière gothique).
(function (root) {
  'use strict';
  const { C, TAU, rng, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample, resample } = root.Relief;
  const { ringText, beads, rope, P, circle, ringPath, arcPath, sectorPath, polar, polarPts, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, rivet, gem, leaf, chain, sigilPath } = root.Helpers;
  const { innerLip, cutOpening } = root.FrameKit;
  const frames = root.EpicLab.frames;
  const replace = (oldId, id, name, build) => { const i = frames.findIndex((f) => f.id === oldId); frames.splice(i, 1, { id, name, build }); };

  /* ------------------------------------------------------------------ */
  /* 6 — Couronne de l'Hiver : argent givré gravé de fougères de givre, flocons de filigrane, aigues-marines. */
  function snowflake(L, x, y, R, rot, o = {}) {
    const silver = { kind: 'silver', metal: 0.95, rough: 0.24 };
    const b = o.base ?? 0.5;
    for (let k = 0; k < 6; k += 1) {
      const a = rot + (k * TAU) / 6;
      const at = (t, off = 0, ang = a) => [x + Math.cos(ang) * R * t + Math.cos(ang + Math.PI / 2) * off, y + Math.sin(ang) * R * t + Math.sin(ang + Math.PI / 2) * off];
      L.taper([at(0.12), at(1)], [R * 0.13, R * 0.05], { albedo: '#d6dde2', base: b, peak: b + 0.26, ...silver });
      for (const [t, len] of [[0.38, 0.34], [0.62, 0.26], [0.82, 0.16]]) for (const d of [-1, 1]) {
        const bx = x + Math.cos(a) * R * t, by = y + Math.sin(a) * R * t; const ba = a + d * Math.PI / 3;
        L.taper([[bx, by], [bx + Math.cos(ba) * R * len, by + Math.sin(ba) * R * len]], [R * 0.08, R * 0.03], { albedo: '#d6dde2', base: b, peak: b + 0.22, ...silver });
      }
      const [tx, ty] = at(1.04);
      L.fill(poly([[tx + Math.cos(a) * R * 0.08, ty + Math.sin(a) * R * 0.08], [tx + Math.cos(a + Math.PI / 2) * R * 0.05, ty + Math.sin(a + Math.PI / 2) * R * 0.05], [tx - Math.cos(a) * R * 0.06, ty - Math.sin(a) * R * 0.06], [tx - Math.cos(a + Math.PI / 2) * R * 0.05, ty - Math.sin(a + Math.PI / 2) * R * 0.05]]), { albedo: '#e6ecef', height: b + 0.2, normal: [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 1], ...silver, op: 'lighten' });
    }
    L.fill(poly(Array.from({ length: 6 }, (_, k) => [x + Math.cos(rot + k * TAU / 6 + Math.PI / 6) * R * 0.3, y + Math.sin(rot + k * TAU / 6 + Math.PI / 6) * R * 0.3])), { albedo: '#c9d2d8', height: domeStyle(x, y, R * 0.3, b + 0.1, b + 0.24), ...silver, op: 'lighten' });
    gem(L, x, y, R * 0.18, { color: '#6fb3c9', facets: 6, setting: R * 0.04, setKind: 'silver', setAlbedo: '#c9d2d8', base: b + 0.2, lift: 0.18, glow: 'rgba(140,210,240,0.35)', rot: rot + Math.PI / 6 });
  }

  replace('frost', 'winter', 'Couronne de l’Hiver', (L) => {
    const silver = { kind: 'silver', metal: 0.95, rough: 0.3 };
    const f = getFields(); const r = rng(612);
    L.fill(ringPath(164, 234), { albedo: '#3f5669', height: ringStyle(C, C, 164, 234, 0.28, 0.44, 'round'), ...silver });
    L.fill(ringPath(230, 240), { albedo: '#b9c4cc', height: ringStyle(C, C, 230, 240, 0.3, 0.52, 'round'), ...silver });
    // Fougères de givre gravées : tiges qui se ramifient dans le métal.
    const fern = (x, y, ang, len, depth) => {
      if (len < 3 || depth > 4) return;
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      L.engrave(poly([[x, y], [x2, y2]], false), Math.max(0.6, 1.6 - depth * 0.3), 0.2, { albedo: 'rgba(225,238,248,0.85)' });
      const n = 3;
      for (let k = 1; k <= n; k += 1) { const t = k / (n + 1); const bx = x + (x2 - x) * t, by = y + (y2 - y) * t; for (const d of [-1, 1]) fern(bx, by, ang + d * (0.55 + r() * 0.25), len * (0.5 - t * 0.18), depth + 1); }
    };
    for (let k = 0; k < 30; k += 1) { const a = (k / 30) * TAU + r() * 0.08; const [x, y] = P(168 + r() * 6, a); fern(x, y, a + (r() - 0.5) * 0.7, 30 + r() * 20, 0); }
    // Voile de givre mat, surtout sur le haut.
    L.paint(ringPath(164, 240), (x, y, px) => { const n = sample(f.mid, x * 1.6, y * 1.6); const fr = smooth(0.7, 0.9, n + (1 - y / 512) * 0.1) * 0.2; if (fr < 0.03) { px.skip = true; return; } px.rgb = [228, 238, 245]; px.alpha = fr; px.rough = 0.7; });
    // Perles de glace entre les flocons.
    for (let k = 0; k < 36; k += 1) { const a = (k / 36) * TAU; if (k % 6 === 0) continue; const [x, y] = P(235, a); gem(L, x, y, 3.2, { color: '#a9d4e4', cut: 'cabochon', setting: 0, base: 0.52, lift: 0.14 }); }
    // Six flocons autour, un grand en couronne.
    for (let k = 1; k < 6; k += 1) { const a = -Math.PI / 2 + (k * TAU) / 6; const [x, y] = P(222, a); snowflake(L, x, y, 36, a, { base: 0.5 }); }
    snowflake(L, C, 36, 52, -Math.PI / 2, { base: 0.54 });
    innerLip(L, 158, silver, '#c3ccd3', 7);
    return {
      opening: 160,
      options: { seed: 61, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.35, 1.5, 1.7] }, { dir: [0.7, 0.45, 0.5], color: [0.12, 0.2, 0.34], shadow: false }], room: [0.28, 0.33, 0.38], tint: [0.95, 1.0, 1.07], saturation: 0.8 },
      portrait: { tint: 'rgba(70,120,170,0.1)', filter: 'saturate(0.8) contrast(1.05)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 180, C, C, 262); g.addColorStop(0, 'rgba(150,200,240,0.3)'); g.addColorStop(1, 'rgba(60,110,160,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
      front(ctx) { const r2 = rng(616); for (let i = 0; i < 46; i += 1) { const [x, y] = P(180 + r2() * 80, r2() * TAU); ctx.fillStyle = `rgba(240,248,255,${0.25 + r2() * 0.6})`; ctx.beginPath(); ctx.arc(x, y, 0.6 + r2() * 1.6, 0, TAU); ctx.fill(); } },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 11 — Chevelure de la Gorgone : diadème de bronze à méandres, serpents de bronze qui se tordent. */
  function snakeHead(L, x, y, ang, s, o) {
    const T = (pts) => localPts(x, y, ang, s, pts);
    const mat = { kind: 'bronze', metal: 0.9, rough: 0.42 };
    const head = T([[-4, -6], [6, -7.5], [15, -6], [22, -3], [25, 0], [22, 3], [15, 6], [6, 7.5], [-4, 6], [-7, 0]]);
    L.fill(smoothPath(head, true), { albedo: o.albedo, height: domeStyle(...T([[9, 0]])[0], 16 * s, o.base, o.base + 0.26), ...mat, op: 'source-over' });
    L.engraveFill(smoothPath(T([[25, 0], [16, -1.8], [14, 0], [16, 1.8]]), true), 0.5, { albedo: '#140a06' });
    for (const d of [-1, 1]) {
      L.fill(circle(1.3 * s, ...T([[12, d * 3.6]])[0]), { albedo: '#b07a1a', height: o.base + 0.3, kind: 'glass', rough: 0.08, op: 'lighten' });
      L.taper(T([[17, d * 1.2], [20, d * 2.4]]), [1.4 * s, 0.3], { albedo: '#efe4c4', base: o.base + 0.2, peak: o.base + 0.3, kind: 'bone', rough: 0.3 });
    }
    L.taper(T([[24, 0], [30, 0], [33, -2.5]]), [1.2 * s, 0.4], { albedo: '#b8923e', base: o.base + 0.1, peak: o.base + 0.2, kind: 'gold', metal: 0.9, rough: 0.4 });
    L.taper(T([[30, 0], [33, 2.5]]), [1.1 * s, 0.4], { albedo: '#b8923e', base: o.base + 0.1, peak: o.base + 0.2, kind: 'gold', metal: 0.9, rough: 0.4 });
    L.engrave(smoothPath(T([[4, -5], [12, -6.5], [20, -3.5]])), 0.8, 0.25);
  }
  function snake(L, pts, w0, w1, s, o) {
    const width = (t) => lerp(w0, w1, t);
    const tp = L.taper(pts, width, { albedo: o.albedo, base: o.base, peak: o.base + 0.3, kind: 'bronze', metal: 0.9, rough: 0.45, over: true, gap: 3, gapAlbedo: '#1c140c', gapHeight: o.base - 0.06 });
    const rs = rng(Math.round(pts[0][0] * 13)); for (let k = 4; k < tp.length - 6; k += 2) { const p = tp[k]; const w = width(p.t) / 2; for (let q = 0; q < 2; q += 1) { const off = (rs() - 0.5) * w * 1.4; const x = p.x + Math.cos(p.a + Math.PI / 2) * off, y = p.y + Math.sin(p.a + Math.PI / 2) * off; L.engrave((ctx) => { ctx.beginPath(); ctx.arc(x, y, 2.4, p.a + Math.PI * 0.6, p.a + Math.PI * 1.4); }, 0.6, 0.12); } }
    const end = tp[tp.length - 1];
    snakeHead(L, end.x - Math.cos(end.a) * 6, end.y - Math.sin(end.a) * 6, end.a, s * 1.25, { albedo: o.albedo, base: o.base + 0.04 });
  }
  replace('naga', 'gorgon', 'Chevelure de la Gorgone', (L) => {
    const bronze = { kind: 'bronze', metal: 0.9, rough: 0.48 };
    const r = rng(1111);
    // Serpents qui jaillissent du diadème et se tordent vers l'extérieur.
    const hair = [];
    for (let k = 0; k < 11; k += 1) {
      const a = -Math.PI / 2 + (k - 5) * 0.27 + (r() - 0.5) * 0.05; if (k === 5) continue;
      const top = 1 - Math.abs(k - 5) / 6;
      const len = 40 + top * 26 + r() * 8; const bend = (r() > 0.5 ? 1 : -1) * (0.25 + r() * 0.2);
      const p0 = P(200, a), p1 = P(200 + len * 0.35, a + bend), p2 = P(200 + len * 0.7, a - bend * 0.8), p3 = P(200 + len, a + bend * 0.6);
      hair.push({ pts: bezierPts(p0, p1, p2, p3, 30), w0: 21, w1: 13, s: 1.25 + top * 0.35, depth: r() });
    }
    for (const a of [0.15, 0.55, Math.PI - 0.15, Math.PI - 0.55]) { const bend = a < 1 ? -0.3 : 0.3; hair.push({ pts: bezierPts(P(202, a), P(220, a + bend), P(232, a - bend), P(244, a + bend * 0.2), 24), w0: 17, w1: 11, s: 1.05, depth: r() }); }
    hair.sort((p, q) => p.depth - q.depth).forEach((h, k) => snake(L, h.pts, h.w0, h.w1, h.s, { albedo: ['#57502e', '#4c4428', '#605634'][k % 3], base: 0.42 + k * 0.006 }));
    // Diadème à méandres grecs.
    L.fill(ringPath(164, 206), { albedo: '#6a4e2e', height: ringStyle(C, C, 164, 206, 0.34, 0.54, 'bevel'), ...bronze, op: 'source-over' });
    const meander = [];
    const n = 36;
    for (let k = 0; k < n; k += 1) { const a0 = (k / n) * TAU, w = TAU / n; const at = (u, v) => P(176 + v * 18, a0 + u * w); meander.push(at(0, 0), at(0, 1), at(0.75, 1), at(0.75, 0.3), at(0.4, 0.3), at(0.4, 0.62)); meander.push(at(0.4, 0.62), at(0.4, 0.3), at(0.75, 0.3), at(0.75, 1), at(1, 1), at(1, 0)); }
    L.engrave(poly(meander, false), 1.8, 0.35);
    L.engrave(circle(172), 1.2, 0.3); L.engrave(circle(198), 1.2, 0.3);
    // Deux serpents s'enroulent en bas et se font face autour d'une gemme.
    for (const m of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 40; i += 1) { const t = i / 40; const a = Math.PI / 2 + m * (1.1 - t * 0.95); pts.push(P(214 + 9 * Math.sin(t * Math.PI * 3), a)); }
      snake(L, pts, 20, 13, 1.35, { albedo: '#57502e', base: 0.56 });
    }
    gem(L, C, C + 214, 10, { color: '#1f6a4a', setting: 3, setKind: 'bronze', setAlbedo: '#8a6a3e', base: 0.64, lift: 0.3, prongs: 4 });
    innerLip(L, 158, bronze, '#8a6a3e', 7);
    cutOpening(L, 158);
    return {
      opening: 160,
      options: { seed: 111, wear: 1.8, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.6, 1.46, 1.2] }, { dir: [0.7, 0.45, 0.5], color: [0.14, 0.22, 0.2], shadow: false }], room: [0.26, 0.24, 0.2], saturation: 0.8 },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 19 — Sabbat : fer noir gothique, flèches à crochets, arcature, lune et crâne de corbeau, roses noires, cierges. */
  function blackRose(L, x, y, R, rot) {
    const petal = { kind: 'cloth', metal: 0, rough: 0.95 };
    for (let layer = 0; layer < 4; layer += 1) {
      const n = 5, rr = R * (1 - layer * 0.22), off = rot + layer * 0.6;
      for (let k = 0; k < n; k += 1) { const a = off + (k / n) * TAU; const px = x + Math.cos(a) * rr * 0.45, py = y + Math.sin(a) * rr * 0.45; L.ellipse(px, py, rr * 0.55, rr * 0.38, a, { albedo: layer === 0 ? '#3a0a12' : layer === 1 ? '#4c0c16' : '#5e101c', base: 0.62 + layer * 0.03, peak: 0.68 + layer * 0.03, ...petal }); }
    }
    L.taper(spiralPts(x, y, R * 0.28, 1, rot, 1.4, 20), [2, 1], { albedo: '#1c0508', base: 0.86, peak: 0.94, ...petal });
  }
  replace('oni', 'witch', 'Sabbat', (L) => {
    const iron = { kind: 'silver', metal: 0.9, rough: 0.34 };
    const bone = { kind: 'bone', metal: 0, rough: 0.55 };
    const r = rng(1919);
    const IRON = '#3c3842';
    // Flèches gothiques à crochets, plus hautes vers le haut.
    for (let k = 0; k < 28; k += 1) {
      const a = (k / 28) * TAU + Math.PI / 28;
      const up = Math.max(0, -Math.sin(a));
      const len = 18 + 30 * up * up + (k % 2 ? 0 : 8 * up);
      const base = P(226, a), tip = P(226 + len, a);
      L.taper([base, tip], [13, 1.4], { albedo: IRON, base: 0.4, peak: 0.72, ...iron });
      for (const t of [0.35, 0.65]) for (const d of [-1, 1]) { const [bx, by] = P(226 + len * t, a); const ca = a + d * 1.2; L.taper([[bx, by], [bx + Math.cos(ca) * 6 + Math.cos(a) * 3, by + Math.sin(ca) * 6 + Math.sin(a) * 3]], [2.6, 0.6], { albedo: IRON, base: 0.44, peak: 0.6, ...iron }); }
      if (len > 40) L.dome(...P(226 + len * 0.8, a), 3, { albedo: IRON, base: 0.5, peak: 0.68, ...iron });
    }
    // Anneau de fer noir, arcature de petites ogives et sceaux verdâtres.
    L.fill(ringPath(164, 232), { albedo: IRON, height: ringStyle(C, C, 164, 232, 0.32, 0.5, 'bevel'), ...iron, op: 'source-over' });
    const n = 22;
    for (let k = 0; k < n; k += 1) {
      const a0 = (k / n) * TAU + 0.02, a1 = ((k + 1) / n) * TAU - 0.02, mid = (a0 + a1) / 2;
      const arch = (ctx) => { ctx.beginPath(); ctx.moveTo(...P(178, a0)); ctx.lineTo(...P(206, a0)); ctx.quadraticCurveTo(...P(222, a0 + 0.01), ...P(226, mid)); ctx.quadraticCurveTo(...P(222, a1 - 0.01), ...P(206, a1)); ctx.lineTo(...P(178, a1)); };
      L.stroke(arch, 3, { albedo: '#3a3440', height: 0.58, ...iron });
      L.engraveFill((ctx) => { ctx.beginPath(); ctx.arc(...P(212, mid), 4, 0, TAU); }, 0.3);
      const [sx, sy] = P(193, mid);
      const sg = sigilPath(sx, sy, 16, r);
      L.engrave(sg.lines, 1.1, 0.4, { emissive: 'rgba(120,230,110,0.55)', emissiveWidth: 1 });
    }
    L.engrave(circle(176), 1.4, 0.35);
    // Lune et crâne de corbeau au sommet.
    const mx = C, my = 50;
    L.fill(circle(50, mx, my), { albedo: '#c9c6bd', height: domeStyle(mx, my, 50, 0.56, 0.86), kind: 'silver', metal: 0.9, rough: 0.35, clip: (ctx) => { ctx.beginPath(); ctx.rect(0, 0, 512, 512); ctx.arc(mx, my - 18, 45, 0, TAU, true); }, clipRule: 'evenodd' });
    const sk = (pts) => localPts(mx - 10, my + 12, 0, 1.35, pts);
    L.fill(smoothPath(sk([[-16, -6], [-10, -16], [2, -18], [12, -12], [16, -2], [12, 8], [0, 12], [-12, 8]]), true), { albedo: '#d9ccab', height: domeStyle(mx - 10, my + 7, 30, 0.66, 0.96), ...bone, op: 'source-over' });
    L.taper(sk([[12, -4], [30, 0], [44, 6]]), [11, 1], { albedo: '#cfc2a0', base: 0.72, peak: 0.92, ...bone });
    L.engrave(poly(sk([[16, 1], [42, 5]]), false), 0.9, 0.35);
    L.engraveFill(circle(6, ...sk([[2, -4]])[0]), 0.7, { albedo: '#0c0a08', emissive: 'rgba(110,240,120,0.9)' });
    L.engraveFill(circle(2.5, ...sk([[-8, 4]])[0]), 0.5, { albedo: '#0c0a08' });
    // Roses noires qui grimpent sur le flanc gauche.
    const stem = []; for (let i = 0; i <= 50; i += 1) { const t = i / 50; stem.push(P(236 + 8 * Math.sin(t * 9), Math.PI * 0.62 + t * 0.95)); }
    L.taper(stem, [5, 3], { albedo: '#1c2414', base: 0.6, peak: 0.76, kind: 'organic', rough: 0.6 });
    for (let k = 3; k < 50; k += 6) { const [x, y] = stem[k]; L.taper([[x, y], [x + (r() - 0.5) * 12, y - 6]], [2.6, 0.4], { albedo: '#1c2414', base: 0.66, peak: 0.8, kind: 'organic', rough: 0.6 }); if (k % 12 === 3) leaf(L, x, y, 16, 8, r() * TAU, { albedo: '#223018', base: 0.66, peak: 0.8, op: 'source-over' }); }
    for (const [t, R] of [[0.15, 24], [0.55, 20], [0.9, 16]]) { const [x, y] = stem[Math.round(t * 50)]; blackRose(L, x, y, R, t * 3); }
    // Cierges noirs qui coulent, flammes vertes.
    for (const [a, h] of [[0.42, 52], [0.62, 36], [0.26, 28]]) {
      const [x, y] = P(236, a);
      L.fill((ctx) => { ctx.beginPath(); ctx.roundRect(x - 9, y - h, 18, h, 3); }, { albedo: '#18161a', height: linearStyle(x - 7, 0, x + 7, 0, [[0, 0.62], [0.45, 0.76], [1, 0.62]]), kind: 'wax', rough: 0.35, op: 'source-over' });
      for (let q = 0; q < 3; q += 1) { const dx = -5 + r() * 10; L.taper([[x + dx, y - h], [x + dx, y - h + 8 + r() * h * 0.5]], (t) => 3 - t + 1.4 * smooth(0.8, 1, t), { albedo: '#26222a', base: 0.74, peak: 0.84, kind: 'wax', rough: 0.3 }); }
      L.ellipse(x, y - h - 10, 3.2, 8, 0, { albedo: '#b8ffb0', flat: 0.9, kind: 'glass', rough: 0.2, emissive: 'rgba(120,255,110,1)' });
      L.glow((e) => { const g = e.createRadialGradient(x, y - h - 10, 0, x, y - h - 10, 34); g.addColorStop(0, 'rgba(110,240,100,0.3)'); g.addColorStop(1, 'rgba(40,160,40,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y - h - 10, 34, 0, TAU); e.fill(); });
    }
    // Pendule d'améthyste en bas.
    chain(L, [[C, C + 226], [C, C + 244]], 8, { albedo: '#4a4450' });
    gem(L, C, C + 246, 8, { color: '#5a2a8a', facets: 6, setting: 2, setKind: 'silver', setAlbedo: '#6a6470', base: 0.62, lift: 0.3, glow: 'rgba(170,90,255,0.4)', rot: Math.PI / 6 });
    innerLip(L, 158, iron, '#3a3440', 7);
    cutOpening(L, 158);
    return {
      opening: 160,
      options: { seed: 191, bloom: 0.6, sheen: 0.25, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.35, 1.25, 1.4] }, { pos: [C + 180, C + 90, 90], radius: 150, color: [0.2, 0.55, 0.2] }, { dir: [0.7, 0.45, 0.5], color: [0.2, 0.12, 0.28], shadow: false }], room: [0.2, 0.18, 0.22], saturation: 0.85 },
      portrait: { tint: 'rgba(40,20,60,0.12)', filter: 'saturate(0.8) contrast(1.08)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 170, C, C, 262); g.addColorStop(0, 'rgba(90,60,140,0.3)'); g.addColorStop(1, 'rgba(30,10,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });
}(window));
