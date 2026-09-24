// Labo Eraser — cadres épiques refaits (6, 11, 14) et nouveaux (17, 19).
(function (root) {
  'use strict';
  const { C, TAU, rng, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample, resample } = root.Relief;
  const { ringText, beads, rope, P, circle, ringPath, arcPath, sectorPath, polar, polarPts, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, rivet, gem, runePath } = root.Helpers;
  const { innerLip, cutOpening } = root.FrameKit;
  const frames = root.EpicLab.frames;
  const replace = (oldId, id, name, build) => { const i = frames.findIndex((f) => f.id === oldId); frames.splice(i, 1, { id, name, build }); };

  function shard(L, x, y, len, wid, ang, o = {}) {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const at = (u, v) => [x + dx * u + px * v, y + dy * u + py * v];
    const bl = at(0, -wid / 2), br = at(0, wid / 2), sl = at(len * 0.72, -wid * 0.42), sr = at(len * 0.72, wid * 0.42), tip = at(len, 0), b0 = at(0, 0), s0 = at(len * 0.72, 0);
    const ice = { kind: 'glass', metal: 0, rough: 0.08 };
    const h = o.height ?? 0.7; const t = 0.62;
    L.fill(poly([bl, sl, s0, b0]), { albedo: '#8fb2c4', height: h, normal: [-px * t, -py * t, 1], ...ice, op: 'source-over' });
    L.fill(poly([b0, s0, sr, br]), { albedo: '#3a6078', height: h, normal: [px * t, py * t, 1], ...ice, op: 'source-over' });
    L.fill(poly([sl, tip, s0]), { albedo: '#b4d2e0', height: h + 0.02, normal: [-px * t * 0.8 + dx * 0.55, -py * t * 0.8 + dy * 0.55, 1], ...ice, op: 'source-over' });
    L.fill(poly([s0, tip, sr]), { albedo: '#3a6078', height: h + 0.02, normal: [px * t * 0.8 + dx * 0.55, py * t * 0.8 + dy * 0.55, 1], ...ice, op: 'source-over' });
    L.stroke(poly([b0, s0, tip], false), 1, { albedo: 'rgba(235,248,255,0.85)', keepMaterial: true });
    L.glow((e) => { const g = e.createLinearGradient(b0[0], b0[1], tip[0], tip[1]); g.addColorStop(0, 'rgba(50,120,180,0.25)'); g.addColorStop(1, 'rgba(50,120,180,0)'); e.fillStyle = g; e.beginPath(); e.moveTo(...bl); e.lineTo(...sl); e.lineTo(...tip); e.lineTo(...sr); e.lineTo(...br); e.closePath(); e.fill(); });
  }

  /* 6 — Givre ancestral : la glace a pris l'anneau, les éclats poussent de la gangue. */
  replace('frost', 'frost', 'Givre ancestral', (L) => {
    const steel = { kind: 'silver', metal: 0.9, rough: 0.42 };
    const f = getFields(); const r = rng(606);
    L.fill(ringPath(166, 232), { albedo: '#434b54', height: ringStyle(C, C, 166, 232, 0.26, 0.4, 'bevel'), ...steel });
    ringText(L, 'ᛁ ᛋ ᚨ ᚺ ᚷ ᛁ ᛋ ᚨ ', 199, { size: 14, font: '700 15px "FreeMono", monospace', depth: 0.5, albedo: '#1d2a33', emissive: 'rgba(90,180,230,0.5)' });
    beads(L, 227, 110, 2.2, { albedo: '#646d77', ...steel, base: 0.32, peak: 0.46 });
    // Gangue de glace : épaisse en haut, en coulées sur les flancs, quelques plaques en bas.
    const thick = (a) => { const top = Math.max(0, -Math.sin(a)); return 0.25 + 0.75 * Math.pow(top, 0.8) + 0.25 * sample(f.low, Math.cos(a) * 300 + 256, Math.sin(a) * 300 + 256); };
    L.paint(ringPath(168, 256), (x, y, px) => {
      const dx = x - C, dy = y - C; const rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const th = thick(a); const outer = 222 + 30 * th + 6 * (sample(f.mid, x * 1.5, y * 1.5) - 0.5);
      const cover = smooth(0.35, 0.5, th + (sample(f.mid, x * 0.9, y * 0.9) - 0.5) * 0.5);
      if (rr > outer || cover < 0.05) { px.skip = true; return; }
      const u = clamp01((outer - rr) / 18);
      const bub = sample(f.fine, x * 1.3, y * 1.3) > 0.93 ? 1 : 0; const crack = 1 - smooth(0.004, 0.02, Math.abs(sample(f.mid, x * 2.3, y * 2.3) - 0.5));
      px.rgb = [52 + 40 * u + 70 * bub + 50 * crack, 88 + 44 * u + 60 * bub + 50 * crack, 112 + 40 * u + 40 * bub + 40 * crack]; px.alpha = cover * 0.9;
      px.h = 0.42 + 0.3 * Math.sqrt(u) * cover + (sample(f.high, x, y) - 0.5) * 0.02; px.hMode = 'max';
      px.kind = 'glass'; px.metal = 0; px.rough = 0.1; px.e = [3 * u, 10 * u, 16 * u];
    });
    // Éclats enracinés dans la gangue, puis un bourrelet de glace à leur pied.
    const roots = [];
    for (let k = 0; k < 13; k += 1) { const a = -Math.PI / 2 + (k - 6) * 0.15 + (r() - 0.5) * 0.05; roots.push([a, 212, 36 + (6 - Math.abs(k - 6)) * 3 + r() * 8, 12 + r() * 8]); }
    for (const a of [-0.35, 0.05, Math.PI - 0.05, Math.PI + 0.35]) for (let k = 0; k < 3; k += 1) roots.push([a + (r() - 0.5) * 0.3, 214, 20 + r() * 12, 9 + r() * 5]);
    for (const [a, rad, len, wid] of roots) { const dir = a + (r() - 0.5) * 0.7; const [x, y] = P(rad, a); shard(L, x, y, Math.min(len, 262 - rad), wid, dir, { height: 0.6 + r() * 0.25 }); }
    for (const [a, rad, , wid] of roots) { const [x, y] = P(rad + 2, a); L.ellipse(x, y, wid * 0.9, wid * 0.7, a, { albedo: '#5f8aa2', base: 0.55, peak: 0.78, kind: 'glass', rough: 0.1 }); }
    // Stalactites sous la gangue.
    for (let k = 0; k < 14; k += 1) { const a = (r() < 0.5 ? 0.3 : Math.PI - 0.3) + (r() - 0.5) * 0.5; const [x, y] = P(226, a); const len = 10 + r() * 16; L.taper([[x, y], [x + (r() - 0.5) * 2, y + len]], (t) => 6 * (1 - t) + 0.5, { albedo: '#9dbfd0', base: 0.5, peak: 0.78, kind: 'glass', rough: 0.06 }); }
    innerLip(L, 160, steel, '#5d6670', 8);
    return {
      opening: 162,
      options: { seed: 6, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.25, 1.42, 1.66] }, { dir: [0.7, 0.45, 0.5], color: [0.1, 0.18, 0.32], shadow: false }], room: [0.22, 0.28, 0.34], tint: [0.94, 1.0, 1.08], saturation: 0.8, bloom: 0.5, exposure: 0.95 },
      portrait: { tint: 'rgba(60,110,160,0.12)', filter: 'saturate(0.75) contrast(1.06)' },
      front(ctx) { const r2 = rng(66); for (let i = 0; i < 40; i += 1) { const [x, y] = P(200 + r2() * 60, r2() * TAU); ctx.fillStyle = `rgba(235,245,255,${0.2 + r2() * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 0.6 + r2() * 1.3, 0, TAU); ctx.fill(); } },
    };
  });

  /* 11 — Capuchon de la Naga : capuchon de cobra déployé, tête couronnée, anneaux du corps. */
  replace('ouroboros', 'naga', 'Capuchon de la Naga', (L) => {
    const f = getFields();
    const scale = { kind: 'organic', metal: 0.3, rough: 0.32 };
    const hr = (a) => { const d1 = Math.min(Math.abs(a + Math.PI / 2 - 0.8), Math.abs(a + Math.PI / 2 + 0.8)); return 220 + 64 * Math.exp(-((d1 / 0.45) ** 2)) + 18 * Math.exp(-(((a + Math.PI / 2) / 0.4) ** 2)) - 8 * Math.max(0, Math.sin(a)); };
    // Capuchon écailleux ; plaques claires en « lunettes » sur le haut.
    L.paint((ctx) => { const pts = polarPts(hr, 0, TAU, 360); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.moveTo(C + 166, C); ctx.arc(C, C, 166, 0, TAU, true); }, (x, y, px) => {
      const dx = x - C, dy = y - C; const rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const out = hr(a); const u = (rr - 166) / (out - 166);
      const row = Math.floor(u * 7); const off = row % 2 ? 0.5 : 0; const cu = a * 30 / Math.PI + off; const cell = Math.floor(cu);
      const fu = cu - cell - 0.5, fv = u * 7 - row - 0.5; const d = Math.hypot(fu * 1.15, fv * 1.05 + 0.15); const bump = clamp01(1 - d * 1.5); const rim = smooth(0.4, 0.62, d);
      const jr = rng(cell * 13 + row * 71)();
      const mark = 0;
      const ring = [-0.8, 0.8].some((c0) => Math.abs(Math.hypot((a + Math.PI / 2 - c0) * 2.2, (u - 0.55) * 1.6) - 0.42) < 0.09) ? 1 : 0;
      const n = sample(f.mid, x, y);
      let c = [30 + 26 * bump + 12 * n, 38 + 30 * bump + 10 * n, 22 + 14 * bump];
      if (ring || mark > 0.75) c = [150 + 50 * bump, 120 + 40 * bump, 60 + 20 * bump];
      const tone = (0.8 + 0.4 * jr) * (1 - 0.5 * rim);
      px.rgb = c.map((v) => v * tone); px.h = 0.3 + 0.36 * Math.sin(Math.PI * clamp01(u * 0.9 + 0.05)) + 0.05 * Math.sqrt(bump); px.hMode = 'set';
      px.kind = 'organic'; px.metal = 0.3; px.rough = 0.28 + 0.3 * rim;
    }, { rule: 'evenodd' });
    // Anneaux du corps enroulés sous le portrait.
    for (const [ry, w, span] of [[C + 214, 34, 0.95], [C + 236, 26, 0.7]]) {
      const pts = []; for (let i = 0; i <= 60; i += 1) { const t = i / 60; const a = Math.PI / 2 + (t - 0.5) * 2 * span; pts.push([C + Math.cos(a) * (ry - C) * 1.05, C + Math.sin(a) * (ry - C) * 0.98]); }
      const tp = L.taper(pts, (t) => w * (0.75 + 0.25 * Math.sin(Math.PI * t)), { albedo: '#2e3a22', base: 0.5, peak: 0.9, ...scale, over: true, gap: 3, gapAlbedo: '#141a10', gapHeight: 0.4 });
      for (let k = 0; k < tp.length; k += 3) { const p = tp[k]; const ww = w * (0.75 + 0.25 * Math.sin(Math.PI * p.t)) * 0.45; const nx = Math.cos(p.a + Math.PI / 2), ny = Math.sin(p.a + Math.PI / 2); L.engrave(poly([[p.x - nx * ww, p.y - ny * ww], [p.x + nx * ww * 0.2, p.y + ny * ww * 0.2]], false), 0.9, 0.2); }
      L.taper(pts.map(([x, y]) => [x, y + w * 0.28]), (t) => w * 0.3, { albedo: '#a4904e', base: 0.62, peak: 0.84, ...scale });
    }
    // Tête de cobra de face, gueule ouverte, couronne d'or.
    const hx = C, hy = 60, s = 1.45;
    const T = (pts) => localPts(hx, hy, 0, s, pts);
    L.fill(smoothPath(T([[0, -32], [22, -28], [34, -14], [36, 4], [28, 20], [14, 30], [0, 33], [-14, 30], [-28, 20], [-36, 4], [-34, -14], [-22, -28]]), true), { albedo: '#34422a', height: domeStyle(hx, hy - 6, 44 * s, 0.55, 1), ...scale, op: 'source-over' });
    for (const pl of [[[-10, -24], [10, -24], [12, -8], [-12, -8]], [[-26, -18], [-12, -24], [-14, -6], [-28, -2]], [[26, -18], [12, -24], [14, -6], [28, -2]]]) L.engrave(smoothPath(T(pl), true), 1.1, 0.3);
    for (const d of [-1, 1]) {
      const [ex, ey] = T([[d * 21, 0]])[0];
      L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(ex, ey, 6.5 * s, 4.5 * s, d * 0.35, 0, TAU); }, { albedo: '#d49a22', height: 0.98, kind: 'glass', rough: 0.05, emissive: 'rgba(240,160,30,0.5)', op: 'source-over' });
      L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(ex, ey, 1.2 * s, 4 * s, d * 0.35, 0, TAU); }, { albedo: '#0a0604', height: 0.99, kind: 'glass', rough: 0.05, op: 'source-over' });
      L.taper(T([[d * 10, -6], [d * 22, -9], [d * 32, -5]]), [4 * s, 2 * s], { albedo: '#3e4e30', base: 0.9, peak: 1, ...scale });
      L.engraveFill(circle(1.8 * s, ...T([[d * 6, 16]])[0]), 0.5, { albedo: '#0a0604' });
    }
    L.engraveFill(smoothPath(T([[-16, 24], [0, 20], [16, 24], [10, 34], [0, 37], [-10, 34]]), true), 0.6, { albedo: '#2a0a0a' });
    for (const d of [-1, 1]) L.taper(T([[d * 9, 23], [d * 8, 33]]), [3 * s, 0.4], { albedo: '#eee4c6', base: 0.8, peak: 0.95, kind: 'bone', rough: 0.3 });
    for (let k = -2; k <= 2; k += 1) { const [bx, by] = T([[k * 9, -30 + Math.abs(k) * 2]])[0]; L.taper([[bx, by], [bx + k * 2, by - (k === 0 ? 20 : 13)]], [7, 1], { albedo: '#b08d45', base: 0.8, peak: 1, kind: 'gold', metal: 0.95, rough: 0.35 }); }
    gem(L, ...T([[0, -24]])[0], 4, { color: '#1f6a45', setting: 1.5, setAlbedo: '#b08d45', base: 0.92, lift: 0.08 });
    innerLip(L, 160, { kind: 'gold', metal: 0.95, rough: 0.38 }, '#9c7c3e', 7);
    return {
      opening: 162,
      options: { seed: 11, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.55, 1.45, 1.2] }, { dir: [0.7, 0.45, 0.5], color: [0.16, 0.22, 0.14], shadow: false }], room: [0.22, 0.24, 0.18], saturation: 0.85 },
      portrait: { tint: 'rgba(40,60,20,0.1)' },
    };
  });

  /* 14 — Étreinte des profondeurs : tentacules qui s'emmêlent et forment l'anneau. */
  replace('kraken', 'tentacles', 'Étreinte des profondeurs', (L) => {
    const flesh = { kind: 'organic', metal: 0, rough: 0.24 };
    const f = getFields();
    // Eau noire des abysses derrière, avec lueurs.
    L.paint(ringPath(164, 238), (x, y, px) => { const n = sample(f.mid, x, y); px.rgb = [8 + 10 * n, 18 + 16 * n, 24 + 20 * n]; px.h = 0.12; px.hMode = 'set'; px.kind = 'glass'; px.rough = 0.1; if (sample(f.fine, x * 1.7, y * 1.7) > 0.975) px.e = [40, 160, 150]; });
    // Quatre tentacules en ondulation autour de l'anneau, pointes recourbées vers l'extérieur.
    const T = [];
    for (let k = 0; k < 4; k += 1) {
      const a0 = k * TAU / 4 + 0.3, span = TAU * 0.78; const ph = k * 1.7;
      const pts = []; for (let i = 0; i <= 160; i += 1) { const t = i / 160; const a = a0 + span * t; const rr = 205 + 17 * Math.sin(5 * a + ph) * (1 - 0.3 * t); pts.push(P(rr, a)); }
      const last = pts[pts.length - 1], prev = pts[pts.length - 3]; const dir = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
      const out = Math.atan2(last[1] - C, last[0] - C); const cx2 = last[0] + Math.cos(out) * 10, cy2 = last[1] + Math.sin(out) * 10;
      for (let i = 1; i <= 26; i += 1) { const t = i / 26; const ang = out + Math.PI + (dir > out ? 1 : -1) * t * 4.4; const rr = 10 * (1 - 0.72 * t); pts.push([cx2 + Math.cos(ang) * rr, cy2 + Math.sin(ang) * rr]); }
      const res = resample(pts, 1.5);
      T.push({ pts: res, w: (t) => 38 * Math.pow(1 - t, 1.3) + 2.5, col: ['#5a2a36', '#4a2a3e', '#632e2c', '#50303a'][k], seed: k });
    }
    const draw = (tt, i0, i1, over) => {
      const sub = tt.pts.slice(Math.max(0, i0), Math.min(tt.pts.length, i1));
      if (sub.length < 2) return;
      const n = tt.pts.length - 1;
      const tp = L.taper(sub.map((p) => [p.x, p.y]), (u) => tt.w((sub[0].t * 0 + (Math.max(0, i0) + u * (sub.length - 1)) / n)), { albedo: tt.col, base: 0.4, peak: 0.95, ...flesh, over: true, gap: 0, peak: over ? 1 : 0.9 });
      // Bande claire et ventouses sur la face intérieure.
      tp.forEach((p, j) => {
        const gt = (Math.max(0, i0) + j * (sub.length - 1) / Math.max(1, tp.length - 1)) / n; const w = tt.w(gt);
        if (j % 11 !== 0 || gt > 0.9) return;
        const nx = Math.cos(p.a - Math.PI / 2), ny = Math.sin(p.a - Math.PI / 2);
        const sx = p.x + nx * w * 0.3, sy = p.y + ny * w * 0.3;
        L.torus(sx, sy, w * 0.15, w * 0.15, 0, 0.5, { albedo: '#86645e', base: 0.92, peak: 1, ...flesh });
      });
    };
    for (const tt of T) draw(tt, 0, tt.pts.length, false);
    // Croisements : alternance dessus / dessous.
    const hits = [];
    for (let a = 0; a < T.length; a += 1) for (let b = a + 1; b < T.length; b += 1) {
      const A = T[a].pts, B = T[b].pts;
      for (let i = 0; i < A.length; i += 3) for (let j = 0; j < B.length; j += 3) { const dx = A[i].x - B[j].x, dy = A[i].y - B[j].y; if (dx * dx + dy * dy < 9) { if (!hits.some((h) => Math.hypot(h.x - A[i].x, h.y - A[i].y) < 30)) hits.push({ x: A[i].x, y: A[i].y, a, b, i, j }); } }
    }
    hits.forEach((h, k) => { const top = k % 2 ? h.a : h.b; const idx = top === h.a ? h.i : h.j; draw(T[top], idx - 14, idx + 14, true); });
    innerLip(L, 160, { kind: 'bronze', metal: 0.8, rough: 0.5 }, '#3d3028', 6);
    return {
      opening: 162,
      options: { seed: 14, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.3, 1.25, 1.2] }, { dir: [0.7, 0.45, 0.5], color: [0.12, 0.3, 0.32], shadow: false }], room: [0.18, 0.22, 0.24], saturation: 0.85 },
      portrait: { tint: 'rgba(10,50,60,0.16)', filter: 'saturate(0.8) contrast(1.06)' },
      back(ctx) { const g = ctx.createRadialGradient(C, C, 160, C, C, 262); g.addColorStop(0, 'rgba(30,110,120,0.3)'); g.addColorStop(1, 'rgba(10,40,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); },
    };
  });

  /* 17 — Mécanisme du Temps : grande roue dentée, cadran romain, engrenages imbriqués, aiguille bleuie. */
  function gear(L, x, y, rOut, teeth, o) {
    const rRoot = rOut - (o.tooth ?? 8), rIn = o.rim ?? rRoot - 8, hub = o.hub ?? rOut * 0.22, spokes = o.spokes ?? 5;
    const path = (ctx) => {
      ctx.beginPath();
      for (let k = 0; k < teeth; k += 1) { const a = (k / teeth) * TAU + (o.phase ?? 0), w = TAU / teeth; const pts = [[rRoot, a], [rOut, a + w * 0.18], [rOut, a + w * 0.42], [rRoot, a + w * 0.6]]; pts.forEach(([rr, aa], i) => { const px = x + Math.cos(aa) * rr, py = y + Math.sin(aa) * rr; if (k === 0 && i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); }
      ctx.closePath();
      if (o.hole) { ctx.moveTo(x + o.hole, y); ctx.arc(x, y, o.hole, 0, TAU, true); }
      else for (let s2 = 0; s2 < spokes; s2 += 1) { const a0 = (s2 / spokes) * TAU + 0.18, a1 = ((s2 + 1) / spokes) * TAU - 0.18; ctx.moveTo(x + Math.cos(a0) * (hub + 4), y + Math.sin(a0) * (hub + 4)); ctx.arc(x, y, rIn, a0 + 0.05, a1 - 0.05); ctx.arc(x, y, hub + 4, a1, a0, true); ctx.closePath(); }
    };
    L.fill(path, { albedo: o.albedo, height: ringStyle(x, y, 0, rOut, o.base ?? 0.4, (o.base ?? 0.4) + 0.2, (u) => (u > rIn / rOut ? 1 : u < (hub + 6) / rOut ? 0.9 : 0.55)), kind: o.kind, metal: 0.95, rough: o.rough ?? 0.4, rule: 'evenodd', op: 'source-over' });
    if (!o.hole) { L.dome(x, y, hub * 0.55, { albedo: o.albedo, base: (o.base ?? 0.4) + 0.2, peak: (o.base ?? 0.4) + 0.32, kind: o.kind, metal: 0.95, rough: 0.35 }); rivet(L, x, y, hub * 0.3, { base: (o.base ?? 0.4) + 0.3, peak: (o.base ?? 0.4) + 0.4, albedo: '#3a3431' }); }
  }
  replace('laurel', 'clockwork', 'Mécanisme du Temps', (L) => {
    const B = '#a88a4c';
    gear(L, C - 184, C - 176, 66, 18, { albedo: '#6f7378', kind: 'silver', base: 0.3, spokes: 6 });
    gear(L, C + 196, C - 168, 46, 14, { albedo: '#a0643c', kind: 'bronze', base: 0.32, spokes: 4, phase: 0.1 });
    gear(L, C + 186, C + 176, 60, 16, { albedo: B, kind: 'gold', base: 0.3, spokes: 5 });
    gear(L, C - 196, C + 170, 44, 13, { albedo: '#6f7378', kind: 'silver', base: 0.32, spokes: 4, phase: 0.2 });
    gear(L, C - 118, C + 232, 26, 10, { albedo: '#a0643c', kind: 'bronze', base: 0.36, spokes: 3 });
    // Grande roue qui porte le cadran.
    gear(L, C, C, 252, 72, { albedo: B, kind: 'gold', base: 0.34, tooth: 10, hole: 162 });
    L.fill(ringPath(170, 236), { albedo: '#b89a58', height: ringStyle(C, C, 170, 236, 0.46, 0.58, 'bevel'), kind: 'gold', metal: 0.95, rough: 0.38, op: 'source-over' });
    L.fill(ringPath(184, 222), { albedo: '#b9a67e', height: 0.5, kind: 'paint', rough: 0.5, op: 'source-over' });
    for (let k = 0; k < 60; k += 1) { const a = (k / 60) * TAU; L.engrave(poly([P(219, a), P(k % 5 ? 214 : 209, a)], false), k % 5 ? 0.8 : 1.4, 0.4, { albedo: '#2a2016' }); }
    const numerals = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    numerals.forEach((txt, k) => { const a = -Math.PI / 2 + (k / 12) * TAU; const [x, y] = P(196, a); L.text(txt, x, y, a + Math.PI / 2, { font: '700 14px "FreeSerif", serif', depth: 0.45, albedo: '#2a2016' }); });
    beads(L, 178, 90, 1.8, { albedo: B, kind: 'gold', metal: 0.95, rough: 0.4, base: 0.5, peak: 0.66 });
    // Aiguille bleuie ajourée, sur le cadran.
    const hand = { albedo: '#26344f', kind: 'silver', metal: 0.95, rough: 0.25 };
    const ha = -Math.PI / 2 + 0.5;
    L.taper([P(168, ha), P(240, ha)], [5, 1], { ...hand, base: 0.7, peak: 0.86 });
    const [qx, qy] = P(206, ha); L.torus(qx, qy, 8, 8, 0, 0.4, { ...hand, base: 0.72, peak: 0.88 });
    for (const d of [-1, 1]) L.taper(spiralPts(qx + Math.cos(ha + Math.PI / 2) * d * 9, qy + Math.sin(ha + Math.PI / 2) * d * 9, 6, 1, ha, d * 1.2, 20), [2.4, 1], { ...hand, base: 0.72, peak: 0.86 });
    // Échappement au sommet : ancre et balancier.
    L.taper([[C, 6], [C, 40]], [5, 5], { albedo: '#6f7378', kind: 'silver', metal: 0.95, rough: 0.35, base: 0.7, peak: 0.86 });
    L.taper(bezierPts([C - 30, 26], [C - 12, 8], [C + 12, 8], [C + 30, 26], 20), [6, 6], { albedo: '#6f7378', kind: 'silver', metal: 0.95, rough: 0.35, base: 0.72, peak: 0.88 });
    gem(L, C, 20, 5, { color: '#8a1420', setting: 2, setKind: 'silver', setAlbedo: '#8a8e94', base: 0.86, lift: 0.14 });
    innerLip(L, 160, { kind: 'gold', metal: 0.95, rough: 0.38 }, B, 8);
    return { opening: 162, options: { seed: 17, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.65, 1.5, 1.2] }, { dir: [0.7, 0.45, 0.5], color: [0.16, 0.18, 0.28], shadow: false }], room: [0.28, 0.25, 0.21] } };
  });

  /* 19 — Masque de l'Oni : laque noire et vermillon, nuées d'or, masque de démon cornu, cordon de soie. */
  replace('rose', 'oni', 'Masque de l’Oni', (L) => {
    const lac = { kind: 'paint', metal: 0, rough: 0.16 };
    const gilt = { kind: 'gold', metal: 0.95, rough: 0.38 };
    const f = getFields();
    L.fill(ringPath(166, 240), { albedo: '#16110f', height: ringStyle(C, C, 166, 240, 0.3, 0.5, 'round'), ...lac });
    L.fill(ringPath(182, 222), { albedo: '#7c1a12', height: ringStyle(C, C, 182, 222, 0.42, 0.54, 'round'), ...lac, op: 'source-over' });
    // Nuées d'or (maki-e) en volutes sur le vermillon.
    for (let k = 0; k < 10; k += 1) {
      const a = (k / 10) * TAU + 0.2;
      const spiral = spiralPts(...P(202, a), 12, 2, a, 1.3, 30);
      L.stroke(smoothPath(spiral), 2.6, { albedo: '#c9a24e', height: 0.56, ...gilt });
      L.stroke(smoothPath([P(194, a - 0.18), P(206, a - 0.08), P(198, a + 0.04)]), 2.2, { albedo: '#c9a24e', height: 0.56, ...gilt });
    }
    // Fines craquelures de la laque.
    L.paint(ringPath(166, 240), (x, y, px) => { const v = Math.abs(sample(f.mid, x * 2.4, y * 2.4) - 0.5); const c = 1 - smooth(0.003, 0.009, v); if (c < 0.1) { px.skip = true; return; } px.rgb = [30, 20, 14]; px.alpha = c * 0.35; px.h = 1 - 0.02 * c; px.hMode = 'mul'; });
    L.stroke(circle(182), 2.4, { albedo: '#b08d45', height: 0.6, ...gilt }); L.stroke(circle(222), 2.4, { albedo: '#b08d45', height: 0.6, ...gilt });
    // Cordon de soie tressé et gland en bas.
    rope(L, 236, 9, 110, { albedo: '#5a1a22', kind: 'cloth', metal: 0, rough: 0.8, base: 0.44, peak: 0.66 });
    const [kx, ky] = P(238, Math.PI / 2);
    L.torus(kx, ky + 4, 9, 7, 0, 0.45, { albedo: '#6a1e26', base: 0.6, peak: 0.8, kind: 'cloth', rough: 0.8 });
    for (let k = -5; k <= 5; k += 1) L.stroke(poly([[kx + k * 1.6, ky + 10], [kx + k * 2.6, ky + 16]], false), 1.6, { albedo: '#5a1a22', height: 0.7, kind: 'cloth', rough: 0.9 });
    // Masque d'oni au sommet.
    const mx = C, my = 58;
    const face = smoothPath([[mx - 38, my - 22], [mx - 20, my - 34], [mx, my - 36], [mx + 20, my - 34], [mx + 38, my - 22], [mx + 42, my], [mx + 34, my + 22], [mx + 18, my + 34], [mx, my + 38], [mx - 18, my + 34], [mx - 34, my + 22], [mx - 42, my]].map(([x, y]) => [mx + (x - mx) * 1.25, my + (y - my) * 1.25]), true);
    for (const d of [-1, 1]) L.taper(bezierPts([mx + d * 26, my - 26], [mx + d * 36, my - 48], [mx + d * 52, my - 52], [mx + d * 60, my - 44], 20), (t) => 12 * (1 - t) + 1.5, { albedo: '#d8cba6', base: 0.6, peak: 0.95, kind: 'bone', rough: 0.4 });
    L.stroke(face, 6, { albedo: '#16110f', height: 0.56, op: 'source-over', ...lac });
    L.fill(face, { albedo: '#a0241a', height: domeStyle(mx, my, 48, 0.58, 0.98), ...lac, op: 'source-over' });
    for (const d of [-1, 1]) {
      L.taper([[mx + d * 6, my - 10], [mx + d * 18, my - 16], [mx + d * 32, my - 10]], [8, 5], { albedo: '#8a1c14', base: 0.9, peak: 1, ...lac });
      L.fill((ctx) => { ctx.beginPath(); ctx.ellipse(mx + d * 17, my - 3, 8, 5, d * -0.3, 0, TAU); }, { albedo: '#d9ad4a', height: 0.96, ...gilt, op: 'source-over', emissive: 'rgba(255,190,70,0.25)' });
      L.engraveFill(circle(2.4, mx + d * 17, my - 3), 0.4, { albedo: '#140a06' });
      L.taper([[mx + d * 14, my + 16], [mx + d * 16, my + 28]], [4, 0.5], { albedo: '#ece2c8', base: 0.9, peak: 1, kind: 'bone', rough: 0.3 });
    }
    L.engraveFill(smoothPath([[mx - 20, my + 12], [mx, my + 8], [mx + 20, my + 12], [mx + 14, my + 22], [mx, my + 25], [mx - 14, my + 22]], true), 0.5, { albedo: '#1a0806' });
    for (let k = -3; k <= 3; k += 1) L.stroke(poly([[mx + k * 5, my + 11], [mx + k * 5, my + 15]], false), 2.6, { albedo: '#ece2c8', height: 0.92, kind: 'bone', rough: 0.3 });
    L.dome(mx, my + 4, 6, { albedo: '#8a1c14', base: 0.9, peak: 1, ...lac });
    L.stroke(face, 1.6, { albedo: '#c9a24e', height: 0.8, ...gilt });
    innerLip(L, 160, gilt, '#9c7c3e', 7);
    return { opening: 162, options: { seed: 19, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.6, 1.45, 1.2] }, { dir: [0.7, 0.45, 0.5], color: [0.24, 0.12, 0.1], shadow: false }], room: [0.28, 0.22, 0.2], saturation: 0.9 }, portrait: { tint: 'rgba(90,20,10,0.08)' } };
  });
}(window));
