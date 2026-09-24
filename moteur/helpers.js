// Labo Eraser — outils de sculpture pour les cadres (hors application).
(function (root) {
  'use strict';
  const { C, TAU, rng, gray, domeStyle, ringStyle, linearStyle, resample, clamp01, smooth, sample, getFields, hex } = root.Relief;

  /* ---------- géométrie ---------- */
  const P = (r, a, cx = C, cy = C) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const circle = (r, cx = C, cy = C) => (ctx) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); };
  const ringPath = (r1, r2, cx = C, cy = C) => (ctx) => { ctx.beginPath(); ctx.arc(cx, cy, r2, 0, TAU); ctx.arc(cx, cy, r1, 0, TAU, true); };
  const arcPath = (r, a0, a1, cx = C, cy = C) => (ctx) => { ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); };
  const sectorPath = (r1, r2, a0, a1) => (ctx) => { ctx.beginPath(); ctx.arc(C, C, r2, a0, a1); ctx.arc(C, C, r1, a1, a0, true); ctx.closePath(); };
  const polarPts = (fn, a0 = 0, a1 = TAU, steps = 360) => { const pts = []; for (let i = 0; i <= steps; i += 1) { const a = a0 + (a1 - a0) * (i / steps); pts.push(P(fn(a), a)); } return pts; };
  const polar = (fn, a0, a1, steps) => poly(polarPts(fn, a0, a1, steps), false);
  const poly = (points, close = true) => (ctx) => { ctx.beginPath(); points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (close) ctx.closePath(); };
  // Courbe lissée passant par les milieux des segments.
  const smoothPath = (points, close = false) => (ctx) => {
    ctx.beginPath();
    const n = points.length;
    if (close) {
      const m0 = [(points[n - 1][0] + points[0][0]) / 2, (points[n - 1][1] + points[0][1]) / 2]; ctx.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i += 1) { const p = points[i], q = points[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      ctx.closePath();
    } else {
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < n - 1; i += 1) { const p = points[i], q = points[i + 1]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      ctx.lineTo(points[n - 1][0], points[n - 1][1]);
    }
  };
  const bezierPts = (p0, p1, p2, p3, n = 40) => { const out = []; for (let i = 0; i <= n; i += 1) { const t = i / n, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return out; };
  const spiralPts = (cx, cy, r0, r1, a0, turns, n = 80) => { const out = []; for (let i = 0; i <= n; i += 1) { const t = i / n; const r = r0 + (r1 - r0) * t; const a = a0 + turns * TAU * t; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`; };
  // Transformation locale : dessine `shape` dans un repère (x, y, rotation, échelle).
  const local = (x, y, rot, s, shape) => (ctx) => { ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); shape(ctx); };
  const localPts = (x, y, rot, s, pts) => pts.map(([px, py]) => [x + (px * Math.cos(rot) - py * Math.sin(rot)) * s, y + (px * Math.sin(rot) + py * Math.cos(rot)) * s]);

  /* ---------- Voronoï (pavés, croûtes, écailles) ---------- */
  function voronoi(points, cell = 24) {
    const buckets = new Map();
    const key = (bx, by) => bx * 4096 + by;
    points.forEach((p, i) => { const k = key(Math.floor(p[0] / cell), Math.floor(p[1] / cell)); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); });
    return {
      points,
      query(x, y) {
        const bx = Math.floor(x / cell), by = Math.floor(y / cell);
        let d1 = 1e9, d2 = 1e9, i1 = -1, i2 = -1;
        for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
          const list = buckets.get(key(bx + dx, by + dy)); if (!list) continue;
          for (const i of list) { const p = points[i]; const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = i; } else if (d < d2) { d2 = d; i2 = i; } }
        }
        d1 = Math.sqrt(d1); d2 = Math.sqrt(d2);
        // Distance au bord de la cellule (bissectrice entre les deux germes).
        let edge = (d2 - d1) / 2;
        if (i2 >= 0) { const a = points[i1], b = points[i2]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const nx = b[0] - a[0], ny = b[1] - a[1]; const l = Math.hypot(nx, ny) || 1; edge = ((mx - x) * nx + (my - y) * ny) / l; }
        return { i: i1, j: i2, d1, d2, edge };
      },
    };
  }
  function scatter(count, test, seed, minDist = 0) {
    const r = rng(seed); const pts = []; let guard = 0;
    while (pts.length < count && guard < count * 60) {
      guard += 1; const x = r() * 512, y = r() * 512;
      if (!test(x, y)) continue;
      if (minDist && pts.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < minDist * minDist)) continue;
      pts.push([x, y]);
    }
    return pts;
  }

  /* ---------- éléments sculptés ---------- */
  function rivet(L, x, y, r, o = {}) {
    L.dome(x, y, r + 1.4, { albedo: o.ringAlbedo || '#1b1612', base: 0.1, peak: (o.base ?? 0.4) + 0.02, kind: o.kind || 'iron', metal: 0.5, rough: 0.8, op: 'lighten' });
    L.dome(x, y, r, { albedo: o.albedo || '#57504a', base: o.base ?? 0.4, peak: o.peak ?? 0.72, kind: o.kind || 'iron', metal: o.metal ?? 0.9, rough: o.rough ?? 0.45 });
  }

  // Pierre taillée : chaton, griffes, facettes (normales) et lueur intérieure.
  function gem(L, x, y, r, o = {}) {
    const metal = { kind: o.setKind || 'gold', metal: 0.95, rough: 0.35 };
    const setting = o.setting ?? 4.5;
    if (setting) L.fill(ringPath(r - 1, r + setting, x, y), { albedo: o.setAlbedo || '#a8843e', height: ringStyle(x, y, r - 1, r + setting, (o.base ?? 0.45), (o.base ?? 0.45) + 0.28, 'round'), ...metal });
    const col = hex(o.color || '#7a1020');
    const dark = `rgb(${col[0] * 0.35 | 0},${col[1] * 0.35 | 0},${col[2] * 0.35 | 0})`;
    const lite = `rgb(${Math.min(255, col[0] * 1.35) | 0},${Math.min(255, col[1] * 1.35) | 0},${Math.min(255, col[2] * 1.35) | 0})`;
    const glass = { kind: 'glass', metal: 0, rough: o.rough ?? 0.04 };
    const top = (o.base ?? 0.45) + (o.lift ?? 0.4);
    if (o.cut === 'cabochon') {
      L.fill(circle(r, x, y), { albedo: (ctx) => { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r); g.addColorStop(0, lite); g.addColorStop(0.55, o.color || '#7a1020'); g.addColorStop(1, dark); return g; }, height: domeStyle(x, y, r, o.base ?? 0.45, top), ...glass });
    } else {
      // Taille brillant vue de dessus : table octogonale, étoiles, pavillon.
      const n = o.facets || 8; const rot = o.rot || 0; const tr = r * 0.52;
      const tbl = []; for (let k = 0; k < n; k += 1) tbl.push([x + Math.cos(rot + (k / n) * TAU) * tr, y + Math.sin(rot + (k / n) * TAU) * tr]);
      const girdle = []; for (let k = 0; k < n * 2; k += 1) girdle.push([x + Math.cos(rot + (k / (n * 2)) * TAU - Math.PI / (n * 2)) * r, y + Math.sin(rot + (k / (n * 2)) * TAU - Math.PI / (n * 2)) * r]);
      L.fill(circle(r, x, y), { albedo: dark, height: top - 0.08, ...glass, op: 'lighten' });
      for (let k = 0; k < n; k += 1) {
        const a = rot + (k / n) * TAU; const a2 = a + Math.PI / n;
        const t1 = tbl[k], t2 = tbl[(k + 1) % n];
        const g1 = girdle[(2 * k + 1) % (2 * n)], g0 = girdle[(2 * k) % (2 * n)], g2 = girdle[(2 * k + 2) % (2 * n)];
        const tilt = 0.55;
        const shade = (v) => mix(o.color || '#7a1020', v > 0 ? '#ffffff' : '#000000', Math.abs(v));
        L.fill(poly([t1, t2, g1]), { albedo: shade(0.12 * Math.cos(a2 + 2.3)), height: top - 0.02, normal: [Math.cos(a2) * tilt, Math.sin(a2) * tilt, 1], ...glass, op: 'source-over' });
        L.fill(poly([t1, g1, g0]), { albedo: shade(-0.25 + 0.2 * Math.cos(a + 2.3)), height: top - 0.05, normal: [Math.cos(a - 0.2) * 0.95, Math.sin(a - 0.2) * 0.95, 1], ...glass, op: 'source-over' });
        L.fill(poly([t2, g2, g1]), { albedo: shade(-0.3 + 0.2 * Math.cos(a2 + 0.3 + 2.3)), height: top - 0.05, normal: [Math.cos(a2 + 0.2) * 0.95, Math.sin(a2 + 0.2) * 0.95, 1], ...glass, op: 'source-over' });
      }
      L.fill(poly(tbl), { albedo: (ctx) => { const g = ctx.createRadialGradient(x - tr * 0.4, y - tr * 0.4, 0, x, y, tr * 1.3); g.addColorStop(0, lite); g.addColorStop(1, o.color || '#7a1020'); return g; }, height: top, normal: [0, 0, 1], ...glass, op: 'source-over' });
    }
    if (o.glow) L.glow((e) => { const g = e.createRadialGradient(x, y, 0, x, y, r * (o.glowSize ?? 1.1)); g.addColorStop(0, o.glow); g.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y, r * (o.glowSize ?? 1.1), 0, TAU); e.fill(); });
    if (o.prongs) for (let k = 0; k < o.prongs; k += 1) { const a = (o.rot || 0) + (k / o.prongs) * TAU + Math.PI / o.prongs; L.dome(x + Math.cos(a) * (r + 1), y + Math.sin(a) * (r + 1), Math.max(2, r * 0.2), { albedo: o.setAlbedo || '#b8924a', base: top - 0.1, peak: top + 0.08, ...metal }); }
  }

  // Crâne de face (réaliste) : s = 1 → environ 64 px de large.
  function skull(L, x, y, s, rot = 0, o = {}) {
    const bone = { kind: 'bone', metal: 0, rough: o.rough ?? 0.62 };
    const col = o.albedo || '#cbbb95';
    const base = o.base ?? 0.4, lift = o.lift ?? 0.55;
    const T = (shape) => local(x, y, rot, s, shape);
    const pt = (px, py) => localPts(x, y, rot, s, [[px, py]])[0];
    const ell = (cx, cy, rx, ry, r2, peak, b = base, al = col) => L.ellipse(...pt(cx, cy), rx * s, ry * s, rot + r2, { albedo: al, base: b, peak: base + peak * lift, ...bone });
    // Voûte, pommettes, mâchoire.
    ell(0, -16, 31, 30, 0, 1);
    ell(0, 4, 27, 18, 0, 0.72);
    ell(-22, 8, 9, 8, 0.3, 0.78); ell(22, 8, 9, 8, -0.3, 0.78);
    ell(0, 20, 17, 12, 0, 0.68);
    if (o.jaw) { ell(0, 38, 19, 9, 0, 0.62); ell(-15, 30, 5, 10, 0.3, 0.55); ell(15, 30, 5, 10, -0.3, 0.55); }
    // Arcades sourcilières.
    for (const d of [-1, 1]) L.taper(localPts(x, y, rot, s, [[d * 25, -4], [d * 18, -11], [d * 8, -10], [d * 3, -6]]), [5 * s, 3.2 * s], { albedo: col, base: base + 0.5 * lift, peak: base + 1.02 * lift, ...bone });
    // Fosses temporales.
    for (const d of [-1, 1]) L.engrave(T((ctx) => { ctx.beginPath(); ctx.moveTo(d * 29, -20); ctx.quadraticCurveTo(d * 25, -6, d * 28, 6); }), 6, 0.12);
    // Orbites : creuses et légèrement obliques.
    for (const d of [-1, 1]) {
      const orbit = T((ctx) => { ctx.beginPath(); ctx.moveTo(d * 3, -7); ctx.bezierCurveTo(d * 10, -11, d * 20, -9, d * 21, -3); ctx.bezierCurveTo(d * 22, 5, d * 15, 8, d * 9, 7); ctx.bezierCurveTo(d * 3, 6, d * 2, 0, d * 3, -7); ctx.closePath(); });
      L.engraveFill(orbit, 0.78, { albedo: o.socket || '#140d08' });
      if (o.eyes) L.glow((e) => { const [ex, ey] = pt(d * 11.5, 0.5); const g = e.createRadialGradient(ex, ey, 0, ex, ey, 6 * s); g.addColorStop(0, o.eyes); g.addColorStop(0.25, o.eyes); g.addColorStop(0.45, 'rgba(20,60,90,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = g; e.beginPath(); e.arc(ex, ey, 6 * s, 0, TAU); e.fill(); });
    }
    // Cavité nasale.
    L.engraveFill(T((ctx) => { ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-5, 7, -6, 13, -3.5, 16); ctx.lineTo(0, 14.5); ctx.lineTo(3.5, 16); ctx.bezierCurveTo(6, 13, 5, 7, 0, 5); ctx.closePath(); }), 0.72, { albedo: o.socket || '#140d08' });
    // Dents : irrégulières, quelques-unes manquantes.
    const r = rng(o.seed ?? 7);
    for (let k = -4; k <= 4; k += 1) {
      if (r() < (o.missing ?? 0.12)) { L.engraveFill(T((ctx) => { ctx.beginPath(); ctx.rect(k * 3.4 - 1.5, 22, 3, 7); }), 0.6, { albedo: '#1a120a' }); continue; }
      const w = 3.1 - Math.abs(k) * 0.12, h = 7.5 - Math.abs(k) * 0.35 + r() * 1.2;
      L.fill(T((ctx) => { ctx.beginPath(); ctx.moveTo(k * 3.4 - w / 2, 22); ctx.lineTo(k * 3.4 + w / 2, 22); ctx.lineTo(k * 3.4 + w / 2 - 0.3, 22 + h - 1); ctx.quadraticCurveTo(k * 3.4, 22 + h + 1, k * 3.4 - w / 2 + 0.3, 22 + h - 1); ctx.closePath(); }), { albedo: o.teeth || '#c9b78c', height: base + 0.62 * lift + r() * 0.04, ...bone });
      L.engrave(T((ctx) => { ctx.beginPath(); ctx.moveTo(k * 3.4 + 1.7, 21); ctx.lineTo(k * 3.4 + 1.7, 29); }), 0.9, 0.35);
    }
    if (o.jaw) for (let k = -3; k <= 3; k += 1) L.fill(T((ctx) => { ctx.beginPath(); ctx.rect(k * 3.3 - 1.4, 31, 2.8, 5.5); }), { albedo: o.teeth || '#c4b186', height: base + 0.58 * lift, ...bone });
    // Suture coronale et fêlures.
    const sut = []; for (let k = 0; k <= 14; k += 1) sut.push([-24 + k * 3.4, -30 + Math.sin(k * 0.9) * 2 + (k % 2 ? 1.6 : -1.6) + Math.abs(k - 7) * 0.9]);
    L.engrave(poly(localPts(x, y, rot, s, sut), false), 0.9, 0.35);
    for (let k = 0; k < (o.cracks ?? 2); k += 1) {
      let cx = -18 + r() * 36, cy = -40 + r() * 12; const pts = [[cx, cy]];
      for (let q = 0; q < 6; q += 1) { cx += (r() - 0.5) * 7; cy += 3 + r() * 3; pts.push([cx, cy]); }
      L.engrave(poly(localPts(x, y, rot, s, pts), false), 1.1, 0.5);
    }
  }

  // Feuille (laurier, chêne, lierre) : nervure centrale, bords légèrement relevés.
  function leaf(L, x, y, len, wid, rot, o = {}) {
    const shape = o.shape || 'laurel';
    const outline = [];
    const n = 36;
    for (let i = 0; i <= n; i += 1) {
      const t = i / n; let w;
      if (shape === 'laurel') w = Math.sin(Math.PI * Math.pow(t, 0.8)) * wid * (1 - 0.15 * t);
      else if (shape === 'oak') w = wid * (0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 3.5))) * Math.sin(Math.PI * Math.pow(t, 0.85));
      else if (shape === 'ivy') w = wid * Math.sin(Math.PI * Math.pow(t, 0.6)) * (1 + 0.35 * Math.cos(t * TAU * 1.5));
      else w = Math.sin(Math.PI * t) * wid;
      outline.push([t * len, -w / 2]);
    }
    for (let i = n; i >= 0; i -= 1) { const [px, py] = outline[i]; outline.push([px, -py * (o.asym ?? 0.95)]); }
    const pts = localPts(x, y, rot, 1, outline);
    const mat = { kind: o.kind || 'organic', metal: o.metal ?? 0, rough: o.rough ?? 0.55 };
    const b = o.base ?? 0.45, p = o.peak ?? 0.72;
    L.fill(poly(pts), { albedo: o.albedo || '#3d4a26', height: (ctx) => { const [ax, ay] = [x - Math.sin(rot) * wid, y + Math.cos(rot) * wid]; const [bx, by] = [x + Math.sin(rot) * wid, y - Math.cos(rot) * wid]; const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, gray(b + (p - b) * 0.2)); g.addColorStop(0.3, gray(b + (p - b) * 0.75)); g.addColorStop(0.5, gray(p)); g.addColorStop(0.7, gray(b + (p - b) * 0.75)); g.addColorStop(1, gray(b + (p - b) * 0.2)); return g; }, ...mat, op: o.op || 'lighten' });
    const mid = localPts(x, y, rot, 1, [[len * 0.02, 0], [len * 0.95, 0]]);
    L.engrave(poly(mid, false), o.ribWidth ?? 1.4, o.ribDepth ?? 0.25);
    if (o.veins !== false) for (let k = 1; k < 6; k += 1) { const t = k / 6.5; for (const d of [-1, 1]) L.engrave(poly(localPts(x, y, rot, 1, [[len * t, 0], [len * (t + 0.12), d * wid * 0.32]]), false), 0.8, 0.12); }
  }

  // Plume : rachis, barbes gravées, extrémité effilochée.
  function feather(L, x, y, len, wid, rot, o = {}) {
    const n = 30; const outline = [];
    const curve = o.curve ?? 0.08;
    const prof = o.profile === 'blade' ? (t) => Math.sqrt(Math.min(1, t / 0.1)) * (t > 0.74 ? Math.sqrt(Math.max(0, 1 - ((t - 0.74) / 0.26) ** 2)) : 1) * (1 - 0.12 * t) : (t) => Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), 0.6) * (1 - 0.3 * t);
    for (let i = 0; i <= n; i += 1) { const t = i / n; const w = wid * prof(t); outline.push([t * len, -w / 2 + curve * len * t * t]); }
    for (let i = n; i >= 0; i -= 1) { const t = i / n; const w = wid * prof(t) * (o.asym ?? 0.7); outline.push([t * len, w / 2 + curve * len * t * t]); }
    const pts = localPts(x, y, rot, 1, outline);
    const mat = { kind: o.kind || 'cloth', metal: o.metal ?? 0, rough: o.rough ?? 0.7 };
    const b = o.base ?? 0.45, p = o.peak ?? 0.7;
    L.fill(poly(pts), { albedo: o.albedo || '#d9cdb0', height: (ctx) => { const [ax, ay] = [x - Math.sin(rot) * wid, y + Math.cos(rot) * wid]; const [bx, by] = [x + Math.sin(rot) * wid, y - Math.cos(rot) * wid]; const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, gray(b)); g.addColorStop(0.5, gray(p)); g.addColorStop(1, gray(b)); return g; }, ...mat, op: o.op || 'lighten', emissive: o.emissive });
    if (o.edge) L.stroke(poly(pts), 2, { albedo: o.edge, keepMaterial: false, ...mat, ...o.edgeMat });
    const rachis = localPts(x, y, rot, 1, Array.from({ length: 12 }, (_, i) => { const t = i / 11; return [t * len * 0.96, curve * len * t * t + wid * 0.08]; }));
    L.taper(rachis, [wid * 0.12, 0.8], { albedo: o.rachis || o.albedo || '#e8dcc0', base: p - 0.05, peak: p + 0.12, ...mat, ...o.rachisMat });
    const r = rng(o.seed ?? 3);
    for (let k = 2; k < 22; k += 1) {
      const t = k / 23; const px = t * len, py = curve * len * t * t;
      for (const d of [-1, 1]) {
        const w = wid * (d < 0 ? 0.5 : 0.5 * (o.asym ?? 0.7)) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), 0.6);
        L.engrave(poly(localPts(x, y, rot, 1, [[px, py + d * wid * 0.06], [px + w * 0.9, py + d * w * 0.95]]), false), 0.9, 0.18 + r() * 0.1);
      }
    }
    if (o.eye) {
      const [ex, ey] = localPts(x, y, rot, 1, [[len * 0.72, curve * len * 0.5]])[0];
      o.eye(ex, ey);
    }
  }

  // Rune à branches (futhark imaginaire), dessinée autour de (0,0), hauteur h.
  function runeStrokes(r, h = 1) {
    const s = []; const top = -h / 2, bot = h / 2;
    s.push([[0, top], [0, bot]]);
    const kinds = Math.floor(r() * 7);
    const y1 = top + h * (0.1 + r() * 0.3), y2 = top + h * (0.45 + r() * 0.3);
    const w = h * 0.42;
    if (kinds === 0) { s.push([[0, y1], [w, y1 + w * 0.8]]); s.push([[0, y2], [w, y2 + w * 0.8]]); }
    else if (kinds === 1) { s.push([[0, top], [w, top + w * 0.7], [0, top + w * 1.4]]); }
    else if (kinds === 2) { s.push([[-w, y1], [w, y2]]); }
    else if (kinds === 3) { s.push([[0, y1], [w, y1 - w * 0.6]]); s.push([[0, y1], [-w, y1 - w * 0.6]]); }
    else if (kinds === 4) { s.push([[0, top + h * 0.25], [w, top], [w, bot - h * 0.3]]); }
    else if (kinds === 5) { s.push([[-w, top], [w, bot]]); s.push([[w, top], [-w, bot]]); s.length = 2; s[0] = [[-w * 0.8, top], [w * 0.8, bot]]; }
    else { s.push([[0, y1], [-w, y1 + w * 0.7]]); s.push([[0, y2], [w, y2 - w * 0.7]]); }
    return s;
  }
  function runePath(x, y, rot, h, r) {
    const strokes = runeStrokes(r, h);
    return (ctx) => { ctx.beginPath(); for (const st of strokes) { const pts = localPts(x, y, rot, 1, st); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); } };
  }

  // Sceau démoniaque (façon Goétie) : cercles, traits, croix et petits anneaux.
  function sigilPath(x, y, size, r) {
    const pts = []; const n = 4 + Math.floor(r() * 4);
    for (let k = 0; k < n; k += 1) pts.push([x + (r() - 0.5) * size, y + (r() - 0.5) * size]);
    return {
      lines: (ctx) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.moveTo(x - size * 0.5, y); ctx.lineTo(x + size * 0.5, y); ctx.moveTo(x, y - size * 0.55); ctx.lineTo(x, y + size * 0.3); },
      rings: pts.filter((_, k) => k % 2 === 0).map(([px, py]) => (ctx) => { ctx.beginPath(); ctx.arc(px, py, size * 0.07, 0, TAU); }),
      cross: (ctx) => { const [px, py] = pts[pts.length - 1]; ctx.beginPath(); ctx.moveTo(px - size * 0.1, py); ctx.lineTo(px + size * 0.1, py); ctx.moveTo(px, py - size * 0.1); ctx.lineTo(px, py + size * 0.1); },
    };
  }

  // Chaîne le long d'un tracé : maillons alternés de face et de profil.
  function chain(L, points, link, o = {}) {
    const pts = resample(points, link * 0.78);
    pts.forEach((p, k) => {
      if (k % 2 === 0) L.torus(p.x, p.y, link * 0.62, link * 0.36, p.a, 0.5, { albedo: o.albedo || '#3e3935', base: o.base ?? 0.4, peak: o.peak ?? 0.72, kind: o.kind || 'iron', metal: 0.85, rough: o.rough ?? 0.5 });
      else L.taper([[p.x - Math.cos(p.a) * link * 0.55, p.y - Math.sin(p.a) * link * 0.55], [p.x + Math.cos(p.a) * link * 0.55, p.y + Math.sin(p.a) * link * 0.55]], [link * 0.2, link * 0.2], { albedo: o.albedo || '#3e3935', base: (o.base ?? 0.4) + 0.05, peak: (o.peak ?? 0.72) + 0.06, kind: o.kind || 'iron', metal: 0.85, rough: o.rough ?? 0.5, over: true });
    });
  }

  // Écailles en rangées le long d'une bande polaire (serpent, dragon).
  function polarScales(L, r1, r2, a0, a1, o = {}) {
    const rows = o.rows || 4, per = o.per || 90;
    const f = getFields();
    L.paint(sectorPath(r1, r2, a0, a1), (x, y, px) => {
      const dx = x - C, dy = y - C; const r = Math.hypot(dx, dy); let a = Math.atan2(dy, dx); if (a < a0) a += TAU;
      const u = ((a - a0) / (a1 - a0)) * per * (o.dir || 1), v = ((r - r1) / (r2 - r1)) * rows;
      const row = Math.floor(v); const off = row % 2 ? 0.5 : 0;
      const cu = u + off; const cell = Math.floor(cu); const fu = cu - cell - 0.5, fv = v - row;
      // Écaille : arrondie vers la queue, recouvre la suivante.
      const d = Math.hypot(fu * 1.15, (fv - 0.2) * 1.0);
      const h = clamp01(1 - d * 1.35);
      const rim = smooth(0.5, 0.7, d);
      const noise = sample(f.mid, x * 2, y * 2);
      const tone = o.tone ? o.tone(row, cell, fv) : 1;
      const col = o.color(h, rim, noise, row, cell, fv);
      px.rgb = [col[0] * tone, col[1] * tone, col[2] * tone];
      px.h = (o.base ?? 0.45) + (o.lift ?? 0.3) * (0.3 + 0.7 * Math.sqrt(h)) * (1 - 0.4 * Math.sin(Math.PI * clamp01((r - r1) / (r2 - r1)) - Math.PI / 2) * 0);
      px.hMode = 'set';
      px.kind = o.kind || 'organic'; px.metal = o.metal ?? 0.2; px.rough = (o.rough ?? 0.35) + rim * 0.2;
    });
  }

  /* ---------- frises d'orfèvrerie ---------- */
  // Rang de perles.
  function beads(L, r, count, size, o = {}) {
    const a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU, full = Math.abs(a1 - a0 - TAU) < 1e-6;
    for (let k = 0; k < count; k += 1) {
      const a = a0 + (a1 - a0) * (full ? k / count : k / Math.max(1, count - 1));
      const [x, y] = P(r, a, o.cx, o.cy);
      L.dome(x, y, size, { albedo: o.albedo, base: o.base ?? 0.35, peak: o.peak ?? 0.65, kind: o.kind, metal: o.metal, rough: o.rough });
    }
  }
  // Torsade : brins obliques qui s'enroulent autour du cercle.
  function rope(L, r, width, count, o = {}) {
    const a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU;
    for (let k = 0; k < count; k += 1) {
      const a = a0 + (a1 - a0) * (k / count);
      const [x, y] = P(r, a, o.cx, o.cy);
      L.ellipse(x, y, width * 0.62, width * 0.27, a + Math.PI / 2 + (o.twist ?? 0.75), { albedo: o.albedo, base: o.base ?? 0.35, peak: o.peak ?? 0.7, kind: o.kind, metal: o.metal, rough: o.rough });
    }
    L.engrave(circle(r - width * 0.5, o.cx, o.cy), 1.2, 0.2); L.engrave(circle(r + width * 0.5, o.cx, o.cy), 1.2, 0.2);
  }
  // Godrons : lobes rayonnants, éventuellement tors.
  function gadroons(L, r1, r2, count, o = {}) {
    for (let k = 0; k < count; k += 1) {
      const a = (k / count) * TAU + (o.phase ?? 0);
      const rm = (r1 + r2) / 2; const [x, y] = P(rm, a);
      L.ellipse(x, y, (r2 - r1) / 2, rm * Math.PI / count * (o.fill ?? 0.9), a + (o.twist ?? 0), { albedo: o.albedo, base: o.base ?? 0.3, peak: o.peak ?? 0.7, kind: o.kind, metal: o.metal, rough: o.rough });
    }
  }
  // Tresse de n brins (entrelacs) avec passages dessus/dessous alternés.
  function plait(L, rMid, amp, strands, lobes, width, o = {}) {
    const fns = []; for (let s = 0; s < strands; s += 1) fns.push((a) => rMid + amp * Math.sin(lobes * a + (s * TAU) / strands + (o.phase ?? 0)));
    const draw = o.draw || ((path, over) => (o.ribbon ? L.ribbon(path, width, { ...o.style, ...(over ? { gap: o.gap ?? 5 } : { gap: 0 }) }) : L.tube(path, width, { ...o.style, ...(over ? { gap: o.gap ?? 5 } : { gap: 0 }) })));
    const a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU;
    for (const fn of fns) draw(polar(fn, a0, a1, Math.round((a1 - a0) * 160)), false);
    const crossings = [];
    const steps = 4000;
    for (let s = 0; s < strands; s += 1) for (let t = s + 1; t < strands; t += 1) {
      let prev = fns[s](a0) - fns[t](a0);
      for (let k = 1; k <= steps; k += 1) { const a = a0 + (a1 - a0) * (k / steps); const d = fns[s](a) - fns[t](a); if ((d > 0) !== (prev > 0)) crossings.push({ a, s, t }); prev = d; }
    }
    crossings.sort((p, q) => p.a - q.a);
    const span = (o.span ?? 1.6) * width / rMid;
    crossings.forEach((c, k) => {
      if (o.skip && o.skip(c.a)) return;
      const top = k % 2 ? c.s : c.t;
      draw(polar(fns[top], c.a - span, c.a + span, 24), true);
    });
    return fns;
  }
  // Rinceau courant : S successifs terminés en volutes, avec feuilles.
  function scrolls(L, r1, r2, count, o = {}) {
    const rm = (r1 + r2) / 2, amp = (r2 - r1) / 2;
    const stem = polar((a) => rm + amp * 0.45 * Math.sin(count * a), 0, TAU, 720);
    L.tube(stem, o.stem ?? 4, { albedo: o.albedo, base: o.base ?? 0.4, peak: o.peak ?? 0.72, kind: o.kind, metal: o.metal, rough: o.rough });
    for (let k = 0; k < count * 2; k += 1) {
      const a = (k / (count * 2)) * TAU + Math.PI / (count * 2);
      const side = k % 2 ? -1 : 1;
      const [bx, by] = P(rm + side * amp * 0.45, a);
      const spiral = []; const cx = bx + Math.cos(a) * side * amp * -0.1, cy = by + Math.sin(a) * side * amp * -0.1;
      for (let i = 0; i <= 40; i += 1) { const t = i / 40; const rr = amp * 0.5 * (1 - t * 0.85); const ang = a + (side > 0 ? Math.PI : 0) + t * TAU * 1.1 * side; spiral.push([cx + Math.cos(ang) * rr * 0.9, cy + Math.sin(ang) * rr * 0.9]); }
      L.taper(spiral, [(o.stem ?? 4) * 0.9, 1.2], { albedo: o.albedo, base: o.base ?? 0.4, peak: o.peak ?? 0.7, kind: o.kind, metal: o.metal, rough: o.rough });
      if (o.leaves !== false) { const [lx, ly] = P(rm, a + Math.PI / (count * 2) * 0.9); leaf(L, lx, ly, amp * 0.9, amp * 0.42, a + side * 1.2, { albedo: o.leafAlbedo || o.albedo, kind: o.kind, metal: o.metal, rough: o.rough, base: o.base ?? 0.4, peak: (o.peak ?? 0.7) - 0.05, veins: false }); }
    }
  }
  // Rayon à arête (ostensoir) : deux facettes inclinées.
  function facetRay(L, a, r0, r1, w, o = {}) {
    const [bx, by] = P(r0, a), [tx, ty] = P(r1, a);
    const px = -Math.sin(a), py = Math.cos(a);
    const l = [bx + px * w, by + py * w], rgt = [bx - px * w, by - py * w];
    const tilt = o.tilt ?? 0.55, out = o.slope ?? 0.25;
    const dx = Math.cos(a), dy = Math.sin(a);
    const mat = { kind: o.kind, metal: o.metal, rough: o.rough };
    L.fill(poly([[bx, by], l, [tx, ty]]), { albedo: o.albedo, height: o.height ?? 0.35, normal: [px * tilt + dx * out, py * tilt + dy * out, 1], ...mat, op: 'source-over' });
    L.fill(poly([[bx, by], rgt, [tx, ty]]), { albedo: o.albedo2 || o.albedo, height: o.height ?? 0.35, normal: [-px * tilt + dx * out, -py * tilt + dy * out, 1], ...mat, op: 'source-over' });
  }
  // Fond amati (poinçonné) ou hachuré dans un masque.
  function matting(L, mask, o = {}) {
    const step = o.step ?? 3.2, depth = o.depth ?? 0.08, r = rng(o.seed ?? 5);
    const f = getFields();
    L.paint(mask, (x, y, px) => {
      const gx = x / step, gy = y / step; const cx = Math.round(gx), cy = Math.round(gy);
      const jx = (sample(f.fine, cx * 7.3, cy * 3.1) - 0.5) * 0.7, jy = (sample(f.fine, cx * 2.9, cy * 5.7) - 0.5) * 0.7;
      const d = Math.hypot(gx - cx - jx, gy - cy - jy);
      const pit = 1 - smooth(0.12, 0.42, d);
      px.h = 1 - depth * pit; px.hMode = 'mul';
      if (o.darken) { px.rgb = o.darken; px.alpha = pit * 0.35; }
    });
  }
  function hatch(L, mask, spacing, angle, depth = 0.12) {
    L.paint(mask, (x, y, px) => {
      const u = x * Math.cos(angle) + y * Math.sin(angle);
      const v = ((u / spacing) % 1 + 1) % 1;
      px.h = 1 - depth * (1 - smooth(0.12, 0.35, Math.abs(v - 0.5))); px.hMode = 'mul';
    });
  }

  // Nœud fermé (triquetra, trèfle…) : croisements alternés dessus/dessous.
  function knot(L, fn, width, o = {}) {
    const n = o.samples || 700;
    const pts = []; for (let i = 0; i < n; i += 1) pts.push(fn(i / n));
    let total = 0; for (let i = 0; i < n; i += 1) { const a = pts[i], b = pts[(i + 1) % n]; total += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const inter = (p1, p2, p3, p4) => {
      const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
      if (Math.abs(d) < 1e-9) return null;
      const ua = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
      const ub = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
      return ua >= 0 && ua < 1 && ub >= 0 && ub < 1 ? [ua, ub] : null;
    };
    const crossings = [];
    for (let i = 0; i < n; i += 1) for (let j = i + 2; j < n; j += 1) {
      if ((j + 1) % n === i) continue;
      const r = inter(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n]);
      if (r) crossings.push({ ti: (i + r[0]) / n, tj: (j + r[1]) / n });
    }
    const enc = []; crossings.forEach((c, k) => { enc.push({ t: c.ti, k }); enc.push({ t: c.tj, k }); });
    enc.sort((a, b) => a.t - b.t);
    const over = new Array(crossings.length);
    enc.forEach((e, idx) => { if (idx % 2 === (o.flip ? 1 : 0) && over[e.k] === undefined) over[e.k] = e.t; });
    crossings.forEach((c, k) => { if (over[k] === undefined) over[k] = c.ti; });
    const path = (t0, t1) => (ctx) => { ctx.beginPath(); const steps = Math.max(4, Math.round((t1 - t0) * n)); for (let s = 0; s <= steps; s += 1) { const t = t0 + (t1 - t0) * (s / steps); const [x, y] = fn(((t % 1) + 1) % 1); if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y); } if (t1 - t0 >= 1) ctx.closePath(); };
    const draw = (pth, isOver) => (o.ribbon ? L.ribbon(pth, width, { ...o.style, gap: isOver ? (o.gap ?? 5) : 0 }) : L.tube(pth, width, { ...o.style, gap: isOver ? (o.gap ?? 5) : 0 }));
    draw(path(0, 1), false);
    const span = (o.spanPx ?? width * 1.8) / total;
    over.forEach((t) => draw(path(t - span, t + span), true));
    return crossings.length;
  }

  // Aile : os (bord d'attaque) le long d'un tracé, rangées de plumes d'un côté.
  function wing(L, bone, o = {}) {
    const pts = resample(bone, 1.5);
    const side = o.side ?? 1;
    const rows = o.rows || [
      { count: 11, len: [46, 96], spread: [1.35, 0.15], width: [13, 17], offset: 4 },
      { count: 9, len: [26, 40], spread: [1.15, 0.55], width: [11, 13], offset: 2 },
    ];
    let lift = 0;
    rows.forEach((row, ri) => {
      for (let i = 0; i < row.count; i += 1) {
        const t = row.count > 1 ? i / (row.count - 1) : 0;
        const tt = (row.t0 ?? 0.02) + ((row.t1 ?? 0.96) - (row.t0 ?? 0.02)) * t;
        const p = pts[Math.min(pts.length - 1, Math.round(tt * (pts.length - 1)))];
        const ang = p.a + side * lerp(row.spread[0], row.spread[1], t);
        const len = lerp(row.len[0], row.len[1], Math.pow(t, row.power ?? 1.2));
        const wid = lerp(row.width[0], row.width[1], t);
        const bx = p.x + Math.cos(p.a + side * Math.PI / 2) * (row.offset ?? 0), by = p.y + Math.sin(p.a + side * Math.PI / 2) * (row.offset ?? 0);
        const b = (o.base ?? 0.34) + lift; lift += o.stack ?? 0.004;
        feather(L, bx, by, len, wid, ang, { ...o.feather, ...row.feather, base: b, peak: b + (o.relief ?? 0.26), op: 'source-over', seed: ri * 100 + i, eye: row.eye && row.eye(i, t) });
      }
    });
    if (o.bone !== false) L.taper(bone, o.boneWidth || [11, 4], { albedo: o.boneAlbedo || '#b08a45', base: (o.base ?? 0.34) + lift, peak: (o.base ?? 0.34) + lift + 0.3, kind: 'gold', metal: 0.95, rough: 0.4, ...o.boneMat });
  }

  // Inscription répétée tout autour d'un cercle (lettres réparties régulièrement).
  function ringText(L, phrase, r, o = {}) {
    const size = o.size || 14;
    const font = o.font || `700 ${size}px "FreeSerif", "Liberation Serif", serif`;
    L.a.save(); L.a.font = font;
    const w = [...phrase].reduce((s2, ch) => s2 + L.a.measureText(ch).width + (o.spacing ?? 2), 0);
    L.a.restore();
    const reps = Math.max(1, Math.floor((TAU * r) / w));
    const text = phrase.repeat(reps);
    const chars = [...text];
    L.a.save(); L.a.font = font; const widths = chars.map((ch) => L.a.measureText(ch).width); L.a.restore();
    const total = widths.reduce((s2, x) => s2 + x, 0);
    const gap = (TAU * r - total) / chars.length;
    let ang = o.start ?? -Math.PI / 2;
    chars.forEach((ch, k) => {
      const wa = (widths[k] + gap) / r; const mid = ang + wa / 2;
      if (ch !== ' ') L.text(ch, C + Math.cos(mid) * r, C + Math.sin(mid) * r, mid + Math.PI / 2, { ...o, font });
      ang += wa;
    });
  }

  // Aile héraldique « éployée » : éventail de plumes rayonnant depuis l'épaule.
  // rows : du rang extérieur (rémiges longues) au rang intérieur (couvertures), dessinés dans cet ordre.
  function fanWing(L, pivot, a0, a1, rows, o = {}) {
    let lift = 0;
    rows.forEach((row, ri) => {
      for (let i = 0; i < row.count; i += 1) {
        const t = row.count > 1 ? i / (row.count - 1) : 0;
        const k = o.reverse ? 1 - t : t;
        const ang = a0 + (a1 - a0) * k;
        const len = lerp(row.len[0], row.len[1], Math.pow(k, row.power ?? 1));
        const wid = lerp(row.width[0], row.width[1], k);
        const r0 = row.r0 ?? 0;
        const bx = pivot[0] + Math.cos(ang) * r0, by = pivot[1] + Math.sin(ang) * r0;
        const b = (o.base ?? 0.3) + lift; lift += o.stack ?? 0.005;
        feather(L, bx, by, len, wid, ang, { ...o.feather, ...row.feather, base: b, peak: b + (o.relief ?? 0.28), op: 'source-over', seed: ri * 100 + i, curve: (row.curve ?? 0.04) * (o.curveSign ?? 1), eye: row.eye && row.eye(i, t) });
      }
    });
    return lift;
  }

  root.Helpers = { fanWing, ringText, knot, wing, beads, rope, gadroons, plait, scrolls, facetRay, matting, hatch, P, circle, ringPath, arcPath, sectorPath, polar, polarPts, poly, smoothPath, bezierPts, spiralPts, lerp, mix, local, localPts, voronoi, scatter, rivet, gem, skull, leaf, feather, runeStrokes, runePath, sigilPath, chain, polarScales };
}(window));
