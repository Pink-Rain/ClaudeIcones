// Labo Eraser — moteur de rendu en relief (hors application).
// Chaque élément est « sculpté » dans cinq calques : couleur (albédo), hauteur,
// matière (métal, rugosité, type), normale de base et émission. L'éclairage est
// calculé pixel par pixel : lumières directionnelles avec ombres portées, lumières
// ponctuelles, reflets d'environnement, occlusion dans les creux, puis
// vieillissement propre à chaque matière et étalonnage « ancien ».
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const SIZE = 512;
  const C = 256;
  const N = SIZE * SIZE;

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- bruits ---------- */
  function valueNoise(size, cell, seed) {
    const r = rng(seed);
    const gw = Math.floor(size / cell) + 3;
    const grid = new Float32Array(gw * gw);
    for (let i = 0; i < grid.length; i += 1) grid[i] = r();
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y += 1) {
      const gy = y / cell; const y0 = Math.floor(gy); let fy = gy - y0; fy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < size; x += 1) {
        const gx = x / cell; const x0 = Math.floor(gx); let fx = gx - x0; fx = fx * fx * (3 - 2 * fx);
        const a = grid[y0 * gw + x0], b = grid[y0 * gw + x0 + 1], c = grid[(y0 + 1) * gw + x0], d = grid[(y0 + 1) * gw + x0 + 1];
        out[y * size + x] = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
      }
    }
    return out;
  }
  function fbm(size, cell, octaves, seed) {
    const out = new Float32Array(size * size);
    let amp = 1, total = 0, c = cell;
    for (let o = 0; o < octaves; o += 1) {
      const n = valueNoise(size, Math.max(1, c), seed + o * 7919);
      for (let i = 0; i < out.length; i += 1) out[i] += n[i] * amp;
      total += amp; amp *= 0.5; c /= 2;
    }
    for (let i = 0; i < out.length; i += 1) out[i] /= total;
    return out;
  }
  let fields = null;
  function getFields() {
    if (!fields) fields = { low: fbm(SIZE, 128, 4, 11), mid: fbm(SIZE, 32, 4, 23), high: fbm(SIZE, 7, 3, 37), fine: valueNoise(SIZE, 1.6, 53), grain: valueNoise(SIZE, 1, 71) };
    return fields;
  }
  // Échantillonnage bilinéaire d'un champ, répété à l'infini.
  function sample(field, x, y) {
    const fx = ((x % SIZE) + SIZE) % SIZE, fy = ((y % SIZE) + SIZE) % SIZE;
    const x0 = fx | 0, y0 = fy | 0, x1 = (x0 + 1) % SIZE, y1 = (y0 + 1) % SIZE, tx = fx - x0, ty = fy - y0;
    const a = field[y0 * SIZE + x0], b = field[y0 * SIZE + x1], c = field[y1 * SIZE + x0], d = field[y1 * SIZE + x1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  }

  function blur1(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h), k = 1 / (2 * r + 1);
    for (let y = 0; y < h; y += 1) {
      const row = y * w; let acc = 0;
      for (let x = -r; x <= r; x += 1) acc += src[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x += 1) {
        tmp[row + x] = acc * k;
        acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x += 1) {
      let acc = 0;
      for (let y = -r; y <= r; y += 1) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y += 1) {
        out[y * w + x] = acc * k;
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }

  /* ---------- styles ---------- */
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const gray = (v) => { const g = Math.round(clamp01(v) * 255); return `rgb(${g},${g},${g})`; };
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const KIND = { plain: 0, gold: 1, bronze: 2, iron: 3, silver: 4, stone: 5, bone: 6, wood: 7, cloth: 8, glass: 9, obsidian: 10, leather: 11, organic: 12, paint: 13, wax: 14, ice: 9 };
  const kindOf = (k) => (typeof k === 'number' ? k : KIND[k] ?? 0);
  const matStyle = (o) => `rgb(${Math.round((o.metal ?? 0) * 255)},${Math.round((o.rough ?? 0.6) * 255)},${kindOf(o.kind) * 18})`;
  const normStyle = (n) => { const l = Math.hypot(n[0], n[1], n[2]); return `rgb(${Math.round((n[0] / l * 0.5 + 0.5) * 255)},${Math.round((n[1] / l * 0.5 + 0.5) * 255)},${Math.round((n[2] / l * 0.5 + 0.5) * 255)})`; };
  const resolve = (ctx, s) => (typeof s === 'function' ? s(ctx) : s);
  const hex = (c) => { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };

  function domeStyle(x, y, r, base, peak) {
    return (ctx) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      for (let i = 0; i <= 12; i += 1) { const t = i / 12; g.addColorStop(t, gray(base + (peak - base) * Math.sqrt(Math.max(0, 1 - t * t)))); }
      return g;
    };
  }
  // Profil d'un anneau : round (demi-jonc), bevel (plat chanfreiné), cove (gorge), outerSlope, innerSlope.
  function ringStyle(cx, cy, r1, r2, base, peak, profile = 'round') {
    return (ctx) => {
      const g = ctx.createRadialGradient(cx, cy, r1, cx, cy, r2);
      for (let i = 0; i <= 24; i += 1) {
        const u = i / 24; let v;
        if (typeof profile === 'function') v = profile(u);
        else if (profile === 'round') v = Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
        else if (profile === 'bevel') v = Math.min(1, Math.min(u, 1 - u) * 7);
        else if (profile === 'cove') v = 1 - 0.55 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) * (Math.min(u, 1 - u) > 0.08 ? 1 : Math.min(u, 1 - u) / 0.08);
        else if (profile === 'outerSlope') v = Math.min(1, u * 5) * (1 - Math.max(0, u - 0.3) * 0.6);
        else v = Math.min(1, (1 - u) * 5) * (1 - Math.max(0, 0.7 - u) * 0.6);
        g.addColorStop(u, gray(base + (peak - base) * v));
      }
      return g;
    };
  }
  function linearStyle(x1, y1, x2, y2, stops) {
    return (ctx) => { const g = ctx.createLinearGradient(x1, y1, x2, y2); stops.forEach(([t, v]) => g.addColorStop(t, typeof v === 'number' ? gray(v) : v)); return g; };
  }

  // Rééchantillonne une ligne brisée tous les `step` pixels : [{x, y, t, a}] (a = direction).
  function resample(points, step = 1.5) {
    const out = []; let total = 0; const lens = [0];
    for (let i = 1; i < points.length; i += 1) { total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]); lens.push(total); }
    if (!total) return [{ x: points[0][0], y: points[0][1], t: 0, a: 0 }];
    const n = Math.max(2, Math.ceil(total / step));
    let seg = 1;
    for (let k = 0; k <= n; k += 1) {
      const d = (k / n) * total;
      while (seg < points.length - 1 && lens[seg] < d) seg += 1;
      const l0 = lens[seg - 1], l1 = lens[seg], u = l1 > l0 ? (d - l0) / (l1 - l0) : 0;
      const [x0, y0] = points[seg - 1], [x1, y1] = points[seg];
      out.push({ x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, t: d / total, a: Math.atan2(y1 - y0, x1 - x0) });
    }
    return out;
  }

  /* ---------- calques ---------- */
  function createLayers() {
    const make = () => { const c = document.createElement('canvas'); c.width = c.height = SIZE; return c; };
    const L = { A: make(), H: make(), M: make(), N: make(), E: make() };
    const opts = { willReadFrequently: true };
    L.a = L.A.getContext('2d', opts); L.h = L.H.getContext('2d', opts); L.m = L.M.getContext('2d', opts); L.n = L.N.getContext('2d', opts); L.e = L.E.getContext('2d', opts);
    L.h.fillStyle = '#000'; L.h.fillRect(0, 0, SIZE, SIZE);
    L.n.fillStyle = 'rgb(128,128,255)'; L.n.fillRect(0, 0, SIZE, SIZE);

    L.fill = function fill(path, o) {
      const rule = o.rule || 'nonzero';
      const run = (ctx, style, op) => {
        ctx.save();
        if (op) ctx.globalCompositeOperation = op;
        if (o.alpha !== undefined && ctx === L.a) ctx.globalAlpha = o.alpha;
        if (o.clip) { ctx.save(); o.clip(ctx); ctx.restore(); ctx.clip(o.clipRule || 'nonzero'); }
        path(ctx);
        ctx.fillStyle = resolve(ctx, style);
        ctx.fill(rule);
        ctx.restore();
      };
      if (o.albedo !== undefined) run(L.a, o.albedo, o.albedoOp);
      if (o.height !== undefined) run(L.h, typeof o.height === 'number' ? gray(o.height) : o.height, o.op || 'lighten');
      if (o.albedo !== undefined && !o.keepMaterial) run(L.m, matStyle(o));
      if (o.normal) run(L.n, normStyle(o.normal));
      if (o.emissive) run(L.e, o.emissive, 'lighter');
    };
    L.stroke = function stroke(path, width, o) {
      const run = (ctx, style, op, w = width) => {
        ctx.save();
        if (op) ctx.globalCompositeOperation = op;
        if (o.alpha !== undefined && ctx === L.a) ctx.globalAlpha = o.alpha;
        if (o.clip) { ctx.save(); o.clip(ctx); ctx.restore(); ctx.clip(o.clipRule || 'nonzero'); }
        ctx.lineCap = o.cap || 'round'; ctx.lineJoin = o.join || 'round';
        if (o.dash) ctx.setLineDash(o.dash);
        path(ctx);
        ctx.lineWidth = w; ctx.strokeStyle = resolve(ctx, style); ctx.stroke();
        ctx.restore();
      };
      if (o.albedo !== undefined) run(L.a, o.albedo, o.albedoOp);
      if (o.height !== undefined) run(L.h, typeof o.height === 'number' ? gray(o.height) : o.height, o.op || 'lighten');
      if (o.albedo !== undefined && !o.keepMaterial) run(L.m, matStyle(o));
      if (o.normal) run(L.n, normStyle(o.normal));
      if (o.emissive) run(L.e, o.emissive, 'lighter', o.emissiveWidth || width);
    };
    // Un boudin (serpent, liane, corne, chaîne…) : profil arrondi sur toute sa largeur.
    L.tube = function tube(path, width, o) {
      const base = o.base ?? 0.3, peak = o.peak ?? 0.8, steps = o.steps ?? 9;
      if (o.gap) L.stroke(path, width + o.gap, { albedo: o.gapAlbedo ?? 'rgba(0,0,0,0)', height: o.gapHeight ?? 0.1, op: 'source-over', kind: o.gapKind ?? o.kind, metal: o.gapMetal ?? o.metal, rough: o.gapRough ?? o.rough, clip: o.clip });
      L.stroke(path, width, { ...o, height: undefined });
      const h = L.h;
      h.save();
      if (o.clip) { h.save(); o.clip(h); h.restore(); h.clip(); }
      h.globalCompositeOperation = o.op || (o.gap ? 'source-over' : 'lighten');
      h.lineCap = o.cap || 'round'; h.lineJoin = 'round';
      for (let k = 0; k <= steps; k += 1) {
        const u = 1 - k / steps;
        h.save();
        path(h);
        h.lineWidth = Math.max(0.7, width * u);
        h.strokeStyle = gray(base + (peak - base) * (o.profile ? o.profile(1 - u) : Math.sqrt(Math.max(0, 1 - u * u))));
        h.stroke();
        h.restore();
      }
      h.restore();
    };
    L.dome = function dome(x, y, r, o) {
      L.fill((ctx) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }, { ...o, height: domeStyle(x, y, r, o.base ?? 0.3, o.peak ?? 0.8) });
    };
    // Dôme elliptique orienté : le dégradé suit la même transformation que la forme.
    L.ellipse = function ellipse(x, y, rx, ry, rotation, o) {
      const path = (ctx) => { ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(rx, ry); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); };
      L.fill(path, { ...o, height: o.flat !== undefined ? o.flat : domeStyle(0, 0, 1, o.base ?? 0.3, o.peak ?? 0.8) });
    };
    // Anneau torique elliptique (maillon, œillet, bague).
    L.torus = function torus(x, y, rx, ry, rotation, thick, o) {
      const inner = Math.max(0.05, 1 - thick);
      const path = (ctx) => { ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(rx, ry); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.arc(0, 0, inner, 0, TAU, true); };
      L.fill(path, { ...o, rule: 'evenodd', height: ringStyle(0, 0, inner, 1, o.base ?? 0.3, o.peak ?? 0.8, o.profile || 'round') });
    };
    // Forme effilée le long d'un tracé : corne, griffe, tentacule, racine, épine.
    // width(t) donne la largeur en chaque point (t de 0 à 1). `over` : passe au-dessus du relief existant.
    L.taper = function taper(points, width, o = {}) {
      const wf = typeof width === 'function' ? width : (t) => width[0] + (width[1] - width[0]) * t;
      const pts = resample(points, o.step ?? 1.2);
      const base = o.base ?? 0.3;
      const peakF = typeof o.peak === 'function' ? o.peak : () => (o.peak ?? 0.85);
      const target = o.over ? make() : null;
      const h = target ? target.getContext('2d') : L.h;
      const circles = (ctx, grow, style) => { for (const p of pts) { const r = Math.max(0.4, wf(p.t) / 2 + grow); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fillStyle = style(p, r); ctx.fill(); } };
      if (o.gap) {
        L.a.save(); if (o.gapAlbedo) circles(L.a, o.gap / 2, () => o.gapAlbedo); L.a.restore();
        L.h.save(); circles(L.h, o.gap / 2, () => gray(o.gapHeight ?? 0.12)); L.h.restore();
      }
      if (o.albedo !== undefined) { L.a.save(); if (o.alpha !== undefined) L.a.globalAlpha = o.alpha; circles(L.a, 0, (p) => (typeof o.albedo === 'function' ? o.albedo(p.t) : o.albedo)); L.a.restore(); }
      if (!o.keepMaterial) { L.m.save(); circles(L.m, 0, () => matStyle(o)); L.m.restore(); }
      if (o.emissive) { L.e.save(); L.e.globalCompositeOperation = 'lighter'; circles(L.e, (o.emissiveGrow ?? 0), (p) => (typeof o.emissive === 'function' ? o.emissive(p.t) : o.emissive)); L.e.restore(); }
      h.save(); h.globalCompositeOperation = 'lighten';
      circles(h, 0, (p, r) => domeStyle(p.x, p.y, r, base, peakF(p.t))(h));
      h.restore();
      if (target) { L.h.save(); L.h.globalCompositeOperation = o.gap ? 'source-over' : 'lighten'; L.h.drawImage(target, 0, 0); L.h.restore(); }
      return pts;
    };
    // Gravure : sillon creusé dans la hauteur (et éventuellement lumineux).
    L.engrave = function engrave(path, width, depth = 0.3, o = {}) {
      const h = L.h;
      h.save(); h.globalCompositeOperation = 'multiply'; h.lineCap = o.cap || 'round'; h.lineJoin = 'round';
      if (o.clip) { h.save(); o.clip(h); h.restore(); h.clip(); }
      if (o.dash) h.setLineDash(o.dash);
      const passes = 3;
      for (let k = 0; k < passes; k += 1) { h.save(); path(h); h.lineWidth = Math.max(0.6, width * (1 - k / passes)); h.strokeStyle = gray(1 - depth / passes); h.stroke(); h.restore(); }
      h.restore();
      if (o.albedo) L.stroke(path, width * 0.8, { albedo: o.albedo, keepMaterial: !o.kind, kind: o.kind, metal: o.metal, rough: o.rough, dash: o.dash, albedoOp: o.albedoOp, clip: o.clip });
      if (o.emissive) { const e = L.e; e.save(); e.globalCompositeOperation = 'lighter'; e.lineCap = 'round'; e.lineJoin = 'round'; if (o.dash) e.setLineDash(o.dash); path(e); e.lineWidth = o.emissiveWidth || width * 0.7; e.strokeStyle = o.emissive; e.stroke(); e.restore(); }
    };
    // Ruban plat chanfreiné (entrelacs, cerclages) : deux arêtes et un plateau.
    L.ribbon = function ribbon(path, width, o) {
      if (o.gap) L.stroke(path, width + o.gap, { albedo: o.gapAlbedo, height: o.gapHeight ?? 0.12, op: 'source-over', kind: o.kind, metal: o.metal, rough: o.rough });
      L.stroke(path, width, { albedo: o.albedo, kind: o.kind, metal: o.metal, rough: o.rough });
      const h = L.h; h.save(); h.globalCompositeOperation = o.gap ? 'source-over' : 'lighten'; h.lineCap = 'round'; h.lineJoin = 'round';
      const base = o.base ?? 0.3, peak = o.peak ?? 0.8, steps = 7;
      for (let k = 0; k <= steps; k += 1) { h.save(); path(h); h.lineWidth = Math.max(0.8, width * (1 - 0.34 * k / steps)); h.strokeStyle = gray(base + (peak - base) * Math.sin((k / steps) * Math.PI / 2)); h.stroke(); h.restore(); }
      h.restore();
      if (o.groove !== false) L.engrave(path, Math.max(1.4, width * 0.16), o.grooveDepth ?? 0.2);
    };
    L.engraveFill = function engraveFill(path, depth = 0.3, o = {}) {
      const h = L.h; h.save(); h.globalCompositeOperation = 'multiply'; path(h); h.fillStyle = gray(1 - depth); h.fill(o.rule || 'nonzero'); h.restore();
      if (o.albedo) L.fill(path, { albedo: o.albedo, keepMaterial: !o.kind, kind: o.kind, metal: o.metal, rough: o.rough, rule: o.rule });
      if (o.emissive) { const e = L.e; e.save(); e.globalCompositeOperation = 'lighter'; path(e); e.fillStyle = o.emissive; e.fill(o.rule || 'nonzero'); e.restore(); }
    };
    L.glow = function glow(draw) { const e = L.e; e.save(); e.globalCompositeOperation = 'lighter'; draw(e); e.restore(); };

    // Texte gravé (depth) ou en relief (raise) ; x, y au centre de la lettre.
    L.text = function text(str, x, y, rotation, o = {}) {
      const font = o.font || `600 ${o.size || 16}px "Cinzel", "Trajan Pro", "Times New Roman", serif`;
      const draw = (ctx, style, op) => { ctx.save(); if (op) ctx.globalCompositeOperation = op; ctx.translate(x, y); ctx.rotate(rotation); ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = style; ctx.fillText(str, 0, 0); ctx.restore(); };
      if (o.depth) { for (let k = 0; k < 2; k += 1) draw(L.h, gray(1 - o.depth / 2), 'multiply'); }
      if (o.raise !== undefined) draw(L.h, gray(o.raise), 'lighten');
      if (o.albedo) draw(L.a, o.albedo);
      if (o.albedo && o.kind) draw(L.m, matStyle(o));
      if (o.emissive) draw(L.e, o.emissive, 'lighter');
    };
    // Inscription sur un cercle, centrée sur l'angle a (sens horaire), lettres tournées vers l'extérieur.
    L.inscribe = function inscribe(str, r, a, o = {}) {
      const size = o.size || 16;
      const font = o.font || `600 ${size}px "Cinzel", "Trajan Pro", "Times New Roman", serif`;
      L.a.save(); L.a.font = font; const widths = [...str].map((ch) => L.a.measureText(ch).width + (o.spacing ?? 2)); L.a.restore();
      const total = widths.reduce((s, w) => s + w, 0) / r;
      let ang = o.start !== undefined ? o.start : a - total / 2;
      [...str].forEach((ch, k) => {
        const w = widths[k] / r; const mid = ang + w / 2;
        if (ch !== ' ') L.text(ch, C + Math.cos(mid) * r, C + Math.sin(mid) * r, mid + Math.PI / 2, { ...o, font });
        ang += w;
      });
      return ang;
    };

    // Peinture pixel par pixel dans un masque : fn(x, y, px) remplit px.
    // px.rgb [r,g,b] 0-255 (px.alpha 0-1), px.h (hauteur, px.hMode 'max' | 'set' | 'add' | 'mul'),
    // px.metal, px.rough, px.kind, px.e [r,g,b] (émission), px.n [x,y,z] ; px.H et px.mask sont lus.
    L.paint = function paint(mask, fn, o = {}) {
      const mc = make(); const mx = mc.getContext('2d', opts);
      mx.fillStyle = '#fff';
      if (mask) { mask(mx); mx.fill(o.rule || 'nonzero'); } else mx.fillRect(0, 0, SIZE, SIZE);
      const md = mx.getImageData(0, 0, SIZE, SIZE).data;
      const Ai = L.a.getImageData(0, 0, SIZE, SIZE), Hi = L.h.getImageData(0, 0, SIZE, SIZE), Mi = L.m.getImageData(0, 0, SIZE, SIZE), Ni = L.n.getImageData(0, 0, SIZE, SIZE), Ei = L.e.getImageData(0, 0, SIZE, SIZE);
      const A = Ai.data, H = Hi.data, M = Mi.data, Nn = Ni.data, E = Ei.data;
      const px = {};
      for (let y = 0; y < SIZE; y += 1) {
        for (let x = 0; x < SIZE; x += 1) {
          const i = y * SIZE + x, q = i * 4;
          const m = md[q + 3] / 255;
          if (!m) continue;
          px.rgb = undefined; px.alpha = 1; px.h = undefined; px.hMode = o.hMode || 'max'; px.metal = undefined; px.rough = undefined; px.kind = undefined; px.e = undefined; px.n = undefined;
          px.H = H[q] / 255; px.mask = m; px.A = A[q + 3] / 255; px.skip = false;
          fn(x, y, px);
          if (px.skip) continue;
          if (px.rgb) {
            const t = m * px.alpha;
            A[q] += (px.rgb[0] - A[q]) * t; A[q + 1] += (px.rgb[1] - A[q + 1]) * t; A[q + 2] += (px.rgb[2] - A[q + 2]) * t;
            A[q + 3] = Math.max(A[q + 3], t * 255);
          }
          if (px.h !== undefined) {
            const v = clamp01(px.h) * 255;
            if (px.hMode === 'max') H[q] = Math.max(H[q], H[q] + (v - H[q]) * m);
            else if (px.hMode === 'set') H[q] += (v - H[q]) * m;
            else if (px.hMode === 'add') H[q] = Math.min(255, Math.max(0, H[q] + px.h * 255 * m));
            else if (px.hMode === 'mul') H[q] *= 1 - (1 - clamp01(px.h)) * m;
            H[q + 1] = H[q + 2] = H[q]; H[q + 3] = 255;
          }
          if (px.metal !== undefined || px.rough !== undefined || px.kind !== undefined) {
            if (m > 0.35) {
              if (px.metal !== undefined) M[q] = px.metal * 255;
              if (px.rough !== undefined) M[q + 1] = px.rough * 255;
              if (px.kind !== undefined) M[q + 2] = kindOf(px.kind) * 18;
              M[q + 3] = 255;
            }
          }
          if (px.e) { E[q] = Math.min(255, E[q] + px.e[0] * m); E[q + 1] = Math.min(255, E[q + 1] + px.e[1] * m); E[q + 2] = Math.min(255, E[q + 2] + px.e[2] * m); E[q + 3] = 255; }
          if (px.n) {
            const l = Math.hypot(px.n[0], px.n[1], px.n[2]) || 1;
            Nn[q] += ((px.n[0] / l * 0.5 + 0.5) * 255 - Nn[q]) * m; Nn[q + 1] += ((px.n[1] / l * 0.5 + 0.5) * 255 - Nn[q + 1]) * m; Nn[q + 2] += ((px.n[2] / l * 0.5 + 0.5) * 255 - Nn[q + 2]) * m;
          }
        }
      }
      L.a.putImageData(Ai, 0, 0); L.h.putImageData(Hi, 0, 0); L.m.putImageData(Mi, 0, 0); L.n.putImageData(Ni, 0, 0); L.e.putImageData(Ei, 0, 0);
    };
    L.make = make;
    return L;
  }

  /* ---------- rendu ---------- */
  const lin = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) lin[i] = Math.pow(i / 255, 2.2);
  const toSrgb = (v) => Math.round(255 * Math.pow(clamp01(v), 1 / 2.2));
  const aces = (x) => { const v = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return v < 0 ? 0 : v; };

  const DEFAULTS = {
    heightScale: 40,
    lights: [
      { dir: [-0.5, -0.6, 0.62], color: [1.75, 1.45, 1.08] },
      { dir: [0.72, 0.42, 0.52], color: [0.14, 0.2, 0.34], shadow: false },
    ],
    ambient: [0.05, 0.046, 0.042],
    // Environnement reflété par les métaux : la pièce devant l'objet, et une grande
    // boîte à lumière dans la direction de chaque lumière directionnelle.
    room: [0.34, 0.29, 0.22], envKey: 0.8,
    exposure: 1.05,
    saturation: 0.78, tint: [1.03, 0.99, 0.91], contrast: 1.08,
    ao: 2.6, aoMin: 0.3, lift: 0.012, seed: 0, bloom: 1,
    shadow: 0.85, shadowSoft: 0.1, shadowHeight: 0.38, groundHeight: -0.35, portraitShadow: 0.8, dropShadow: 0.45,
    glint: 0.45, grain: 0.035, wear: 1, sheen: 1,
  };

  // Ombres portées par une lumière directionnelle sur le champ de hauteur.
  function shadowField(Hs, alive, dir, hs, groundH, soft) {
    const out = new Float32Array(N).fill(1);
    const lxy = Math.hypot(dir[0], dir[1]);
    if (lxy < 1e-3) return out;
    const sx = dir[0] / lxy, sy = dir[1] / lxy, slope = dir[2] / lxy;
    let maxH = 0; for (let i = 0; i < N; i += 1) if (alive[i] && Hs[i] > maxH) maxH = Hs[i];
    maxH *= hs;
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const i = y * SIZE + x;
        const h0 = alive[i] ? Hs[i] * hs : groundH * hs;
        let s = 1, t = 1;
        for (;;) {
          const ray = h0 + t * slope;
          if (ray > maxH) break;
          const px = (x + sx * t + 0.5) | 0, py = (y + sy * t + 0.5) | 0;
          if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) break;
          const j = py * SIZE + px;
          if (alive[j]) {
            const occ = (ray + 0.35 - Hs[j] * hs) / (soft * t + 0.6);
            if (occ < s) { s = occ; if (s <= 0) { s = 0; break; } }
          }
          t += t < 20 ? 1 : 1.6;
        }
        out[i] = s * s * (3 - 2 * s);
      }
    }
    return out;
  }

  function render(L, options = {}) {
    const o = { ...DEFAULTS, ...options };
    const f = getFields();
    const A = L.a.getImageData(0, 0, SIZE, SIZE).data;
    const Hd = L.h.getImageData(0, 0, SIZE, SIZE).data;
    const M = L.m.getImageData(0, 0, SIZE, SIZE).data;
    const Nm = L.n.getImageData(0, 0, SIZE, SIZE).data;
    const off = Math.round((o.seed * 97) % SIZE);
    const at = (x, y) => ((y + off) % SIZE) * SIZE + ((x + off * 3) % SIZE);

    const alive = new Uint8Array(N);
    const H0 = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      let h = Hd[i * 4] / 255;
      if (A[i * 4 + 3] > 8) {
        alive[i] = 1;
        const kind = Math.round(M[i * 4 + 2] / 18);
        const x = i % SIZE, y = (i / SIZE) | 0, j = at(x, y);
        const hi = f.high[j] - 0.5, mid = f.mid[j] - 0.5, fine = f.fine[j] - 0.5;
        if (kind === 1) h += fine * 0.005 + hi * 0.006;
        else if (kind === 2) h += hi * 0.02 + fine * 0.006;
        else if (kind === 3) h += hi * 0.03 + fine * 0.02 + Math.max(0, mid) * 0.02;
        else if (kind === 4) h += fine * 0.004;
        else if (kind === 5) h += mid * 0.07 + hi * 0.05 + fine * 0.025;
        else if (kind === 6) h += hi * 0.02 + fine * 0.006;
        else if (kind === 7) h += fine * 0.012;
        else if (kind === 8) h += Math.sin(x * 2.1) * Math.sin(y * 2.1) * 0.004 + hi * 0.012;
        else if (kind === 11) h += hi * 0.016 + fine * 0.012;
        else if (kind === 12) h += fine * 0.004 + hi * 0.006;
        else if (kind === 13) h += fine * 0.008;
        else if (kind === 14) h += hi * 0.01;
      }
      H0[i] = h;
    }
    const Hs = blur1(H0, SIZE, SIZE, 1);
    const Hb = blur1(blur1(Hs, SIZE, SIZE, 6), SIZE, SIZE, 6);
    const Hshadow = blur1(Hs, SIZE, SIZE, 1);

    const hs = o.heightScale;
    const lights = o.lights.map((l) => {
      if (l.pos) return l;
      const d = Math.hypot(l.dir[0], l.dir[1], l.dir[2]);
      const dir = [l.dir[0] / d, l.dir[1] / d, l.dir[2] / d];
      const shadow = o.shadow && l.shadow !== false ? shadowField(Hshadow, alive, dir, hs * o.shadowHeight, o.groundHeight, o.shadowSoft) : null;
      return { dir, color: l.color, shadow, env: l.env ?? 1 };
    });
    const image = new ImageData(SIZE, SIZE);
    const O = image.data;
    const [amR, amG, amB] = o.ambient, [rmR, rmG, rmB] = o.room;
    const wearK = o.wear;

    for (let y = 1; y < SIZE - 1; y += 1) {
      for (let x = 1; x < SIZE - 1; x += 1) {
        const i = y * SIZE + x;
        const alpha = A[i * 4 + 3];
        if (!alive[i]) continue;
        const gx = (Hs[i + 1] - Hs[i - 1]) * 0.5 * hs;
        const gy = (Hs[i + SIZE] - Hs[i - SIZE]) * 0.5 * hs;
        let nx = Nm[i * 4] / 127.5 - 1 - gx, ny = Nm[i * 4 + 1] / 127.5 - 1 - gy, nz = Nm[i * 4 + 2] / 127.5 - 1;
        const nl = 1 / Math.hypot(nx, ny, nz); nx *= nl; ny *= nl; nz *= nl;
        const kind = Math.round(M[i * 4 + 2] / 18);
        let metal = M[i * 4] / 255, rough = M[i * 4 + 1] / 255;
        let r = lin[A[i * 4]], g = lin[A[i * 4 + 1]], b = lin[A[i * 4 + 2]];
        const cav = Math.max(0, Hb[i] - Hs[i]), conv = Math.max(0, Hs[i] - Hb[i]);
        const j = at(x, y);
        const low = f.low[j], mid = f.mid[j], hi = f.high[j], fine = f.fine[j];

        // Vieillissement propre à chaque matière.
        if (kind === 1) {
          // Dorure à la feuille usée : l'assiette rouge sombre apparaît sur les reliefs frottés.
          const rub = smooth(0.006, 0.03, conv) * smooth(0.5, 0.66, mid) * smooth(0.35, 0.75, hi);
          const wear = clamp01((rub * 1.2 + smooth(0.84, 0.9, hi) * 0.25 * smooth(0.5, 0.7, low)) * wearK);
          r += (0.1 - r) * wear; g += (0.032 - g) * wear; b += (0.016 - b) * wear;
          metal *= 1 - wear * 0.85; rough += (0.75 - rough) * wear;
          const grime = smooth(0.004, 0.05, cav);
          r *= 1 - 0.62 * grime; g *= 1 - 0.64 * grime; b *= 1 - 0.66 * grime; rough += (0.9 - rough) * grime;
          rough = clamp01(rough + (fine - 0.5) * 0.2 + (mid - 0.5) * 0.3);
        } else if (kind === 2) {
          // Patine brune dans les creux, vert-de-gris par plaques, arêtes polies par les mains.
          const recess = smooth(0.004, 0.04, cav);
          const green = clamp01((recess * smooth(0.45, 0.63, mid) * 0.95 + smooth(0.64, 0.8, low) * 0.3 * (1 - smooth(0.004, 0.02, conv))) * wearK);
          r *= 1 - 0.35 * recess; g *= 1 - 0.35 * recess; b *= 1 - 0.3 * recess;
          const vr = 0.04 + 0.03 * hi, vg = 0.072 + 0.04 * hi, vb = 0.055 + 0.03 * hi;
          r += (vr - r) * green; g += (vg - g) * green; b += (vb - b) * green;
          metal *= 1 - Math.max(green, recess * 0.45); rough += (0.88 - rough) * Math.max(green, recess * 0.6);
          if (conv > 0.006) { r *= 1.18; g *= 1.12; b *= 1.05; rough *= 0.7; }
          rough = clamp01(rough + (mid - 0.5) * 0.3);
        } else if (kind === 3) {
          const rust = smooth(0.5, 0.62, (mid * 0.55 + low * 0.45 + cav * 5) * (0.6 + 0.4 * wearK));
          const rr = 0.1 + 0.2 * hi, rg = 0.03 + 0.07 * hi, rb = 0.012 + 0.02 * hi;
          r += (rr - r) * rust; g += (rg - g) * rust; b += (rb - b) * rust;
          metal *= 1 - rust * 0.95; rough += (0.95 - rough) * rust;
          if (conv > 0.01 && rust < 0.5) { r *= 1.25; g *= 1.25; b *= 1.25; rough *= 0.6; }
        } else if (kind === 4) {
          const t = clamp01((smooth(0.003, 0.03, cav) + smooth(0.62, 0.82, low) * 0.3) * wearK);
          r += (0.022 - r) * t; g += (0.019 - g) * t; b += (0.016 - b) * t; rough += (0.7 - rough) * t;
          rough = clamp01(rough + (mid - 0.5) * 0.22);
        } else if (kind === 5) {
          const k = 0.72 + 0.5 * hi + (fine - 0.5) * 0.25; r *= k; g *= k; b *= k;
          const lichen = smooth(0.7, 0.76, mid) * (1 - smooth(0.004, 0.02, conv)) * 0.85 * wearK * (o.lichen ?? 1);
          r += (0.16 - r) * lichen; g += (0.17 - g) * lichen; b += (0.05 - b) * lichen;
          const dirt = smooth(0.004, 0.05, cav); r *= 1 - 0.6 * dirt; g *= 1 - 0.6 * dirt; b *= 1 - 0.6 * dirt;
          metal = 0; rough = Math.max(rough, 0.85);
        } else if (kind === 6) {
          const y1 = clamp01(smooth(0.003, 0.04, cav) + smooth(0.6, 0.8, low) * 0.4);
          r += (0.2 - r) * y1 * 0.8; g += (0.12 - g) * y1 * 0.8; b += (0.05 - b) * y1 * 0.8;
          rough = clamp01(rough + (hi - 0.5) * 0.3);
        } else if (kind === 7 || kind === 11) {
          const dirt = smooth(0.003, 0.04, cav); r *= 1 - 0.55 * dirt; g *= 1 - 0.58 * dirt; b *= 1 - 0.6 * dirt;
          if (conv > 0.008) { r *= 1.2; g *= 1.17; b *= 1.12; }
          const k = 0.9 + 0.22 * hi; r *= k; g *= k; b *= k;
        } else if (kind === 8) {
          const stain = smooth(0.6, 0.72, low) * 0.5 + smooth(0.68, 0.74, mid) * 0.35;
          r *= 1 - 0.45 * stain; g *= 1 - 0.5 * stain; b *= 1 - 0.6 * stain;
          const l = 0.3 * r + 0.55 * g + 0.15 * b; r += (l - r) * 0.2; g += (l - g) * 0.2; b += (l - b) * 0.2;
          const dirt = smooth(0.003, 0.05, cav); r *= 1 - 0.5 * dirt; g *= 1 - 0.5 * dirt; b *= 1 - 0.5 * dirt;
          metal = 0; rough = Math.max(rough, 0.92);
        } else if (kind === 12 || kind === 13 || kind === 14) {
          const dirt = smooth(0.003, 0.05, cav); r *= 1 - 0.5 * dirt; g *= 1 - 0.5 * dirt; b *= 1 - 0.5 * dirt;
        }

        // Crasse générale : aucune surface n'est neuve.
        if (kind !== 9 && kind !== 10) { const grime = 1 - (0.2 * smooth(0.25, 0.75, 1 - low)) * wearK; r *= grime; g *= grime; b *= grime * 0.97; }
        if (metal > 0.5 && fine > 0.94) rough *= 0.55;
        rough = clamp01(rough);
        const ao = Math.max(o.aoMin, 1 - cav * o.ao);
        const aoSoft = 0.45 + 0.55 * ao;
        // Rugosité → lobe spéculaire (Blinn normalisé) et lobe du reflet d'environnement.
        const alpha2 = Math.max(0.0004, rough * rough * rough * rough);
        const shin = Math.min(3000, 2 / alpha2 - 2);
        const specNorm = (shin + 2) / 8;
        const lobeP = Math.max(1, shin / 4);
        const smoothness = 1 - rough;
        const sharp = smoothness * smoothness;
        const Rx = 2 * nz * nx, Ry = 2 * nz * ny, Rz = 2 * nz * nz - 1;
        const facing = (0.3 + 0.7 * Math.max(0, Rz)) * (1 - 0.55 * Math.max(0, Ry)) * (1 + 0.3 * Math.max(0, -Ry));
        let er = rmR * facing, eg = rmG * facing, eb = rmB * facing;
        let dr = 0, dg = 0, db = 0, sr = 0, sg = 0, sb = 0;
        const hz = Hs[i] * hs;
        for (let k = 0; k < lights.length; k += 1) {
          const l = lights[k];
          let lx, ly, lz, cr, cg, cb;
          if (l.pos) {
            const dx = l.pos[0] - x, dy = l.pos[1] - y, dz = l.pos[2] - hz;
            const d = Math.hypot(dx, dy, dz) || 1;
            lx = dx / d; ly = dy / d; lz = dz / d;
            const att = 1 / (1 + (d / l.radius) * (d / l.radius));
            cr = l.color[0] * att; cg = l.color[1] * att; cb = l.color[2] * att;
          } else {
            [lx, ly, lz] = l.dir;
            const sh = l.shadow ? 1 - o.shadow * (1 - l.shadow[i]) : 1;
            cr = l.color[0] * sh; cg = l.color[1] * sh; cb = l.color[2] * sh;
          }
          const rl = Rx * lx + Ry * ly + Rz * lz;
          if (rl > 0 && l.env !== 0) { const lobe = Math.pow(rl, lobeP) * o.envKey * (l.env ?? 1); er += cr * lobe; eg += cg * lobe; eb += cb * lobe; }
          const ndl = nx * lx + ny * ly + nz * lz;
          if (ndl <= 0) continue;
          dr += cr * ndl; dg += cg * ndl; db += cb * ndl;
          const hx = lx, hy = ly, hz2 = lz + 1; const hl = 1 / Math.hypot(hx, hy, hz2);
          const ndh = Math.max(0, (nx * hx + ny * hy + nz * hz2) * hl);
          const sp = Math.pow(ndh, shin) * specNorm * ndl;
          sr += cr * sp; sg += cg * sp; sb += cb * sp;
        }
        const f0 = kind === 9 || kind === 10 ? 0.06 : 0.035;
        const fres = f0 + (1 - f0) * Math.pow(1 - Math.max(0, nz), 5);
        const envK = (fres * (0.2 + 0.8 * sharp) + f0 * 2) * (o.sheen + (1 - o.sheen) * sharp);
        // Diélectrique : diffus + reflet selon Fresnel + éclat blanc.
        let outR = r * (amR * ao + dr * aoSoft) + (sr * f0 * 1.6 + er * envK) * ao;
        let outG = g * (amG * ao + dg * aoSoft) + (sg * f0 * 1.6 + eg * envK) * ao;
        let outB = b * (amB * ao + db * aoSoft) + (sb * f0 * 1.6 + eb * envK) * ao;
        if (metal > 0.01) {
          // Métal : reflet teinté ; un métal patiné diffuse aussi une part de la lumière.
          const md = 0.22 + 0.5 * rough;
          const mR = r * ((er + amR) * ao + sr * 0.9 + dr * md * aoSoft);
          const mG = g * ((eg + amG) * ao + sg * 0.9 + dg * md * aoSoft);
          const mB = b * ((eb + amB) * ao + sb * 0.9 + db * md * aoSoft);
          outR += (mR - outR) * metal; outG += (mG - outG) * metal; outB += (mB - outB) * metal;
        }
        outR = aces(outR * o.exposure); outG = aces(outG * o.exposure); outB = aces(outB * o.exposure);
        // Étalonnage « ancien » : un peu désaturé, chaud, contrasté, grain de la pellicule.
        const lum = 0.3 * outR + 0.59 * outG + 0.11 * outB;
        outR = (lum + (outR - lum) * o.saturation) * o.tint[0];
        outG = (lum + (outG - lum) * o.saturation) * o.tint[1];
        outB = (lum + (outB - lum) * o.saturation) * o.tint[2];
        outR = (outR - 0.5) * o.contrast + 0.5; outG = (outG - 0.5) * o.contrast + 0.5; outB = (outB - 0.5) * o.contrast + 0.5;
        outR = o.lift + outR * (1 - o.lift); outG = o.lift + outG * (1 - o.lift); outB = o.lift * 0.8 + outB * (1 - o.lift);
        const grain = (f.grain[i] - 0.5) * o.grain;
        O[i * 4] = toSrgb(outR + grain); O[i * 4 + 1] = toSrgb(outG + grain); O[i * 4 + 2] = toSrgb(outB + grain); O[i * 4 + 3] = alpha;
      }
    }
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(image, 0, 0);
    // Éclats : les reflets les plus vifs bavent légèrement, comme sur une photo.
    if (o.glint) {
      const gl = new ImageData(SIZE, SIZE); const G = gl.data;
      for (let i = 0; i < N; i += 1) {
        const q = i * 4; const l = (O[q] * 0.3 + O[q + 1] * 0.59 + O[q + 2] * 0.11) / 255;
        if (l > 0.72 && O[q + 3]) { const k = (l - 0.72) / 0.28; G[q] = O[q] * k; G[q + 1] = O[q + 1] * k; G[q + 2] = O[q + 2] * k; G[q + 3] = 255; }
      }
      const gc = document.createElement('canvas'); gc.width = gc.height = SIZE; gc.getContext('2d').putImageData(gl, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(5px)'; ctx.globalAlpha = o.glint; ctx.drawImage(gc, 0, 0); ctx.filter = 'blur(14px)'; ctx.globalAlpha = o.glint * 0.5; ctx.drawImage(gc, 0, 0); ctx.restore();
    }
    if (o.bloom) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(18px)'; ctx.globalAlpha = Math.min(1, 0.85 * o.bloom); ctx.drawImage(L.E, 0, 0);
      ctx.filter = 'blur(6px)'; ctx.globalAlpha = Math.min(1, 0.9 * o.bloom); ctx.drawImage(L.E, 0, 0);
      ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.drawImage(L.E, 0, 0);
      ctx.restore();
    }
    // Ombre du cadre sur le portrait (en retrait) et sur la carte.
    const key = lights.find((l) => l.shadow);
    if (key && (o.portraitShadow || o.dropShadow)) {
      const sd = new ImageData(SIZE, SIZE); const S = sd.data;
      for (let i = 0; i < N; i += 1) {
        if (alive[i]) continue;
        const x = i % SIZE, y = (i / SIZE) | 0;
        const inside = o.inside ? o.inside(x, y) : Math.hypot(x - C, y - C) < (o.opening || 180) + 6;
        const k = (1 - key.shadow[i]) * (inside ? o.portraitShadow : o.dropShadow);
        if (k > 0.004) { S[i * 4 + 3] = k * 255; S[i * 4] = 6; S[i * 4 + 1] = 4; S[i * 4 + 2] = 2; }
      }
      const sc = document.createElement('canvas'); sc.width = sc.height = SIZE; sc.getContext('2d').putImageData(sd, 0, 0);
      canvas.shadow = sc;
    }
    return canvas;
  }

  /* ---------- composition d'un token ---------- */
  function portraitCanvas(img, radius, options = {}) {
    const c = document.createElement('canvas'); c.width = c.height = SIZE;
    const ctx = c.getContext('2d');
    ctx.save(); ctx.beginPath(); ctx.arc(C, C, radius, 0, TAU); ctx.clip();
    ctx.fillStyle = options.background || '#1a1714'; ctx.fillRect(0, 0, SIZE, SIZE);
    if (img) {
      const ratio = img.width / img.height; const d = radius * 2 * (options.zoom || 1);
      const w = ratio >= 1 ? d * ratio : d; const h = w / ratio;
      const [fx, fy] = options.focus || [0.5, 0.5];
      ctx.filter = options.filter || 'sepia(0.16) saturate(0.88) contrast(1.05)';
      ctx.drawImage(img, C - fx * w, C - fy * h, w, h);
      ctx.filter = 'none';
    }
    if (options.tint) { ctx.fillStyle = options.tint; ctx.fillRect(0, 0, SIZE, SIZE); }
    const v = ctx.createRadialGradient(C, C, radius * 0.45, C, C, radius);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(8,5,2,${options.vignette ?? 0.55})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();
    return c;
  }

  function compose({ back, portrait, frame, front, opening }) {
    const c = document.createElement('canvas'); c.width = c.height = SIZE;
    const ctx = c.getContext('2d');
    if (back) back(ctx);
    if (portrait) ctx.drawImage(portrait, 0, 0);
    if (frame.shadow) {
      ctx.save(); ctx.filter = 'blur(1.5px)'; ctx.drawImage(frame.shadow, 0, 0); ctx.restore();
    } else if (portrait) {
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, opening + 2, 0, TAU); ctx.clip();
      ctx.filter = 'blur(7px) brightness(0)'; ctx.globalAlpha = 0.75; ctx.drawImage(frame, 7, 10);
      ctx.restore();
    }
    ctx.drawImage(frame, 0, 0);
    if (front) front(ctx);
    return c;
  }

  root.Relief = { SIZE, C, TAU, rng, createLayers, render, compose, portraitCanvas, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample, fbm, valueNoise, resample, hex, KIND };
}(window));
