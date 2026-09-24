// Labo Eraser — cadres épiques 6 à 10 (hors application).
(function (root) {
  'use strict';
  const { C, TAU, rng, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample } = root.Relief;
  const { ringText, knot, beads, rope, plait, facetRay, matting, P, circle, ringPath, arcPath, sectorPath, polar, polarPts, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, voronoi, scatter, rivet, gem, leaf, runePath } = root.Helpers;
  const { add, innerLip, FONT, glowDot, cutOpening, angleDiff } = root.FrameKit;

  /* ------------------------------------------------------------------ */
  /* 6 — Givre ancestral : fer gelé, couronne d'éclats de glace facettés, stalactites. */
  function shard(L, x, y, len, wid, ang, o = {}) {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const at = (u, v) => [x + dx * u + px * v, y + dy * u + py * v];
    const bl = at(0, -wid / 2), br = at(0, wid / 2), sl = at(len * 0.72, -wid * 0.42), sr = at(len * 0.72, wid * 0.42), tip = at(len, 0), b0 = at(0, 0), s0 = at(len * 0.72, 0);
    const ice = { kind: 'glass', metal: 0, rough: o.rough ?? 0.08 };
    const h = o.height ?? 0.7;
    const col = o.albedo || '#86a9bb';
    const t = 0.62, f = 0.18;
    // Deux grandes faces du prisme, puis la pointe pyramidale.
    L.fill(poly([bl, sl, s0, b0]), { albedo: col, height: h, normal: [-px * t - dx * f * 0.3, -py * t - dy * f * 0.3, 1], ...ice, op: 'source-over' });
    L.fill(poly([b0, s0, sr, br]), { albedo: o.albedo2 || '#34586f', height: h, normal: [px * t - dx * f * 0.3, py * t - dy * f * 0.3, 1], ...ice, op: 'source-over' });
    L.fill(poly([sl, tip, s0]), { albedo: o.albedo3 || '#a3c8da', height: h + 0.02, normal: [-px * t * 0.8 + dx * 0.55, -py * t * 0.8 + dy * 0.55, 1], ...ice, op: 'source-over' });
    L.fill(poly([s0, tip, sr]), { albedo: o.albedo2 || '#34586f', height: h + 0.02, normal: [px * t * 0.8 + dx * 0.55, py * t * 0.8 + dy * 0.55, 1], ...ice, op: 'source-over' });
    // Arête lumineuse et cœur bleuté (lumière piégée dans la glace).
    L.stroke(poly([b0, s0, tip], false), 1.1, { albedo: 'rgba(235,248,255,0.9)', keepMaterial: true, emissive: 'rgba(120,190,230,0.14)', emissiveWidth: 2 });
    L.glow((e) => { const g = e.createLinearGradient(b0[0], b0[1], tip[0], tip[1]); g.addColorStop(0, 'rgba(40,110,170,0.22)'); g.addColorStop(1, 'rgba(40,110,170,0)'); e.fillStyle = g; e.beginPath(); e.moveTo(bl[0], bl[1]); e.lineTo(sl[0], sl[1]); e.lineTo(tip[0], tip[1]); e.lineTo(sr[0], sr[1]); e.lineTo(br[0], br[1]); e.closePath(); e.fill(); });
  }

  add('frost', 'Givre ancestral', (L) => {
    const iron = { kind: 'silver', metal: 0.9, rough: 0.42 };
    const f = getFields();
    L.fill(ringPath(166, 232), { albedo: '#4a525b', height: ringStyle(C, C, 166, 232, 0.26, 0.4, 'bevel'), ...iron });
    ringText(L, 'ᛁ ᛋ ᚨ ᚺ ᚷ ᛁ ᛋ ᚨ ', 199, { size: 14, font: '700 15px "FreeMono", monospace', depth: 0.5, albedo: '#1d2a33', emissive: 'rgba(90,180,230,0.55)' });
    beads(L, 227, 110, 2.2, { albedo: '#6d7680', ...iron, base: 0.32, peak: 0.46 });
    // Givre : cristaux de gelée blanche sur les reliefs.
    L.paint(ringPath(166, 236), (x, y, px) => {
      const n = sample(f.mid, x * 1.2, y * 1.2), m2 = sample(f.low, x * 3, y * 3), up = 1 - (y - 20) / 470;
      const frost = smooth(0.58, 0.74, n * 0.55 + m2 * 0.15 + up * 0.35) * (0.5 + 0.5 * sample(f.high, x * 1.6, y * 1.6)) * 0.7;
      if (frost < 0.03) { px.skip = true; return; }
      px.rgb = [214, 228, 238]; px.alpha = frost * 0.7; px.rough = 0.5 + 0.3 * frost; px.kind = 'cloth';
      px.h = 0.02 * frost; px.hMode = 'add';
    });
    // Éclats : couronne haute, bouquets autour, stalactites en bas.
    const r = rng(61);
    const cluster = (a, count, lenMin, lenMax, spread, rad = 212) => {
      for (let k = 0; k < count; k += 1) {
        const aa = a + (r() - 0.5) * spread; const [x, y] = P(rad + r() * 8, aa);
        const dir = aa + (r() - 0.5) * 0.8;
        const room = 250 - rad;
        shard(L, x, y, Math.min(room + 8, lenMin + r() * (lenMax - lenMin)), 11 + r() * 9, dir, { height: 0.55 + r() * 0.3 });
      }
    };
    for (let k = 0; k < 11; k += 1) cluster(-Math.PI / 2 + (k - 5) * 0.14, 2, 30, 46, 0.1, 204);
    for (const a of [-0.45, 0.2, 0.95, Math.PI - 0.95, Math.PI - 0.2, Math.PI + 0.45]) cluster(a, 4, 22, 40, 0.34, 208);
    for (let k = 0; k < 9; k += 1) {
      const a = Math.PI / 2 + (k - 4) * 0.13; const [x, y] = P(228, a); const len = 12 + r() * 12 + (4 - Math.abs(k - 4)) * 3;
      L.taper([[x, y], [x + (r() - 0.5) * 3, y + len]], (t) => 8 * (1 - t) + 0.6, { albedo: '#8fb6ca', base: 0.5, peak: 0.8, kind: 'glass', rough: 0.06, emissive: 'rgba(60,140,200,0.25)' });
    }
    // Neige accumulée sur le haut de l'anneau.
    innerLip(L, 160, iron, '#6b7580', 8);
    return {
      opening: 162,
      options: { seed: 6, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.2, 1.42, 1.7] }, { dir: [0.7, 0.45, 0.5], color: [0.1, 0.18, 0.32], shadow: false }], room: [0.22, 0.28, 0.34], tint: [0.94, 1.0, 1.08], saturation: 0.75 },
      portrait: { tint: 'rgba(60,110,160,0.12)', filter: 'saturate(0.75) contrast(1.06)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 190, C, C, 262); g.addColorStop(0, 'rgba(140,200,240,0.35)'); g.addColorStop(1, 'rgba(60,120,180,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
      front(ctx) { const r2 = rng(66); for (let i = 0; i < 40; i += 1) { const [x, y] = P(200 + r2() * 60, r2() * TAU); ctx.fillStyle = `rgba(235,245,255,${0.25 + r2() * 0.6})`; ctx.beginPath(); ctx.arc(x, y, 0.6 + r2() * 1.4, 0, TAU); ctx.fill(); } },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 7 — Gueule des Abysses : chair sombre, rangées de crocs, yeux, tentacules. */
  add('abyss', 'Gueule des Abysses', (L) => {
    const f = getFields();
    const flesh = { kind: 'organic', metal: 0, rough: 0.3 };
    // Tentacules derrière, avec ventouses.
    const tentacle = (pts, w0) => {
      const tp = L.taper(pts, (t) => w0 * (1 - t) + 2.5, { albedo: '#4b2a3a', base: 0.26, peak: (t) => 0.6 - 0.2 * t, ...flesh });
      for (let k = 6; k < tp.length - 10; k += 9) { const p = tp[k]; const w = (w0 * (1 - p.t) + 2.5) * 0.3; const nx = Math.cos(p.a + Math.PI / 2), ny = Math.sin(p.a + Math.PI / 2); L.torus(p.x + nx * w, p.y + ny * w, w * 0.62, w * 0.62, 0, 0.5, { albedo: '#8a5a62', base: 0.4, peak: 0.66 - 0.2 * p.t, ...flesh }); }
    };
    tentacle(bezierPts([C - 150, C - 160], [C - 230, C - 215], [C - 262, C - 90], [C - 214, C - 40]), 30);
    tentacle(bezierPts([C + 150, C + 165], [C + 235, C + 215], [C + 262, C + 90], [C + 216, C + 44]), 30);
    tentacle(bezierPts([C + 140, C - 180], [C + 200, C - 250], [C + 262, C - 210], [C + 244, C - 130]), 20);
    // Chair : lèvre charnue à l'extérieur, gorge sombre vers le portrait, plis rayonnants.
    L.paint(ringPath(158, 250), (x, y, px) => {
      const dx = x - C, dy = y - C; const rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const u = (rr - 158) / 92;
      const n = sample(f.mid, x * 0.9, y * 0.9), hn = sample(f.high, x * 0.6, y * 0.6);
      const folds = Math.sin(a * 36 + n * 6 + u * 3) * 0.5 + 0.5;
      const lip = Math.exp(-(((u - 0.86) / 0.11) ** 2));
      px.h = 0.2 + 0.18 * u + 0.05 * folds * (1 - lip * 0.5) + 0.22 * lip + (hn - 0.5) * 0.02; px.hMode = 'set';
      const deep = smooth(0.55, 0.0, u);
      const k = (0.75 + 0.35 * folds) * (1 - 0.65 * deep);
      const vein = 1 - smooth(0.015, 0.045, Math.abs(sample(f.mid, x * 2.2 + 40, y * 2.2) - 0.5));
      px.rgb = [(70 + 26 * n) * k + vein * 26 * (1 - deep), (27 + 9 * n) * k, (40 + 14 * n) * k];
      px.kind = 'organic'; px.metal = 0; px.rough = 0.18 + 0.2 * (1 - folds);
    });
    // Rangées concentriques de crocs, pointés vers le portrait, sur leurs gencives.
    const r = rng(71);
    const rows = [{ rad: 232, n: 20, len: 36, w: 13 }, { rad: 210, n: 26, len: 30, w: 11 }, { rad: 188, n: 32, len: 26, w: 9 }];
    rows.forEach((row, ri) => {
      for (let k = 0; k < row.n; k += 1) {
        const a = (k / row.n) * TAU + ri * 0.09 + (r() - 0.5) * 0.04;
        const len = row.len * (0.8 + r() * 0.35); const hook = (k % 2 ? 1 : -1) * (0.02 + r() * 0.04);
        const [gx, gy] = P(row.rad + 2, a);
        L.ellipse(gx, gy, row.w * 0.9, row.w * 0.75, a, { albedo: '#6e2c3c', base: 0.3 + ri * 0.02, peak: 0.52 + ri * 0.02, ...flesh });
        const pts = [P(row.rad, a), P(row.rad - len * 0.5, a + hook * 0.3), P(row.rad - len * 0.85, a + hook * 0.8), P(row.rad - len, a + hook)];
        L.taper(pts, (t) => row.w * Math.pow(1 - t, 0.75) + 0.3, { albedo: (t) => `rgb(${Math.round(160 + 80 * t)},${Math.round(142 + 88 * t)},${Math.round(110 + 90 * t)})`, base: 0.46 + ri * 0.03, peak: (t) => 0.8 - t * 0.12 + ri * 0.03, kind: 'bone', rough: 0.28, over: true });
      }
    });
    // Yeux sur la lèvre.
    for (const [a, s] of [[-2.25, 8], [-0.35, 7], [0.95, 9], [2.45, 7]]) {
      const [x, y] = P(244, a);
      L.dome(x, y, s + 3, { albedo: '#4a1c2a', base: 0.44, peak: 0.62, ...flesh });
      L.dome(x, y, s, { albedo: '#120c0c', base: 0.55, peak: 0.8, kind: 'glass', rough: 0.05 });
      L.fill(circle(s * 0.62, x, y), { albedo: '#b7b83a', height: 0.8, kind: 'glass', rough: 0.05, emissive: 'rgba(170,200,40,0.8)', op: 'lighten' });
      L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(x, y, s * 0.13, s * 0.52, a, 0, TAU); }, { albedo: '#050404', height: 0.82, kind: 'glass', rough: 0.05, op: 'lighten' });
    }
    return {
      opening: 166,
      options: { seed: 7, lights: [{ dir: [-0.4, -0.6, 0.7], color: [1.15, 1.0, 1.02] }, { dir: [0.6, 0.55, 0.45], color: [0.28, 0.45, 0.2], shadow: false }], room: [0.2, 0.16, 0.2], saturation: 0.85 },
      portrait: { tint: 'rgba(40,10,20,0.18)', filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 180, C, C, 262); g.addColorStop(0, 'rgba(90,150,30,0.25)'); g.addColorStop(1, 'rgba(30,60,10,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 8 — Roi sylvestre : racines tressées, bois de cerf, chêne et lierre, mousse, lucioles. */
  function antler(L, base, dir, len, side, o) {
    const mat = { kind: 'bone', metal: 0, rough: 0.62 };
    const pts = bezierPts(base, [base[0] + Math.cos(dir) * len * 0.35, base[1] + Math.sin(dir) * len * 0.35], [base[0] + Math.cos(dir + side * 0.5) * len * 0.75, base[1] + Math.sin(dir + side * 0.5) * len * 0.75], [base[0] + Math.cos(dir + side * 0.2) * len, base[1] + Math.sin(dir + side * 0.2) * len], 40);
    const beam = L.taper(pts, (t) => 15 * (1 - t) + 3, { albedo: (t) => (t < 0.15 ? '#6e5a40' : '#b3a07c'), base: 0.46, peak: (t) => 0.9 - t * 0.15, ...mat });
    for (const [t, l, turn] of o.tines) {
      const p = beam[Math.round(t * (beam.length - 1))];
      const ta = p.a - side * turn;
      const tp = bezierPts([p.x, p.y], [p.x + Math.cos(ta) * l * 0.5, p.y + Math.sin(ta) * l * 0.5], [p.x + Math.cos(ta + side * 0.35) * l * 0.85, p.y + Math.sin(ta + side * 0.35) * l * 0.85], [p.x + Math.cos(ta + side * 0.45) * l, p.y + Math.sin(ta + side * 0.45) * l], 20);
      L.taper(tp, (u) => 9 * (1 - u) + 1.5, { albedo: '#b9a784', base: 0.5, peak: (u) => 0.86 - u * 0.12, ...mat });
    }
    // Perlures de la meule.
    for (let k = 0; k < 10; k += 1) { const p = beam[Math.round((k / 10) * 8)]; L.dome(p.x + Math.cos(p.a + Math.PI / 2) * 5, p.y + Math.sin(p.a + Math.PI / 2) * 5, 2.4, { albedo: '#5e4c36', base: 0.6, peak: 0.84, ...mat }); }
  }

  add('sylvan', 'Roi sylvestre', (L) => {
    const wood = { kind: 'wood', metal: 0, rough: 0.62 };
    const f = getFields();
    const r = rng(81);
    // Bois de cerf vers les coins hauts.
    antler(L, P(214, -Math.PI / 2 - 0.62), -Math.PI / 2 - 0.95, 120, -1, { tines: [[0.25, 40, 1.25], [0.52, 44, 1.2], [0.8, 32, 1.1]] });
    antler(L, P(214, -Math.PI / 2 + 0.62), -Math.PI / 2 + 0.95, 120, 1, { tines: [[0.25, 40, 1.25], [0.52, 44, 1.2], [0.8, 32, 1.1]] });
    // Deux branches noueuses torsadées.
    const strand = (sidx) => (a) => 211 + 9 * Math.sin(5 * a + sidx * Math.PI) + 3 * Math.sin(13 * a + sidx * 2.3);
    const bark = { albedo: '#3b2b1d', base: 0.4, peak: 0.84, ...wood, steps: 10 };
    for (let sidx = 0; sidx < 2; sidx += 1) L.tube(polar(strand(sidx), 0, TAU, 720), 23, bark);
    for (let k = 0; k < 10; k += 1) { const a = (k * Math.PI) / 5; L.tube(polar(strand(k % 2), a - 0.15, a + 0.15, 24), 23, { ...bark, gap: 4, gapAlbedo: '#22180f', gapHeight: 0.34 }); }
    for (let k = 0; k < 14; k += 1) { const a = r() * TAU; const [x, y] = P(strand(k % 2)(a), a); L.dome(x, y, 6 + r() * 4, { albedo: '#4a3624', base: 0.7, peak: 0.92, ...wood }); L.engrave(circle(3 + r() * 2, x, y), 1, 0.3); }
    for (let k = 0; k < 520; k += 1) {
      const a = r() * TAU; const sidx = k % 2; const rr = strand(sidx)(a) + (r() - 0.5) * 16; const [x, y] = P(rr, a); const t = a + Math.PI / 2 + (r() - 0.5) * 0.4; const l = 2 + r() * 6;
      L.engrave(poly([[x - Math.cos(t) * l, y - Math.sin(t) * l], [x + Math.cos(t) * l, y + Math.sin(t) * l]], false), 1, 0.22);
    }
    // Mousse sur les reliefs.
    L.paint(ringPath(186, 240), (x, y, px) => {
      const n = sample(f.mid, x * 1.1, y * 1.1), g2 = sample(f.high, x * 1.5, y * 1.5), top = smooth(0.3, 0.7, 1 - y / 512);
      const moss = smooth(0.54, 0.64, n + top * 0.1) * (0.55 + 0.45 * g2);
      if (moss < 0.05 || px.H < 0.45) { px.skip = true; return; }
      px.rgb = [60 + 30 * g2, 82 + 34 * g2, 34 + 10 * g2]; px.alpha = moss; px.rough = 0.95; px.kind = 'cloth';
      px.h = 0.02 * moss; px.hMode = 'add';
    });
    // Feuilles de chêne et de lierre en bouquets, glands.
    const greens = ['#44512a', '#3a4726', '#525a2e', '#5e5228', '#6a4420', '#704a22'];
    const bunch = (a0, count) => { for (let k = 0; k < count; k += 1) { const a = a0 + (r() - 0.5) * 0.5; const [x, y] = P(208 + r() * 18, a); const ivy = r() < 0.3; leaf(L, x, y, ivy ? 26 : 36 + r() * 8, ivy ? 22 : 17, a + (r() - 0.5) * 2.6, { shape: ivy ? 'ivy' : 'oak', albedo: greens[Math.floor(r() * greens.length)], base: 0.64, peak: 0.86, rough: 0.5, op: 'source-over' }); } };
    for (const a of [-Math.PI / 2, -Math.PI / 2 - 1.2, -Math.PI / 2 + 1.2, Math.PI / 2 - 0.9, Math.PI / 2 + 0.9, 0.2, Math.PI - 0.2]) bunch(a, 7);
    for (const a of [-Math.PI / 2 - 0.25, -Math.PI / 2 + 0.25, Math.PI / 2 - 0.7, Math.PI / 2 + 0.7]) {
      const [x, y] = P(222, a);
      L.ellipse(x, y + 3, 6, 8, a, { albedo: '#8a6a34', base: 0.74, peak: 0.98, kind: 'wood', rough: 0.35 });
      L.ellipse(x - Math.cos(a) * 5, y - Math.sin(a) * 5, 7.5, 5, a + Math.PI / 2, { albedo: '#5a4526', base: 0.8, peak: 1, kind: 'wood', rough: 0.85 });
    }
    // Champignons luminescents en bas.
    for (const [a, s] of [[Math.PI / 2 - 0.32, 1.1], [Math.PI / 2 - 0.2, 0.75], [Math.PI / 2 + 0.24, 0.9], [Math.PI / 2 + 0.36, 0.65]]) {
      const [x, y] = P(234, a);
      L.taper([[x, y + 6 * s], [x, y - 6 * s]], [4.5 * s, 3.4 * s], { albedo: '#d8d0b8', base: 0.62, peak: 0.84, kind: 'organic', rough: 0.6 });
      L.ellipse(x, y - 8 * s, 10 * s, 5.5 * s, 0, { albedo: '#6fa89a', base: 0.76, peak: 0.98, kind: 'organic', rough: 0.4, emissive: 'rgba(90,220,190,0.5)' });
    }
    innerLip(L, 164, wood, '#4a3522', 9);
    return {
      opening: 166,
      options: { seed: 8, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.55, 1.4, 1.05] }, { dir: [0.7, 0.45, 0.5], color: [0.12, 0.2, 0.14], shadow: false }], room: [0.22, 0.24, 0.16], saturation: 0.85 },
      portrait: { tint: 'rgba(40,70,20,0.08)' },
      front(ctx) { const r2 = rng(88); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i += 1) { const [x, y] = P(190 + r2() * 70, r2() * TAU); const g = ctx.createRadialGradient(x, y, 0, x, y, 7); g.addColorStop(0, 'rgba(230,255,150,0.95)'); g.addColorStop(1, 'rgba(120,200,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); } ctx.restore(); },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 9 — Bastion runique : octogone d'acier nain, entrelacs d'or anguleux, runes de braise. */
  add('dwarf', 'Bastion runique', (L) => {
    const steel = { kind: 'silver', metal: 0.9, rough: 0.46 };
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.38 };
    const R = 250, rot = Math.PI / 8;
    const oct = (rad) => { const pts = []; for (let k = 0; k < 8; k += 1) pts.push(P(rad, rot + (k / 8) * TAU)); return pts; };
    const octDist = (x, y) => { let m = -1e9; for (let k = 0; k < 8; k += 1) { const a = (k / 8) * TAU; m = Math.max(m, (x - C) * Math.cos(a) + (y - C) * Math.sin(a)); } return m; };
    const apo = R * Math.cos(Math.PI / 8);
    L.paint((ctx) => { poly(oct(R))(ctx); ctx.moveTo(C + 160, C); ctx.arc(C, C, 160, 0, TAU, true); }, (x, y, px) => {
      const d = octDist(x, y); const rr = Math.hypot(x - C, y - C);
      const outer = smooth(apo, apo - 12, d), inner = smooth(160, 172, rr);
      const plateau = d > apo - 40 && d < apo - 16 ? 0.06 : 0;
      px.h = 0.26 + 0.24 * Math.min(outer, inner) + plateau; px.hMode = 'set';
      px.rgb = [74, 76, 80]; px.kind = 'silver'; px.metal = 0.9; px.rough = 0.46;
    }, { rule: 'evenodd' });
    L.engrave(poly(oct(R - 14)), 1.6, 0.3); L.engrave(poly(oct(R - 40)), 1.6, 0.3);
    // Méandre d'or anguleux dans la bande extérieure.
    for (let k = 0; k < 8; k += 1) {
      const a0 = rot + (k / 8) * TAU, a1 = rot + ((k + 1) / 8) * TAU;
      const p0 = P(R - 27, a0), p1 = P(R - 27, a1);
      const ux = (p1[0] - p0[0]), uy = (p1[1] - p0[1]); const lenE = Math.hypot(ux, uy); const ex = ux / lenE, ey = uy / lenE; const nx = -ey, ny = ex;
      const pts = []; const step = 12, amp = 7; const n = Math.floor((lenE - 30) / (step * 2));
      const start = (lenE - n * step * 2) / 2;
      const at = (u, v) => [p0[0] + ex * u + nx * v, p0[1] + ey * u + ny * v];
      for (let i = 0; i < n; i += 1) { const u = start + i * step * 2; pts.push(at(u, -amp), at(u, amp), at(u + step, amp), at(u + step, -amp)); }
      pts.push(at(start + n * step * 2, -amp));
      L.ribbon(poly(pts, false), 4, { albedo: '#b08d45', base: 0.52, peak: 0.66, ...gilt, groove: false });
    }
    // Boulons d'angle.
    for (const [x, y] of oct(R - 27)) {
      L.fill(poly(Array.from({ length: 6 }, (_, i) => [x + Math.cos(i * TAU / 6) * 11, y + Math.sin(i * TAU / 6) * 11])), { albedo: '#a9883f', height: 0.62, ...gilt, op: 'source-over' });
      L.dome(x, y, 6.5, { albedo: '#b8954a', base: 0.62, peak: 0.8, ...gilt });
    }
    // Tablettes runiques aux points cardinaux.
    const rr2 = rng(91);
    for (let k = 0; k < 4; k += 1) {
      const a = (k / 4) * TAU; const [x, y] = P(200, a);
      const w = 54, h = 26; const ca = Math.cos(a + Math.PI / 2), sa = Math.sin(a + Math.PI / 2);
      const rect = (ww, hh) => poly([[-ww, -hh], [ww, -hh], [ww, hh], [-ww, hh]].map(([u, v]) => [x + ca * u - sa * v, y + sa * u + ca * v]));
      L.fill(rect(w / 2 + 3, h / 2 + 3), { albedo: '#1c1a19', height: 0.4, kind: 'stone', rough: 0.9, op: 'source-over' });
      L.fill(rect(w / 2, h / 2), { albedo: '#3a3634', height: 0.5, kind: 'stone', rough: 0.85, op: 'source-over' });
      for (let q = -2; q <= 2; q += 1) { const [rx, ry] = [x + ca * q * 9.5, y + sa * q * 9.5]; L.engrave(runePath(rx, ry, a + Math.PI / 2, 15, rr2), 2.4, 0.55, { albedo: '#ffae52', emissive: 'rgba(255,120,30,0.9)', emissiveWidth: 1.6 }); }
    }
    // Pignon au sommet : gemme de sang.
    const gable = poly([[C - 50, 30], [C, -2], [C + 50, 30], [C + 40, 38], [C - 40, 38]]);
    L.fill(gable, { albedo: '#4d4f53', height: 0.66, ...steel, op: 'source-over' });
    L.ribbon(poly([[C - 48, 30], [C, 0], [C + 48, 30]], false), 5, { albedo: '#b08d45', base: 0.66, peak: 0.84, ...gilt, groove: false });
    gem(L, C, 22, 9, { color: '#8a0d14', base: 0.68, lift: 0.3, setting: 3, setAlbedo: '#b08d45', glow: 'rgba(255,40,20,0.35)' });
    innerLip(L, 154, gilt, '#a9883f', 8);
    return {
      opening: 156,
      options: { seed: 9, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.55, 1.42, 1.25] }, { dir: [0.7, 0.45, 0.5], color: [0.3, 0.14, 0.06], shadow: false }], room: [0.24, 0.23, 0.22], saturation: 0.82 },
    };
  });

  /* ------------------------------------------------------------------ */
  /* 10 — Astrolabe des arcanes : laiton gradué, zodiaque, émail lapis étoilé, araignée, trône. */
  add('astrolabe', 'Astrolabe des arcanes', (L) => {
    const brass = { kind: 'gold', metal: 0.95, rough: 0.4 };
    const B = '#a88a4c', B2 = '#8e7440';
    L.fill(ringPath(166, 236), { albedo: B2, height: ringStyle(C, C, 166, 236, 0.3, 0.42, 'bevel'), ...brass });
    // Graduations.
    for (let k = 0; k < 180; k += 1) { const a = (k / 180) * TAU; const long = k % 5 === 0; L.engrave(poly([P(226, a), P(long ? 212 : 219, a)], false), long ? 1.3 : 0.9, 0.4); }
    L.engrave(circle(211), 1.2, 0.3); L.engrave(circle(229), 1.2, 0.3);
    // Émail lapis-lazuli étoilé.
    L.paint(ringPath(190, 208), (x, y, px) => {
      const f = getFields(); const n = sample(f.mid, x * 2, y * 2), v = Math.abs(sample(f.low, x * 4, y * 4) - 0.5), fl = sample(f.fine, x * 1.7, y * 1.7);
      const calcite = (1 - smooth(0.004, 0.014, v)) * 0.6;
      px.rgb = [22 + 20 * n + calcite * 90, 36 + 22 * n + calcite * 90, 92 + 40 * n + calcite * 80];
      if (fl > 0.93) px.rgb = [200, 170, 90];
      px.h = 0.34; px.hMode = 'set'; px.kind = 'glass'; px.metal = fl > 0.93 ? 0.9 : 0; px.rough = 0.25;
    });
    const r = rng(101);
    for (let k = 0; k < 70; k += 1) { const [x, y] = P(191 + r() * 16, r() * TAU); const s = 0.8 + r() * 1.4; L.fill(poly([[x, y - s * 2], [x + s * 0.5, y - s * 0.5], [x + s * 2, y], [x + s * 0.5, y + s * 0.5], [x, y + s * 2], [x - s * 0.5, y + s * 0.5], [x - s * 2, y], [x - s * 0.5, y - s * 0.5]]), { albedo: '#d9b45a', height: 0.38, ...brass, op: 'source-over' }); }
    // Zodiaque.
    const signs = '♈♉♊♋♌♍♎♏♐♑♒♓';
    L.fill(ringPath(170, 188), { albedo: B, height: 0.36, ...brass, op: 'source-over' });
    [...signs].forEach((ch, k) => { const a = -Math.PI / 2 + (k / 12) * TAU; const [x, y] = P(179, a); L.text(ch, x, y, a + Math.PI / 2, { font: '700 14px "FreeSerif", serif', depth: 0.55, albedo: '#2c2010' }); L.engrave(poly([P(170, a + Math.PI / 12), P(188, a + Math.PI / 12)], false), 1, 0.35); });
    // Cercle de l'écliptique excentré.
    L.fill((ctx) => { ctx.beginPath(); ctx.arc(C, C - 26, 214, 0, TAU); ctx.arc(C, C - 26, 206, 0, TAU, true); }, { albedo: B, height: ringStyle(C, C - 26, 206, 214, 0.44, 0.6, 'round'), ...brass, rule: 'evenodd', clip: ringPath(166, 238) });
    // Araignée : pointeurs d'étoiles en flamme.
    for (let k = 0; k < 8; k += 1) {
      const a = (k / 8) * TAU + Math.PI / 8; const side = k % 2 ? 1 : -1;
      const pts = bezierPts(P(200, a - side * 0.08), P(222, a + side * 0.02), P(238, a - side * 0.05), P(252, a + side * 0.04), 24);
      L.taper(pts, (t) => 9 * (1 - t) + 1, { albedo: B, base: 0.5, peak: 0.72, ...brass });
      const [gx, gy] = pts[4]; gem(L, gx, gy, 3.2, { color: ['#c8d2da', '#8a1420', '#1f4f8f', '#2f6a3a'][k % 4], cut: 'cabochon', setting: 1.2, setAlbedo: B, base: 0.6, lift: 0.2 });
    }
    // Trône et anneau de suspension.
    const throne = poly([[C - 40, 44], [C - 26, 22], [C - 10, 16], [C + 10, 16], [C + 26, 22], [C + 40, 44]]);
    L.fill(throne, { albedo: B, height: domeStyle(C, 40, 44, 0.46, 0.74), ...brass, op: 'source-over' });
    for (const d of [-1, 1]) L.taper(spiralPts(C + d * 24, 32, 9, 1.5, d > 0 ? Math.PI : 0, -d * 1.1, 30), [4.5, 1.4], { albedo: B, base: 0.6, peak: 0.84, ...brass });
    L.torus(C, 12, 13, 11, 0, 0.36, { albedo: B, base: 0.5, peak: 0.84, ...brass });
    gem(L, C, 34, 5, { color: '#c9d6e0', cut: 'cabochon', setting: 2, setAlbedo: B, base: 0.7, lift: 0.2, glow: 'rgba(200,230,255,0.35)' });
    innerLip(L, 160, brass, B, 8);
    return {
      opening: 162,
      options: { seed: 10, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.6, 1.45, 1.15] }, { dir: [0.7, 0.45, 0.5], color: [0.14, 0.18, 0.32], shadow: false }], room: [0.3, 0.27, 0.22] },
      portrait: { tint: 'rgba(20,40,90,0.08)' },
    };
  });
}(window));
