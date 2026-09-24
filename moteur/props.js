// Labo Eraser — objets sculptés à taille réelle pour les tokens de boutique (v2).
// Volumes par champ de distance (« coussin »), textures peintes pixel par pixel,
// matières sombres et patinées pour tenir la comparaison avec les cadres.
(function (root) {
  'use strict';
  const { C, TAU, rng, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { P, circle, ringPath, poly, smoothPath, bezierPts, spiralPts, lerp, localPts, rivet, gem, leaf, feather, skull, chain } = root.Helpers;
  const F = () => getFields();
  const W = 512;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));

  /* ---------- outils ---------- */
  function maskOf(path, rule) {
    const c = document.createElement('canvas'); c.width = c.height = W; const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; path(x); x.fill(rule || 'nonzero');
    return x.getImageData(0, 0, W, W).data;
  }
  // Distance au bord de la forme (chanfrein), en pixels.
  function distanceField(path, rule) {
    const m = maskOf(path, rule); const d = new Float32Array(W * W); const D = 1.414;
    for (let i = 0; i < W * W; i += 1) d[i] = m[i * 4 + 3] > 127 ? 1e6 : 0;
    for (let y = 0; y < W; y += 1) for (let x = 0; x < W; x += 1) {
      const i = y * W + x; if (!d[i]) continue; let v = d[i];
      v = Math.min(v, x > 0 ? d[i - 1] + 1 : 1);
      if (y > 0) { v = Math.min(v, d[i - W] + 1); if (x > 0) v = Math.min(v, d[i - W - 1] + D); if (x < W - 1) v = Math.min(v, d[i - W + 1] + D); } else v = Math.min(v, 1);
      d[i] = v;
    }
    for (let y = W - 1; y >= 0; y -= 1) for (let x = W - 1; x >= 0; x -= 1) {
      const i = y * W + x; if (!d[i]) continue; let v = d[i];
      v = Math.min(v, x < W - 1 ? d[i + 1] + 1 : 1);
      if (y < W - 1) { v = Math.min(v, d[i + W] + 1); if (x < W - 1) v = Math.min(v, d[i + W + 1] + D); if (x > 0) v = Math.min(v, d[i + W - 1] + D); } else v = Math.min(v, 1);
      d[i] = v;
    }
    return d;
  }
  // Volume « coussin » : bord arrondi sur `radius` pixels, couleur et matière au choix.
  function pillow(L, path, o) {
    const d = distanceField(path, o.rule); const R = o.radius || 12;
    L.paint(path, (x, y, px) => {
      const dist = d[y * W + x]; const t = Math.min(1, dist / R); const prof = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
      px.rgb = o.color(x, y, t, prof, dist); px.h = o.base + o.lift * prof + (o.bump ? o.bump(x, y, t, dist) : 0); px.hMode = 'set';
      px.kind = o.kind; px.metal = o.metal ?? 0; px.rough = o.rough ?? 0.7;
      if (o.extra) o.extra(x, y, t, px, dist);
    }, { rule: o.rule });
    return d;
  }
  // Peint une forme dans son repère local : fn(u, v, px, x, y).
  function local(L, x, y, rot, shape, fn, o = {}) {
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const mask = (ctx) => { ctx.translate(x, y); ctx.rotate(rot); shape(ctx); };
    L.paint(mask, (px2, py2, px) => { const dx = px2 - x, dy = py2 - y; fn(dx * cos + dy * sin, -dx * sin + dy * cos, px, px2, py2); }, o);
  }
  const roundRect = (w, h, r) => (ctx) => { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); };
  const roundRectAt = (x, y, w, h, rot, r) => (ctx) => { ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); };
  // Textures.
  const leatherTex = (c, x, y, f) => { const n = sample(f.mid, x * 2.2, y * 2.2), g = sample(f.fine, x * 1.3, y * 1.3), p = sample(f.high, x * 2.6, y * 2.6); return shade(c, (0.74 + 0.34 * n + 0.1 * (g - 0.5)) * (p > 0.84 ? 0.86 : 1)); };
  const woodTex = (c, along, across, f, seed = 0) => { const g = sample(f.mid, across * 3.2 + seed * 37, along * 0.22 + seed * 11); const fine = sample(f.high, across * 2.4 + seed, along * 0.35); return shade(c, (0.7 + 0.42 * g) * (0.9 + 0.2 * fine)); };
  const burlapTex = (c, x, y, f) => { const wv = (Math.sin(x * 1.7) > 0) !== (Math.sin(y * 1.7) > 0) ? 1 : 0.84; const n = sample(f.mid, x * 1.5, y * 1.5), s = sample(f.low, x * 3, y * 3); return shade(c, wv * (0.78 + 0.32 * n) * (1 - 0.25 * smooth(0.6, 0.8, s))); };

  /* ---------- livres et écriture ---------- */
  function book(L, x, y, w, t, rot, o) {
    const col = hex(o.color); const z = o.z; const face = o.face || 'spine'; const f = F();
    const bands = [0.2, 0.4, 0.6, 0.8];
    local(L, x, y, rot, roundRect(w, t, face === 'spine' ? t * 0.42 : 2.5), (u, v, px, gx, gy) => {
      const fu = u / w + 0.5, fv = v / t + 0.5;
      const across = Math.sqrt(Math.max(0, 1 - (2 * fv - 1) ** 2));
      if (face === 'spine') {
        let c = leatherTex(col, gx, gy, f);
        c = shade(c, 0.7 + 0.35 * across);
        let h = z + 0.075 * across; let kind = 'leather', metal = 0, rough = 0.58 - 0.1 * across;
        for (const b of bands) {
          const d = Math.abs(fu - b) * w;
          if (d < 2.6) { h += 0.035 * (1 - d / 2.6); c = shade(c, 1.08); }
          if (Math.abs(d - 4.2) < 0.7) { c = [178, 138, 64]; kind = 'gold'; metal = 0.9; rough = 0.4; }
        }
        const label = fu > 0.43 && fu < 0.57 && fv > 0.22 && fv < 0.78;
        if (label) {
          c = shade(hex(o.label || '#1a1210'), 0.9 + 0.2 * sample(f.mid, gx * 2, gy * 2)); h -= 0.008; kind = 'leather';
          if ((Math.abs(fv - 0.42) < 0.05 || Math.abs(fv - 0.6) < 0.04) && Math.floor(fu * 150) % 3 !== 0) { c = [190, 150, 72]; kind = 'gold'; metal = 0.9; rough = 0.4; }
        }
        const wear = smooth(0.78, 0.96, Math.abs(2 * fv - 1)) * smooth(0.5, 0.8, sample(f.high, gx * 1.4, gy * 1.4));
        c = mix(c, [132, 108, 82], wear * 0.45);
        const endShade = smooth(0, 0.04, Math.min(fu, 1 - fu)); c = shade(c, 0.6 + 0.4 * endShade);
        px.rgb = c; px.h = h; px.hMode = 'set'; px.kind = kind; px.metal = metal; px.rough = rough;
      } else {
        const board = fv < 0.13 || fv > 0.87;
        if (board) { px.rgb = shade(leatherTex(col, gx, gy, f), 0.85); px.h = z + 0.06; px.kind = 'leather'; px.rough = 0.6; }
        else {
          const n = sample(f.mid, gx * 1.4, gy * 1.4);
          const line = 0.86 + 0.14 * Math.sin(v * 2.9 + n * 3);
          const yel = smooth(0.35, 1, Math.abs(fu - 0.5) * 2) * 0.7 + smooth(0.5, 0.8, n) * 0.3;
          px.rgb = [(206 - 44 * yel) * line, (186 - 56 * yel) * line, (146 - 66 * yel) * line];
          px.h = z + 0.045 - 0.018 * Math.sin(Math.PI * clamp01((fv - 0.13) / 0.74)); px.kind = 'cloth'; px.rough = 0.9;
        }
        px.hMode = 'set'; px.metal = 0;
      }
    });
    if (o.clasp) { const [cx, cy] = localPts(x, y, rot, 1, [[w * 0.44, 0]])[0]; L.fill(roundRectAt(cx, cy, 9, t * 0.72, rot, 1.5), { albedo: '#9c7a3a', height: z + 0.1, kind: 'gold', metal: 0.9, rough: 0.4, op: 'source-over' }); }
  }
  function openBook(L, x, y, w, h, rot, z) {
    const f = F();
    local(L, x, y, rot, roundRect(w + 8, h + 8, 5), (u, v, px, gx, gy) => { px.rgb = leatherTex([64, 30, 20], gx, gy, f); px.h = z; px.hMode = 'set'; px.kind = 'leather'; px.rough = 0.6; });
    local(L, x, y, rot, roundRect(w, h, 3), (u, v, px, gx, gy) => {
      const fu = Math.abs(u) / (w / 2); const curl = Math.sin(Math.PI * Math.min(1, fu * 1.05)) * 0.06;
      const n = sample(f.mid, gx * 1.5, gy * 1.5);
      let c = [206 - 24 * n, 188 - 26 * n, 148 - 28 * n];
      const text = fu > 0.12 && fu < 0.88 && Math.abs(v) < h * 0.38 && (Math.floor((v + h) / 5.2) % 2 === 0) && sample(f.fine, gx * 2, gy * 0.6) > 0.35;
      if (text) c = [78, 60, 42];
      if (fu < 0.07) c = shade(c, 0.55 + fu * 6);
      px.rgb = c; px.h = z + 0.04 + curl; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.9;
    });
    const [rx, ry] = localPts(x, y, rot, 1, [[w * 0.25, h * 0.2]])[0];
    L.stroke(poly([[rx, ry], [rx + 3, ry + h * 0.45]], false), 3, { albedo: '#6a1614', height: z + 0.12, kind: 'cloth', rough: 0.8 });
  }
  function candle(L, x, y, h, z, o = {}) {
    const r = rng(Math.round(x * 5 + y));
    const w = o.w || 14; const wax = hex(o.wax || '#d6c7a0');
    if (o.holder !== false) {
      L.ellipse(x, y + 3, w * 1.5, 5.5, 0, { albedo: '#8a6a34', base: z, peak: z + 0.1, kind: 'gold', metal: 0.9, rough: 0.38 });
      L.torus(x + w * 1.55, y + 1, 5.5, 4.5, 0, 0.4, { albedo: '#8a6a34', base: z + 0.02, peak: z + 0.1, kind: 'gold', metal: 0.9, rough: 0.38 });
      L.ellipse(x, y - 1, w * 0.75, 3, 0, { albedo: '#7a5a2c', base: z + 0.06, peak: z + 0.12, kind: 'gold', metal: 0.9, rough: 0.4 });
    }
    const f = F();
    L.paint(roundRectAt(x, y - h / 2, w, h, 0, 3), (gx, gy, px) => {
      const du = (gx - x) / (w / 2); const top = smooth(y - h * 0.7, y - h, gy); const n = sample(f.mid, gx * 3, gy * 1.2);
      let c = shade(wax, (0.78 + 0.26 * (1 - du * du)) * (0.92 + 0.12 * n)); c = mix(c, [255, 214, 150], top * 0.25);
      px.rgb = c; px.h = z + 0.08 + 0.1 * Math.sqrt(Math.max(0, 1 - du * du)); px.hMode = 'set'; px.kind = 'wax'; px.metal = 0; px.rough = 0.4;
      px.e = [70 * top, 44 * top, 16 * top];
    });
    for (let k = 0; k < 5; k += 1) { const dx = -w / 2 + 2 + r() * (w - 4), len = 6 + r() * h * 0.55; L.taper([[x + dx, y - h + 1], [x + dx + (r() - 0.5) * 1.5, y - h + len]], (t) => 3.2 - t * 0.9 + 1.5 * smooth(0.82, 1, t), { albedo: o.wax || '#ddd0ae', base: z + 0.12, peak: z + 0.2, kind: 'wax', rough: 0.36 }); }
    L.ellipse(x, y - h, w / 2 + 1, 3, 0, { albedo: '#e2d6b8', base: z + 0.14, peak: z + 0.18, kind: 'wax', rough: 0.4 });
    L.stroke(poly([[x, y - h - 1], [x + 0.5, y - h - 6]], false), 1.4, { albedo: '#18120e', height: z + 0.22 });
    const fy = y - h - 4;
    L.fill((ctx) => { ctx.beginPath(); ctx.moveTo(x, fy - 22); ctx.quadraticCurveTo(x + 7, fy - 7, x, fy); ctx.quadraticCurveTo(x - 7, fy - 7, x, fy - 22); }, { albedo: o.flame || '#ffb35a', height: z + 0.3, kind: 'glass', rough: 0.2, emissive: o.flameGlow || 'rgba(255,150,60,0.9)', op: 'source-over' });
    L.fill((ctx) => { ctx.beginPath(); ctx.moveTo(x, fy - 15); ctx.quadraticCurveTo(x + 3.5, fy - 5, x, fy - 1); ctx.quadraticCurveTo(x - 3.5, fy - 5, x, fy - 15); }, { albedo: o.core || '#fff4d0', height: z + 0.32, kind: 'glass', rough: 0.2, emissive: o.coreGlow || 'rgba(255,245,210,1)', op: 'source-over' });
    L.glow((e) => { const g = e.createRadialGradient(x, fy - 2, 0, x, fy - 2, 5); g.addColorStop(0, o.wickGlow || 'rgba(90,120,255,0.7)'); g.addColorStop(1, 'rgba(60,80,255,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, fy - 2, 5, 0, TAU); e.fill(); });
    L.glow((e) => { const g = e.createRadialGradient(x, fy - 10, 0, x, fy - 10, o.halo || 60); g.addColorStop(0, o.haloColor || 'rgba(255,170,70,0.45)'); g.addColorStop(1, 'rgba(255,120,30,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, fy - 10, o.halo || 60, 0, TAU); e.fill(); });
  }
  function inkwell(L, x, y, s, z) {
    const body = (ctx) => { ctx.beginPath(); ctx.moveTo(x - 17 * s, y); ctx.quadraticCurveTo(x - 20 * s, y - 20 * s, x - 8 * s, y - 22 * s); ctx.lineTo(x + 8 * s, y - 22 * s); ctx.quadraticCurveTo(x + 20 * s, y - 20 * s, x + 17 * s, y); ctx.closePath(); };
    pillow(L, body, { base: z, lift: 0.2, radius: 10 * s, kind: 'glass', metal: 0, rough: 0.05, color: (gx, gy, t) => { const rim = Math.exp(-t * 6); const streak = Math.exp(-(((gx - (x - 8 * s)) / (1.6 * s)) ** 2)) * 0.6; return mix([14, 16, 22], [150, 160, 170], Math.max(rim * 0.5, streak)); } });
    L.ellipse(x, y - 23 * s, 8 * s, 3 * s, 0, { albedo: '#8a6a34', base: z + 0.16, peak: z + 0.22, kind: 'gold', metal: 0.9, rough: 0.4 });
    feather(L, x + 2 * s, y - 22 * s, 86 * s, 17 * s, -1.2, { albedo: '#b9b0a0', rachis: '#ded6c6', base: z + 0.2, peak: z + 0.34, op: 'source-over', profile: 'blade', curve: 0.06, seed: 4 });
  }
  function scroll(L, x, y, w, rot, z) {
    const f = F(); const th = 24;
    local(L, x, y, rot, roundRect(w, th, 11), (u, v, px, gx, gy) => {
      const fv = v / (th / 2); const prof = Math.sqrt(Math.max(0, 1 - fv * fv));
      const n = sample(f.mid, gx * 1.6, gy * 1.6), lo = sample(f.low, gx * 3, gy * 3);
      let c = [190 - 34 * n, 166 - 36 * n, 120 - 34 * n];
      c = mix(c, [118, 86, 52], smooth(0.58, 0.78, lo) * 0.6);
      const endD = w / 2 - Math.abs(u);
      if (endD < 11) { const rr = Math.hypot(11 - endD, v); c = shade(c, 0.66 + 0.26 * (0.5 + 0.5 * Math.sin(rr * 1.7))); }
      c = shade(c, 0.72 + 0.32 * prof);
      px.rgb = c; px.h = z + 0.15 * prof; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.86;
    });
    const [rx, ry] = localPts(x, y, rot, 1, [[-w * 0.12, 0]])[0];
    L.fill(roundRectAt(rx, ry, 8, th + 4, rot, 1.5), { albedo: '#5a1614', height: z + 0.17, kind: 'cloth', rough: 0.8, op: 'source-over' });
    const [sx, sy] = localPts(x, y, rot, 1, [[-w * 0.12, th / 2 + 4]])[0];
    L.dome(sx, sy, 7, { albedo: '#7a1612', base: z + 0.15, peak: z + 0.24, kind: 'wax', rough: 0.28 });
    L.engrave(circle(4, sx, sy), 1, 0.3);
  }

  /* ---------- nourriture ---------- */
  function apple(L, x, y, r, o = {}) {
    const f = F(); const z = o.z; const base = hex(o.color || '#7a1e14'); const blush = hex(o.blush || '#b8823a');
    L.paint(circle(r, x, y), (gx, gy, px) => {
      const dx = (gx - x) / r, dy = (gy - y) / r; const d = Math.min(1, Math.hypot(dx, dy));
      const k = smooth(0.1, 0.9, (dx + dy * 0.4 + 0.6) / 1.4);
      const n = sample(f.fine, gx * 1.3, gy * 1.3), stripe = 0.5 + 0.5 * Math.sin(Math.atan2(dy, dx) * 9 + sample(f.mid, gx, gy) * 4);
      let c = mix(base, blush, k * 0.6);
      c = shade(c, 0.82 + 0.2 * stripe * (1 - k));
      if (n > 0.9) c = c.map((v) => v + 30);
      px.rgb = c; px.h = z + 0.24 * Math.sqrt(Math.max(0, 1 - d * d)) - 0.03 * Math.exp(-((Math.hypot(dx + 0.05, dy + 0.62) / 0.18) ** 2)); px.hMode = 'max';
      px.kind = 'organic'; px.metal = 0; px.rough = 0.34;
    });
    L.taper([[x + r * 0.05, y - r * 0.6], [x + r * 0.15, y - r * 1.05]], [2.4, 1.6], { albedo: '#3a2a16', base: z + 0.2, peak: z + 0.28, kind: 'wood', rough: 0.8 });
    if (o.leaf) leaf(L, x + r * 0.2, y - r * 0.95, r * 0.9, r * 0.42, -0.5, { albedo: '#44521e', base: z + 0.2, peak: z + 0.3, op: 'source-over' });
  }
  function grapes(L, x, y, s, z) {
    const r = rng(Math.round(x));
    const pts = []; for (let row = 0; row < 5; row += 1) for (let k = 0; k < 5 - row; k += 1) pts.push([x + (k - (4 - row) / 2) * 9 * s + (r() - 0.5) * 2, y + row * 8 * s]);
    pts.sort((p, q) => p[1] - q[1]).forEach(([gx, gy], i) => L.dome(gx, gy, 5.6 * s, { albedo: ['#34182e', '#43203e', '#2a1428'][i % 3], base: z + i * 0.004, peak: z + 0.14 + i * 0.004, kind: 'organic', rough: 0.5 }));
    L.taper([[x, y - 4], [x + 2, y - 14]], [3, 2], { albedo: '#4a3a1e', base: z + 0.1, peak: z + 0.16, kind: 'wood', rough: 0.8 });
    leaf(L, x + 4, y - 10, 24 * s, 16 * s, -0.4, { shape: 'ivy', albedo: '#3e4a1c', base: z + 0.1, peak: z + 0.18, op: 'source-over' });
  }
  function bread(L, x, y, w, h, rot, z) {
    const f = F();
    const path = (ctx) => { ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); };
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const cutAt = (gx, gy) => { const u = (gx - x) * cos + (gy - y) * sin, v = -(gx - x) * sin + (gy - y) * cos; const du = u / (w / 2), dv = v / (h / 2); let best = 0; for (let k = -1; k <= 1; k += 1) { const cu = du - k * 0.45 + dv * 0.35 + (sample(f.mid, gx * 2, gy * 2) - 0.5) * 0.06; if (Math.abs(cu) < 0.055 && Math.abs(dv) < 0.55) best = Math.max(best, 1 - Math.abs(cu) / 0.055); } return best; };
    pillow(L, path, { base: z, lift: 0.22, radius: h * 0.5, kind: 'organic', rough: 0.72, color: (gx, gy, t) => {
      const n = sample(f.mid, gx * 1.8, gy * 1.8), fine = sample(f.fine, gx * 1.5, gy * 1.5);
      let c = mix([84, 46, 20], [166, 108, 50], t * (0.7 + 0.3 * n));
      const cut = cutAt(gx, gy); if (cut) c = mix(c, [206, 168, 106], cut);
      if (fine > 0.93 && t > 0.5) c = mix(c, [230, 222, 204], 0.7);
      return c;
    }, bump: (gx, gy) => -0.04 * cutAt(gx, gy) });
  }
  function cheese(L, x, y, s, z) {
    const f = F();
    const R = 34 * s, H = 22 * s, e = 11 * s;
    pillow(L, (ctx) => { ctx.beginPath(); ctx.ellipse(x, y + H / 2, R, e, 0, 0, Math.PI); ctx.lineTo(x - R, y - H / 2); ctx.ellipse(x, y - H / 2, R, e, 0, Math.PI, 0, true); ctx.closePath(); }, { base: z, lift: 0.14, radius: 10 * s, kind: 'wax', rough: 0.45, color: (gx, gy, t) => { const n = sample(f.mid, gx * 2, gy * 2); return shade(mix([104, 60, 18], [160, 106, 38], t), 0.85 + 0.25 * n); } });
    const a0 = -0.2, a1 = 0.75;
    L.paint((ctx) => { ctx.beginPath(); ctx.ellipse(x, y - H / 2, R, e, 0, 0, TAU); }, (gx, gy, px) => {
      const dx = (gx - x) / R, dy = (gy - (y - H / 2)) / e; const a = Math.atan2(dy, dx);
      if (a > a0 && a < a1) { px.skip = true; return; }
      const d = Math.hypot(dx, dy); const n = sample(f.mid, gx * 2, gy * 2);
      px.rgb = d > 0.9 ? shade([144, 96, 32], 0.9 + 0.2 * n) : shade([188, 144, 60], 0.9 + 0.15 * n); px.h = z + 0.16; px.hMode = 'set'; px.kind = 'wax'; px.metal = 0; px.rough = 0.55;
    });
    const p0 = [x, y - H / 2], pA = [x + Math.cos(a0) * R, y - H / 2 + Math.sin(a0) * e], pB = [x + Math.cos(a1) * R, y - H / 2 + Math.sin(a1) * e];
    L.paint(poly([p0, pA, [pA[0], pA[1] + H], [x, y + H / 2], [pB[0], pB[1] + H], pB]), (gx, gy, px) => {
      const n = sample(f.mid, gx * 2.5, gy * 2.5); let c = [220 - 14 * n, 190 - 16 * n, 112 - 14 * n];
      const hole = sample(f.fine, gx * 0.6, gy * 0.6) > 0.9; if (hole) c = shade(c, 0.6);
      px.rgb = c; px.h = z + 0.1 + (hole ? -0.02 : 0); px.hMode = 'set'; px.kind = 'organic'; px.metal = 0; px.rough = 0.62;
      px.n = gx < x ? [-0.35, -0.1, 1] : [0.3, -0.1, 1];
    });
  }
  function drumstick(L, x, y, s, rot, z) {
    const f = F();
    const T = (pts) => localPts(x, y, rot, s, pts);
    L.taper(T([[18, 0], [40, 0]]), [7 * s, 6 * s], { albedo: '#d6caae', base: z + 0.06, peak: z + 0.16, kind: 'bone', rough: 0.45 });
    for (const d of [-1, 1]) L.dome(...T([[42, d * 4]])[0], 5 * s, { albedo: '#d6caae', base: z + 0.08, peak: z + 0.18, kind: 'bone', rough: 0.45 });
    pillow(L, smoothPath(T([[-24, 0], [-20, -14], [0, -16], [16, -8], [22, 0], [16, 8], [0, 16], [-20, 14]]), true), { base: z + 0.08, lift: 0.22, radius: 14 * s, kind: 'organic', rough: 0.26, color: (gx, gy, t) => { const n = sample(f.mid, gx * 2.2, gy * 2.2); return mix([64, 28, 10], [146, 78, 30], t * (0.6 + 0.5 * n)); } });
  }

  /* ---------- verre et alchimie ---------- */
  function flask(L, x, y, s, o) {
    const f = F(); const z = o.z; const liquid = hex(o.liquid || '#7a1a14'); const type = o.type || 'round';
    let body, neckTop, bodyH;
    if (type === 'round') { body = (ctx) => { ctx.beginPath(); ctx.arc(x, y - 22 * s, 22 * s, Math.PI * 0.62, Math.PI * 2.38); ctx.lineTo(x + 6.5 * s, y - 62 * s); ctx.lineTo(x - 6.5 * s, y - 62 * s); ctx.closePath(); }; neckTop = y - 62 * s; bodyH = 44 * s; }
    else if (type === 'tall') { body = (ctx) => { ctx.beginPath(); ctx.moveTo(x - 13 * s, y); ctx.lineTo(x - 13 * s, y - 50 * s); ctx.quadraticCurveTo(x - 13 * s, y - 56 * s, x - 6 * s, y - 58 * s); ctx.lineTo(x - 6 * s, y - 72 * s); ctx.lineTo(x + 6 * s, y - 72 * s); ctx.lineTo(x + 6 * s, y - 58 * s); ctx.quadraticCurveTo(x + 13 * s, y - 56 * s, x + 13 * s, y - 50 * s); ctx.lineTo(x + 13 * s, y); ctx.closePath(); }; neckTop = y - 72 * s; bodyH = 56 * s; }
    else { body = (ctx) => { ctx.beginPath(); ctx.moveTo(x - 6 * s, y - 50 * s); ctx.lineTo(x - 6 * s, y - 32 * s); ctx.lineTo(x - 21 * s, y); ctx.lineTo(x + 21 * s, y); ctx.lineTo(x + 6 * s, y - 32 * s); ctx.lineTo(x + 6 * s, y - 50 * s); ctx.closePath(); }; neckTop = y - 50 * s; bodyH = 36 * s; }
    const level = y - (o.level ?? 0.55) * bodyH;
    const d = distanceField(body);
    const r = rng(Math.round(x * 13 + y));
    const bubbles = Array.from({ length: 5 }, () => [x + (r() - 0.5) * 20 * s, level + 4 + r() * Math.max(1, y - level - 8), 0.8 + r() * 1.4]);
    L.paint(body, (gx, gy, px) => {
      const dist = d[gy * W + gx]; const rim = Math.exp(-dist / (1.6 * s)); const inner = Math.exp(-dist / (5 * s));
      const inLiquid = gy > level + Math.sin(gx * 0.3) * 0.6;
      const dx = (gx - x) / (22 * s);
      let c;
      if (inLiquid) {
        const depth = clamp01((gy - level) / (y - level + 1));
        c = shade(liquid, (0.95 - 0.5 * depth) * (0.75 + 0.35 * (1 - Math.min(1, Math.abs(dx)))));
        if (Math.abs(gy - level) < 1.3) c = mix(c, [255, 255, 255], 0.35);
        for (const [bx, by, br] of bubbles) if (Math.hypot(gx - bx, gy - by) < br) c = mix(c, [255, 255, 255], 0.4);
      } else c = mix([22, 26, 30], [60, 70, 76], inner);
      c = mix(c, [200, 214, 222], rim * 0.55);
      const streak = Math.exp(-(((gx - (x - 9 * s)) / (1.4 * s)) ** 2)) * smooth(y + 2, y - 30 * s, gy) * 0.5;
      c = mix(c, [255, 252, 240], streak);
      px.rgb = c; px.h = z + 0.2 * Math.sqrt(Math.max(0, 1 - Math.min(1, Math.abs(dx)) ** 2)); px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.05;
      if (inLiquid && o.glow) px.e = liquid.map((v) => v * 0.14 * (1 - Math.min(1, Math.abs(dx)) * 0.5));
    });
    L.stroke(poly([[x - 7.5 * s, neckTop + 1], [x + 7.5 * s, neckTop + 1]], false), 3 * s, { albedo: '#4a5258', height: z + 0.2, kind: 'glass', rough: 0.1 });
    L.paint(roundRectAt(x, neckTop - 5 * s, 12 * s, 12 * s, 0, 2), (gx, gy, px) => { const n = sample(f.fine, gx * 1.6, gy * 1.6); px.rgb = shade([122, 92, 58], 0.75 + 0.35 * n); px.h = z + 0.2 + (n > 0.8 ? -0.01 : 0); px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.85; });
    if (o.wax) L.fill((ctx) => { ctx.beginPath(); ctx.moveTo(x - 8 * s, neckTop - 8 * s); ctx.lineTo(x + 8 * s, neckTop - 8 * s); ctx.lineTo(x + 8 * s, neckTop + 3 * s); ctx.quadraticCurveTo(x + 5 * s, neckTop + 9 * s, x + 3 * s, neckTop + 3 * s); ctx.lineTo(x - 8 * s, neckTop + 3 * s); ctx.closePath(); }, { albedo: o.wax, height: z + 0.23, kind: 'wax', rough: 0.3, op: 'source-over' });
    if (o.label) L.paint(roundRectAt(x, y - bodyH * 0.42, 22 * s, 14 * s, 0, 1), (gx, gy, px) => { const n = sample(f.mid, gx * 2, gy * 2); let c = [192 - 30 * n, 174 - 32 * n, 130 - 32 * n]; if (Math.abs(gy - (y - bodyH * 0.42)) < 1 && sample(f.fine, gx * 3, 0) > 0.3) c = [60, 40, 26]; px.rgb = c; px.h = z + 0.21; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.9; });
    if (o.glow) L.glow((e) => { const g = e.createRadialGradient(x, y - bodyH * 0.35, 0, x, y - bodyH * 0.35, 46 * s); g.addColorStop(0, `rgba(${liquid[0]},${liquid[1]},${liquid[2]},0.16)`); g.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y - bodyH * 0.35, 46 * s, 0, TAU); e.fill(); });
  }
  function crystals(L, x, y, s, z, col = '#6a3a9a') {
    const f = F(); const c0 = hex(col);
    pillow(L, (ctx) => { ctx.beginPath(); ctx.ellipse(x, y - 4 * s, 38 * s, 14 * s, 0, 0, TAU); }, { base: z, lift: 0.1, radius: 10 * s, kind: 'stone', rough: 0.9, color: (gx, gy) => { const n = sample(f.mid, gx * 2.5, gy * 2.5); return shade([58, 52, 50], 0.7 + 0.5 * n); } });
    const spikes = [[-0.95, 34, 11], [-0.55, 50, 14], [-0.18, 70, 17], [0.2, 58, 15], [0.55, 44, 12], [0.9, 30, 10], [-0.35, 36, 10]];
    spikes.forEach(([a, len, wid], k) => {
      const ang = -Math.PI / 2 + a; const dx = Math.cos(ang), dy = Math.sin(ang), px2 = -dy, py2 = dx;
      const ox = x + Math.cos(ang) * 8 * s, oy = y - 6 * s + Math.sin(ang) * 4 * s;
      const at = (u, v) => [ox + dx * u * s + px2 * v * s, oy + dy * u * s + py2 * v * s];
      const h = z + 0.12 + k * 0.015;
      const faces = [[[0, -wid / 2], [len * 0.8, -wid / 2], [len, 0], [0, 0]], [[0, 0], [len, 0], [len * 0.8, wid / 2], [0, wid / 2]]];
      faces.forEach((facePts, fi) => {
        L.paint(poly(facePts.map(([u, v]) => at(u, v))), (gx, gy, pxl) => {
          const along = clamp01(((gx - ox) * dx + (gy - oy) * dy) / (len * s));
          const tone = fi === 0 ? 1.15 : 0.62;
          let c = shade(c0, tone * (0.5 + 0.55 * along)); c = mix(c, [214, 200, 230], smooth(0.85, 1, along) * 0.3);
          if (sample(f.mid, gx * 3, gy * 3) > 0.72) c = mix(c, [255, 245, 255], 0.2);
          pxl.rgb = c; pxl.h = h; pxl.hMode = 'max'; pxl.kind = 'glass'; pxl.metal = 0; pxl.rough = 0.08;
          pxl.n = fi === 0 ? [-px2 * 0.55 + dx * 0.12, -py2 * 0.55 + dy * 0.12, 1] : [px2 * 0.55 + dx * 0.12, py2 * 0.55 + dy * 0.12, 1];
          pxl.e = c0.map((v) => v * 0.1 * (1 - along));
        });
      });
      L.stroke(poly([at(0, 0), at(len, 0)], false), 0.9, { albedo: 'rgba(245,235,255,0.8)', keepMaterial: true });
    });
  }
  function mortar(L, x, y, s, z) {
    const f = F();
    pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(x - 32 * s, y - 20 * s); ctx.quadraticCurveTo(x - 30 * s, y + 8 * s, x - 14 * s, y + 10 * s); ctx.lineTo(x + 14 * s, y + 10 * s); ctx.quadraticCurveTo(x + 30 * s, y + 8 * s, x + 32 * s, y - 20 * s); ctx.closePath(); }, { base: z, lift: 0.22, radius: 16 * s, kind: 'stone', rough: 0.85, color: (gx, gy, t) => { const n = sample(f.mid, gx * 2, gy * 2), sp = sample(f.fine, gx * 1.4, gy * 1.4); let c = shade([112, 106, 98], 0.7 + 0.4 * n); if (sp > 0.86) c = shade(c, 0.6); if (sp < 0.08) c = shade(c, 1.3); return shade(c, 0.7 + 0.3 * t); } });
    L.ellipse(x, y - 20 * s, 32 * s, 7.5 * s, 0, { albedo: '#8a847a', flat: z + 0.2, kind: 'stone', rough: 0.85 });
    L.ellipse(x, y - 20 * s, 26 * s, 5 * s, 0, { albedo: '#26221e', flat: z + 0.16, kind: 'stone', rough: 0.9 });
    L.ellipse(x - 4 * s, y - 19 * s, 18 * s, 3.4 * s, 0, { albedo: '#3e5424', flat: z + 0.17, kind: 'organic', rough: 0.9 });
    L.taper([[x + 4 * s, y - 18 * s], [x + 32 * s, y - 60 * s]], (t) => (10 - 3 * t) * s, { albedo: '#8a837a', base: z + 0.18, peak: z + 0.3, kind: 'stone', rough: 0.8 });
    L.dome(x + 4 * s, y - 18 * s, 7 * s, { albedo: '#8a837a', base: z + 0.2, peak: z + 0.3, kind: 'stone', rough: 0.8 });
  }
  function herbs(L, x, y, len, z, o = {}) {
    const r = rng(Math.round(x * 11 + y));
    const cols = o.colors || ['#4a5226', '#5e5a2a', '#3e4a22', '#6a5a30'];
    for (let k = -4; k <= 4; k += 1) { const end = [x + k * 4.5 + (r() - 0.5) * 6, y + len]; L.taper([[x + k * 0.8, y], [x + k * 2.5 + (r() - 0.5) * 4, y + len * 0.5], end], [2, 1.2], { albedo: '#4e4424', base: z, peak: z + 0.06, kind: 'organic', rough: 0.8 }); }
    for (let k = 0; k < 22; k += 1) { const t = 0.25 + r() * 0.75; leaf(L, x + (r() - 0.5) * (10 + 26 * t), y + len * t, 11 + r() * 5, 4.5 + r() * 2, Math.PI / 2 + (r() - 0.5) * 1.8, { albedo: cols[k % cols.length], base: z + 0.04, peak: z + 0.1, veins: false, rough: 0.85, op: 'source-over' }); }
    for (let k = 0; k < 3; k += 1) L.stroke(poly([[x - 6, y + 3 + k * 3], [x + 6, y + 1 + k * 3]], false), 2.4, { albedo: '#8a6a3a', height: z + 0.12, kind: 'cloth', rough: 0.9 });
    L.stroke(poly([[x, y + 2], [x + 1, y - 14]], false), 1.4, { albedo: '#6a5a3a', height: z + 0.1, kind: 'cloth', rough: 0.9 });
  }

  /* ---------- armes et armures ---------- */
  function sword(L, x0, y0, x1, y1, z, o = {}) {
    const a = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
    const T = (pts) => localPts(x0, y0, a, 1, pts);
    const w = o.width || 14; const f = F();
    L.paint(poly(T([[0, -w / 2], [len * 0.86, -w * 0.4], [len, 0], [len * 0.86, w * 0.4], [0, w / 2]])), (gx, gy, px) => {
      const v = -(gx - x0) * Math.sin(a) + (gy - y0) * Math.cos(a); const u = (gx - x0) * Math.cos(a) + (gy - y0) * Math.sin(a);
      const n = sample(f.mid, gx * 2, gy * 2), sc = sample(f.high, u * 0.5, v * 6);
      let c = shade([150, 156, 162], 0.8 + 0.3 * n); if (sc > 0.86) c = shade(c, 1.2); if (n > 0.72) c = mix(c, [110, 70, 40], 0.25);
      px.rgb = c; px.h = z + 0.08 + 0.02 * (1 - Math.abs(v) / (w / 2)); px.hMode = 'set'; px.kind = 'silver'; px.metal = 0.95; px.rough = 0.26 + 0.1 * n;
      px.n = v < 0 ? [Math.cos(a - Math.PI / 2) * 0.35, Math.sin(a - Math.PI / 2) * 0.35, 1] : [Math.cos(a + Math.PI / 2) * 0.35, Math.sin(a + Math.PI / 2) * 0.35, 1];
    });
    L.engrave(poly(T([[6, 0], [len * 0.7, 0]]), false), 2.2, 0.2);
    L.taper(T([[-2, -w * 1.5], [-2, w * 1.5]]), [7, 7], { albedo: '#6e5a32', base: z + 0.14, peak: z + 0.26, kind: 'gold', metal: 0.9, rough: 0.42 });
    for (const d of [-1, 1]) L.dome(...T([[-2, d * w * 1.55]])[0], 5, { albedo: '#6e5a32', base: z + 0.16, peak: z + 0.28, kind: 'gold', metal: 0.9, rough: 0.42 });
    const grip = o.grip || 44;
    L.taper(T([[-4, 0], [-grip, 0]]), [9, 8], { albedo: '#2a1a10', base: z + 0.12, peak: z + 0.22, kind: 'leather', rough: 0.7 });
    for (let k = 1; k < grip / 5.5; k += 1) L.engrave(poly(T([[-4 - k * 5, -4.5], [-6 - k * 5, 4.5]]), false), 1, 0.25);
    L.dome(...T([[-grip - 6, 0]])[0], 9, { albedo: '#6e5a32', base: z + 0.14, peak: z + 0.3, kind: 'gold', metal: 0.9, rough: 0.42 });
  }
  function heaterShield(L, x, y, s, rot, z, o = {}) {
    const f = F(); const c1 = hex(o.c1 || '#4e1214'), c2 = hex(o.c2 || '#a88a48');
    const shape = (ctx) => { ctx.beginPath(); ctx.moveTo(-50 * s, -52 * s); ctx.lineTo(50 * s, -52 * s); ctx.quadraticCurveTo(52 * s, 20 * s, 0, 64 * s); ctx.quadraticCurveTo(-52 * s, 20 * s, -50 * s, -52 * s); ctx.closePath(); };
    local(L, x, y, rot, shape, (u, v, px, gx, gy) => {
      const chevron = v > -Math.abs(u) * 0.9 + 4 * s && v < -Math.abs(u) * 0.9 + 26 * s;
      let c = chevron ? c2 : c1;
      const n = sample(f.mid, gx * 1.6, gy * 1.6), hi = sample(f.high, gx * 2, gy * 2);
      c = shade(c, 0.76 + 0.35 * n);
      if (hi > 0.83 && n > 0.45) c = [104, 88, 70];
      const du = u / (52 * s); px.rgb = c; px.h = z + 0.14 * Math.sqrt(Math.max(0, 1 - du * du)) * (1 - Math.max(0, v / (70 * s)) * 0.4); px.hMode = 'set';
      px.kind = chevron ? 'gold' : 'paint'; px.metal = chevron ? 0.85 : 0; px.rough = chevron ? 0.45 : 0.6;
    });
    L.stroke((ctx) => { ctx.translate(x, y); ctx.rotate(rot); shape(ctx); }, 6 * s, { albedo: '#34302c', height: z + 0.16, kind: 'iron', metal: 0.85, rough: 0.5 });
    for (const [u, v] of [[-44, -46], [44, -46], [0, 56], [-36, 14], [36, 14]]) rivet(L, ...localPts(x, y, rot, s, [[u, v]])[0], 2.6 * s, { base: z + 0.16, peak: z + 0.24 });
  }
  function greatHelm(L, x, y, s, z) {
    const f = F();
    const shape = (ctx) => { ctx.beginPath(); ctx.moveTo(x - 34 * s, y + 34 * s); ctx.lineTo(x - 36 * s, y - 20 * s); ctx.quadraticCurveTo(x - 34 * s, y - 42 * s, x, y - 44 * s); ctx.quadraticCurveTo(x + 34 * s, y - 42 * s, x + 36 * s, y - 20 * s); ctx.lineTo(x + 34 * s, y + 34 * s); ctx.closePath(); };
    L.paint(shape, (gx, gy, px) => { const du = (gx - x) / (36 * s); const n = sample(f.mid, gx * 1.8, gy * 1.8), rust = smooth(0.62, 0.8, sample(f.low, gx * 2.5, gy * 2.5)); let c = shade([118, 120, 124], 0.8 + 0.3 * n - 0.25 * du * du); c = mix(c, [96, 52, 30], rust * 0.6); px.rgb = c; px.h = z + 0.2 * Math.sqrt(Math.max(0, 1 - du * du)); px.hMode = 'set'; px.kind = 'silver'; px.metal = 0.95 - rust * 0.6; px.rough = 0.36 + rust * 0.4; });
    L.engraveFill((ctx) => { ctx.beginPath(); ctx.roundRect(x - 28 * s, y - 8 * s, 56 * s, 7 * s, 2); }, 0.6, { albedo: '#0c0c0e' });
    L.stroke(poly([[x, y - 44 * s], [x, y + 34 * s]], false), 6 * s, { albedo: '#7e8288', height: z + 0.22, kind: 'silver', metal: 0.95, rough: 0.3 });
    for (let row = 0; row < 3; row += 1) for (let k = 0; k < 4; k += 1) L.engraveFill(circle(1.8 * s, x + 10 * s + k * 5 * s, y + 8 * s + row * 6 * s), 0.6, { albedo: '#0c0c0e' });
    for (const d of [-1, 1]) for (const v of [-30, 26]) rivet(L, x + d * 30 * s, y + v * s, 2.4 * s, { base: z + 0.18, peak: z + 0.26 });
    for (const [u, v, r2] of [[-18, 18, 5], [14, -26, 4]]) L.engraveFill((ctx) => { ctx.beginPath(); ctx.ellipse(x + u * s, y + v * s, r2 * s, r2 * 0.6 * s, 0.4, 0, TAU); }, 0.05);
  }
  function axe(L, x0, y0, x1, y1, z) {
    const a = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
    const T = (pts) => localPts(x0, y0, a, 1, pts); const f = F();
    L.taper(T([[0, 0], [len + 6, 0]]), [9, 8], { albedo: '#4e3220', base: z + 0.06, peak: z + 0.16, kind: 'wood', rough: 0.6 });
    for (let k = 0; k < 7; k += 1) L.engrave(poly(T([[10 + k * 6, -4.5], [13 + k * 6, 4.5]]), false), 1.2, 0.3);
    const head = [[len - 20, 5], [len - 22, -12], [len - 36, -30], [len - 34, -56], [len - 8, -62], [len + 10, -54], [len + 14, -34], [len + 8, -12], [len + 10, 5]];
    pillow(L, smoothPath(T(head), true), { base: z + 0.14, lift: 0.1, radius: 8, kind: 'iron', metal: 0.9, rough: 0.46, color: (gx, gy) => { const n = sample(f.mid, gx * 2.4, gy * 2.4), h2 = sample(f.high, gx * 1.8, gy * 1.8); let c = shade([74, 76, 80], 0.75 + 0.4 * n); if (h2 > 0.8) c = shade(c, 0.8); return c; } });
    L.stroke(smoothPath(T([[len - 36, -30], [len - 34, -56], [len - 8, -62], [len + 10, -54]])), 4, { albedo: '#b8bcc0', height: z + 0.24, kind: 'silver', metal: 0.95, rough: 0.18 });
    L.fill(roundRectAt(...T([[len - 5, 0]])[0], 16, 14, a, 2), { albedo: '#2e2a28', height: z + 0.22, kind: 'iron', metal: 0.85, rough: 0.5, op: 'source-over' });
    L.dome(...T([[len - 5, 0]])[0], 3, { albedo: '#5a524c', base: z + 0.24, peak: z + 0.3, kind: 'iron', metal: 0.85, rough: 0.45 });
  }

  /* ---------- or, cuir, divers ---------- */
  function coin(L, x, y, r, z, tilt = 0.75) {
    L.ellipse(x, y + 2, r, r * tilt, 0, { albedo: '#6a4a1c', base: z, peak: z + 0.04, kind: 'gold', metal: 0.9, rough: 0.4 });
    L.ellipse(x, y, r, r * tilt, 0, { albedo: '#b8923e', base: z + 0.03, peak: z + 0.07, kind: 'gold', metal: 0.95, rough: 0.32 });
    L.engrave((ctx) => { ctx.beginPath(); ctx.ellipse(x, y, r * 0.72, r * 0.72 * tilt, 0, 0, TAU); }, 0.8, 0.25);
    L.engraveFill(circle(r * 0.22, x, y), 0.12);
  }
  function coinPile(L, x, y, n, spread, z) {
    const r = rng(Math.round(x * 7 + n)); const pts = [];
    for (let k = 0; k < n; k += 1) pts.push([x + (r() - 0.5) * spread, y + (r() - 0.5) * spread * 0.3, 9 + r() * 2.5]);
    pts.sort((p, q) => p[1] - q[1]).forEach(([cx, cy, cr], k) => coin(L, cx, cy, cr, z + k * 0.006, 0.55 + r() * 0.35));
  }
  function coinStack(L, x, y, n, z) { for (let k = 0; k < n; k += 1) coin(L, x + (k % 2 ? 0.8 : -0.8), y - k * 4, 12, z + k * 0.02, 0.4); }
  function pouch(L, x, y, s, z, col = '#4a2e1c') {
    const f = F(); const c0 = hex(col);
    const path = smoothPath([[x - 30 * s, y + 26 * s], [x - 38 * s, y], [x - 22 * s, y - 20 * s], [x - 10 * s, y - 27 * s], [x - 2 * s, y - 36 * s], [x + 8 * s, y - 28 * s], [x + 22 * s, y - 20 * s], [x + 38 * s, y], [x + 30 * s, y + 26 * s]], true);
    pillow(L, path, { base: z, lift: 0.26, radius: 26 * s, kind: 'leather', rough: 0.62, color: (gx, gy, t) => { const fold = Math.sin((gx - x) * 0.32 / s + sample(f.mid, gx, gy) * 3) * smooth(y - 6 * s, y - 28 * s, gy); return shade(leatherTex(c0, gx, gy, f), (0.62 + 0.42 * t) * (1 + 0.12 * fold)); } });
    L.stroke(smoothPath([[x - 22 * s, y - 20 * s], [x, y - 15 * s], [x + 22 * s, y - 20 * s]]), 3.2 * s, { albedo: '#a08a58', height: z + 0.3, kind: 'cloth', rough: 0.9 });
    L.taper([[x + 18 * s, y - 19 * s], [x + 30 * s, y - 33 * s], [x + 24 * s, y - 44 * s]], [3 * s, 2 * s], { albedo: '#a08a58', base: z + 0.24, peak: z + 0.32, kind: 'cloth', rough: 0.9 });
    L.stroke(smoothPath([[x - 34 * s, y + 4 * s], [x, y + 14 * s], [x + 34 * s, y + 4 * s]]), 1, { albedo: '#c0a878', keepMaterial: true, dash: [2, 3] });
    coin(L, x - 4 * s, y - 24 * s, 7 * s, z + 0.28, 0.5);
  }
  function dagger(L, x0, y0, x1, y1, z) {
    const a = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
    const T = (pts) => localPts(x0, y0, a, 1, pts);
    L.fill(poly(T([[0, -6], [len * 0.7, -4.5], [len, 0], [len * 0.7, 4.5], [0, 6]])), { albedo: '#969ca2', height: z + 0.08, kind: 'silver', metal: 0.95, rough: 0.26, op: 'source-over' });
    L.engrave(poly(T([[4, 0], [len * 0.75, 0]]), false), 1.2, 0.3);
    L.taper(T([[0, -14], [0, 14]]), [5, 5], { albedo: '#262222', base: z + 0.14, peak: z + 0.22, kind: 'iron', metal: 0.85, rough: 0.5 });
    L.taper(T([[-2, 0], [-28, 0]]), [7, 6], { albedo: '#1c120e', base: z + 0.12, peak: z + 0.2, kind: 'leather', rough: 0.7 });
    gem(L, ...T([[-32, 0]])[0], 5, { color: '#5e0c16', cut: 'cabochon', setting: 1.6, setKind: 'silver', setAlbedo: '#62666c', base: z + 0.14, lift: 0.14 });
  }
  function crown(L, x, y, s, rot, z) {
    const T = (pts) => localPts(x, y, rot, s, pts);
    L.fill(poly(T([[-40, 10], [-40, -10], [-30, -30], [-20, -12], [-10, -36], [0, -14], [10, -36], [20, -12], [30, -30], [40, -10], [40, 10]])), { albedo: '#a8843a', height: z + 0.16, kind: 'gold', metal: 0.95, rough: 0.32, op: 'source-over' });
    L.fill(poly(T([[-40, -2], [40, -2], [40, 10], [-40, 10]])), { albedo: '#b48e40', height: linearStyle(...T([[0, -2]])[0], ...T([[0, 10]])[0], [[0, z + 0.2], [0.5, z + 0.24], [1, z + 0.2]]), kind: 'gold', metal: 0.95, rough: 0.3, op: 'source-over' });
    for (const [u, c] of [[-24, '#5e0c16'], [0, '#1a4478'], [24, '#1a5a3a']]) gem(L, ...T([[u, 4]])[0], 4.2 * s, { color: c, cut: 'cabochon', setting: 1.2, setAlbedo: '#a8843a', base: z + 0.24, lift: 0.12 });
    for (const u of [-30, -10, 10, 30]) L.dome(...T([[u, u % 20 === 0 ? -30 : -36]])[0], 3.4 * s, { albedo: '#d8d0c0', base: z + 0.18, peak: z + 0.26, kind: 'glass', rough: 0.15 });
  }
  function barrel(L, x, y, w, h, z) {
    const f = F();
    const hoops = [-0.62, -0.42, 0.42, 0.62];
    L.paint((ctx) => { ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TAU); }, (gx, gy, px) => {
      const du = (gx - x) / (w / 2), dv = (gy - y) / (h / 2);
      const stave = Math.floor((du + 1) * 5); const fs = (du + 1) * 5 - stave; const gap = smooth(0, 0.08, Math.min(fs, 1 - fs));
      let c = woodTex([100, 66, 38], gy, gx, f, stave); c = shade(c, gap * (1 - 0.45 * Math.abs(du)) * (0.85 + 0.2 * rng(stave + 3)()));
      let hh = z + 0.26 * Math.sqrt(Math.max(0, 1 - du * du)) * (0.85 + 0.15 * Math.sqrt(Math.max(0, 1 - dv * dv)));
      let kind = 'wood', metal = 0, rough = 0.66;
      for (const t of hoops) { const d = Math.abs(dv - t); if (d < 0.065) { const band = 1 - d / 0.065; const n = sample(f.mid, gx * 2, gy * 2); c = mix(shade([62, 58, 56], 0.8 + 0.4 * n), [90, 50, 28], smooth(0.6, 0.8, n) * 0.6); hh += 0.02 + 0.01 * band; kind = 'iron'; metal = 0.8; rough = 0.5; } }
      px.rgb = c; px.h = hh; px.hMode = 'set'; px.kind = kind; px.metal = metal; px.rough = rough;
    });
    for (const t of hoops) for (const du of [-0.7, 0, 0.7]) rivet(L, x + du * w / 2 * 0.95, y + t * h / 2, 2, { base: z + 0.24, peak: z + 0.3 });
    L.taper([[x + w * 0.12, y + h * 0.08], [x + w * 0.12, y + h * 0.24]], [8, 6], { albedo: '#8a6a34', base: z + 0.28, peak: z + 0.36, kind: 'gold', metal: 0.9, rough: 0.36 });
    L.dome(x + w * 0.12, y + h * 0.06, 5, { albedo: '#8a6a34', base: z + 0.3, peak: z + 0.38, kind: 'gold', metal: 0.9, rough: 0.36 });
  }
  function tankard(L, x, y, s, z) {
    const f = F();
    L.taper(bezierPts([x + 14 * s, y - 38 * s], [x + 36 * s, y - 40 * s], [x + 36 * s, y - 8 * s], [x + 14 * s, y - 10 * s], 24), [7 * s, 7 * s], { albedo: '#5a3a22', base: z + 0.08, peak: z + 0.2, kind: 'wood', rough: 0.6 });
    L.paint((ctx) => { ctx.beginPath(); ctx.moveTo(x - 18 * s, y); ctx.lineTo(x - 16 * s, y - 44 * s); ctx.lineTo(x + 16 * s, y - 44 * s); ctx.lineTo(x + 18 * s, y); ctx.closePath(); }, (gx, gy, px) => {
      const du = (gx - x) / (18 * s); const st = Math.floor((du + 1) * 3.5); const fs = (du + 1) * 3.5 - st; const gap = smooth(0, 0.1, Math.min(fs, 1 - fs));
      let c = shade(woodTex([112, 74, 42], gy, gx, f, st), gap * (1 - 0.4 * du * du)); let hh = z + 0.2 * Math.sqrt(Math.max(0, 1 - du * du)); let kind = 'wood', metal = 0, rough = 0.6;
      for (const hy of [y - 7 * s, y - 36 * s]) if (Math.abs(gy - hy) < 3 * s) { c = shade([58, 54, 52], 0.9 + 0.2 * sample(f.mid, gx * 2, gy * 2)); hh += 0.02; kind = 'iron'; metal = 0.8; rough = 0.5; }
      px.rgb = c; px.h = hh; px.hMode = 'set'; px.kind = kind; px.metal = metal; px.rough = rough;
    });
    const r = rng(Math.round(x * 3 + y));
    const pts = [[x - 19 * s, y - 42 * s]]; for (let k = 0; k <= 8; k += 1) pts.push([x - 19 * s + k * 4.75 * s, y - 50 * s - (4 + 5 * r()) * s]); pts.push([x + 19 * s, y - 42 * s], [x + 12 * s, y - 38 * s], [x - 12 * s, y - 38 * s]);
    pillow(L, smoothPath(pts, true), { base: z + 0.18, lift: 0.1, radius: 7 * s, kind: 'cloth', rough: 0.75, color: (gx, gy, t) => { const b = sample(f.fine, gx * 1.4, gy * 1.4); return shade([218, 204, 172], (0.72 + 0.28 * t) * (b > 0.82 ? 0.82 : 1)); } });
    L.taper([[x - 16 * s, y - 42 * s], [x - 17 * s, y - 28 * s]], (t) => (4 - 1.5 * t + 1.5 * smooth(0.8, 1, t)) * s, { albedo: '#cfc09a', base: z + 0.2, peak: z + 0.26, kind: 'cloth', rough: 0.75 });
  }
  function wineBottle(L, x, y, s, rot, z) {
    const f = F();
    local(L, x, y, rot, (ctx) => { ctx.beginPath(); ctx.roundRect(-14 * s, -50 * s, 28 * s, 50 * s, 6 * s); ctx.moveTo(-5 * s, -48 * s); ctx.rect(-5 * s, -80 * s, 10 * s, 32 * s); }, (u, v, px, gx, gy) => {
      const du = u / (14 * s); const streak = Math.exp(-(((u + 7 * s) / (1.6 * s)) ** 2)) * 0.7;
      let c = mix([16 + 10 * (1 - du * du), 28 + 14 * (1 - du * du), 16 + 6 * (1 - du * du)], [210, 220, 200], streak * 0.5);
      c = mix(c, [120, 110, 96], smooth(0.55, 0.75, sample(f.mid, gx * 2, gy * 2)) * 0.35);
      const label = v > -38 * s && v < -12 * s && Math.abs(u) < 13 * s; if (label) { const n = sample(f.mid, gx * 2, gy * 2); c = [184 - 34 * n, 168 - 34 * n, 126 - 34 * n]; if (Math.abs(v + 25 * s) < 2 * s) c = [84, 28, 20]; }
      px.rgb = c; px.h = z + 0.18 * Math.sqrt(Math.max(0, 1 - du * du)); px.hMode = 'set'; px.kind = label ? 'cloth' : 'glass'; px.metal = 0; px.rough = label ? 0.9 : 0.08;
    });
    const [cx, cy] = localPts(x, y, rot, s, [[0, -80]])[0];
    L.fill(roundRectAt(cx, cy, 12 * s, 10 * s, rot, 2), { albedo: '#4e1210', height: z + 0.2, kind: 'wax', rough: 0.36, op: 'source-over' });
    L.taper([localPts(x, y, rot, s, [[3, -76]])[0], localPts(x, y, rot, s, [[4, -64]])[0]], [3.4 * s, 2 * s], { albedo: '#4e1210', base: z + 0.19, peak: z + 0.24, kind: 'wax', rough: 0.36 });
  }
  function amphora(L, x, y, s, z) {
    const f = F();
    const shape = (ctx) => { ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 88 * s); ctx.lineTo(x + 9 * s, y - 88 * s); ctx.lineTo(x + 8 * s, y - 72 * s); ctx.quadraticCurveTo(x + 36 * s, y - 62 * s, x + 32 * s, y - 30 * s); ctx.quadraticCurveTo(x + 26 * s, y - 4 * s, x + 12 * s, y); ctx.lineTo(x - 12 * s, y); ctx.quadraticCurveTo(x - 26 * s, y - 4 * s, x - 32 * s, y - 30 * s); ctx.quadraticCurveTo(x - 36 * s, y - 62 * s, x - 8 * s, y - 72 * s); ctx.closePath(); };
    for (const d of [-1, 1]) L.taper([[x + d * 8 * s, y - 78 * s], [x + d * 28 * s, y - 80 * s], [x + d * 26 * s, y - 60 * s]], [5 * s, 4 * s], { albedo: '#7a4020', base: z + 0.08, peak: z + 0.18, kind: 'stone', rough: 0.7 });
    L.paint(shape, (gx, gy, px) => {
      const du = (gx - x) / (34 * s); const n = sample(f.mid, gx * 1.8, gy * 1.8);
      let c = [140 + 30 * n, 74 + 20 * n, 40 + 12 * n];
      const vy = (y - gy) / s;
      if (vy > 34 && vy < 58) { c = [26, 20, 16]; const cx = ((gx - x) / s + 60) % 22; const fig = Math.abs(cx - 11) < 4 + 3 * Math.sin(vy * 0.3) && vy > 38 && vy < 54; if (fig) c = [140 + 30 * n, 74 + 20 * n, 40 + 12 * n]; }
      if (Math.abs(vy - 32) < 1.4 || Math.abs(vy - 60) < 1.4) c = [26, 20, 16];
      if (sample(f.high, gx * 2, gy * 2) > 0.88 && n > 0.5) c = [176, 140, 104];
      px.rgb = c.map((v) => v * (0.66 + 0.4 * (1 - du * du))); px.h = z + 0.22 * Math.sqrt(Math.max(0, 1 - du * du)); px.hMode = 'set'; px.kind = 'stone'; px.metal = 0; px.rough = 0.6;
    });
  }
  function hourglass(L, x, y, s, z) {
    const f = F();
    for (const dy of [-34, 34]) pillow(L, roundRectAt(x, y + dy * s, 52 * s, 9 * s, 0, 3), { base: z + 0.14, lift: 0.08, radius: 4 * s, kind: 'wood', rough: 0.55, color: (gx, gy, t) => shade(woodTex([92, 58, 32], gx, gy, f, dy), 0.7 + 0.35 * t) });
    const glass = (ctx) => { ctx.beginPath(); ctx.moveTo(x - 17 * s, y - 30 * s); ctx.quadraticCurveTo(x - 16 * s, y - 6 * s, x - 2 * s, y); ctx.quadraticCurveTo(x - 16 * s, y + 6 * s, x - 17 * s, y + 30 * s); ctx.lineTo(x + 17 * s, y + 30 * s); ctx.quadraticCurveTo(x + 16 * s, y + 6 * s, x + 2 * s, y); ctx.quadraticCurveTo(x + 16 * s, y - 6 * s, x + 17 * s, y - 30 * s); ctx.closePath(); };
    const d = distanceField(glass);
    L.paint(glass, (gx, gy, px) => {
      const rim = Math.exp(-d[gy * W + gx] / (1.5 * s)); const sandTop = gy < y - 6 * s && gy > y - 18 * s && Math.abs(gx - x) < (gy - (y - 18 * s)) * 1.3 + 2; const sandBot = gy > y + 12 * s && Math.abs(gx - x) < (gy - (y + 12 * s)) * 1.1 + 2;
      const stream = Math.abs(gx - x) < 0.8 && gy > y - 6 * s && gy < y + 26 * s;
      let c = mix([30, 34, 38], [196, 206, 212], rim * 0.55);
      if (sandTop || sandBot || stream) c = shade([196, 158, 98], 0.85 + 0.2 * sample(f.fine, gx * 2, gy * 2));
      c = mix(c, [255, 250, 240], Math.exp(-(((gx - (x - 9 * s)) / (1.3 * s)) ** 2)) * 0.45);
      px.rgb = c; px.h = z + 0.14; px.hMode = 'set'; px.kind = sandTop || sandBot ? 'stone' : 'glass'; px.metal = 0; px.rough = sandTop || sandBot ? 0.9 : 0.05;
    });
    for (const dx of [-22, 22]) L.taper([[x + dx * s, y - 30 * s], [x + dx * s, y + 30 * s]], (t) => (4.5 + 1.8 * Math.sin(t * Math.PI * 4) ** 2) * s, { albedo: '#5a3a20', base: z + 0.14, peak: z + 0.24, kind: 'wood', rough: 0.55 });
  }
  function casket(L, x, y, s, z) {
    const f = F();
    L.paint(poly([[x - 40 * s, y - 26 * s], [x + 40 * s, y - 26 * s], [x + 34 * s, y - 62 * s], [x - 34 * s, y - 62 * s]]), (gx, gy, px) => { const inner = gx > x - 30 * s && gx < x + 30 * s && gy > y - 56 * s && gy < y - 30 * s; px.rgb = inner ? shade([74, 16, 24], 0.8 + 0.3 * sample(f.mid, gx * 2, gy * 2)) : woodTex([70, 38, 24], gx, gy, f, 5); px.h = z + (inner ? 0.07 : 0.09); px.hMode = 'set'; px.kind = inner ? 'cloth' : 'wood'; px.metal = 0; px.rough = inner ? 0.9 : 0.45; });
    pillow(L, roundRectAt(x, y - 8 * s, 82 * s, 38 * s, 0, 3), { base: z + 0.1, lift: 0.06, radius: 5 * s, kind: 'wood', rough: 0.42, color: (gx, gy, t) => shade(woodTex([84, 46, 28], gy, gx, f, 9), 0.7 + 0.3 * t) });
    for (const dx of [-38, 38]) L.fill(roundRectAt(x + dx * s, y - 8 * s, 8 * s, 38 * s, 0, 1), { albedo: '#9c7a3a', height: z + 0.18, kind: 'gold', metal: 0.9, rough: 0.4, op: 'source-over' });
    L.fill(roundRectAt(x, y - 22 * s, 82 * s, 6 * s, 0, 1), { albedo: '#9c7a3a', height: z + 0.18, kind: 'gold', metal: 0.9, rough: 0.4, op: 'source-over' });
    L.fill(roundRectAt(x, y - 10 * s, 13 * s, 15 * s, 0, 2), { albedo: '#a8843e', height: z + 0.2, kind: 'gold', metal: 0.9, rough: 0.36, op: 'source-over' });
    L.engraveFill((ctx) => { ctx.beginPath(); ctx.arc(x, y - 12 * s, 2 * s, 0, TAU); ctx.rect(x - 0.8 * s, y - 12 * s, 1.6 * s, 5 * s); }, 0.6, { albedo: '#140a06' });
    const pts = bezierPts([x - 22 * s, y - 30 * s], [x - 12 * s, y + 6 * s], [x + 30 * s, y + 22 * s], [x + 56 * s, y + 18 * s], 11);
    pts.forEach(([px2, py2], k) => L.dome(px2, py2, 4.6 * s, { albedo: '#bdb4a0', base: z + 0.22 + k * 0.003, peak: z + 0.32 + k * 0.003, kind: 'glass', rough: 0.16 }));
    L.torus(x - 30 * s, y + 18 * s, 7 * s, 5 * s, 0.3, 0.3, { albedo: '#b08a3e', base: z + 0.2, peak: z + 0.28, kind: 'gold', metal: 0.95, rough: 0.3 });
    gem(L, x - 30 * s, y + 12 * s, 3.4 * s, { color: '#1a4478', cut: 'cabochon', setting: 1, setAlbedo: '#b08a3e', base: z + 0.26, lift: 0.1 });
  }
  function basket(L, x, y, w, h, z) {
    const f = F();
    const shape = (ctx) => { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x + w / 2, y - h / 2); ctx.quadraticCurveTo(x + w * 0.46, y + h / 2, x + w * 0.36, y + h / 2); ctx.lineTo(x - w * 0.36, y + h / 2); ctx.quadraticCurveTo(x - w * 0.46, y + h / 2, x - w / 2, y - h / 2); ctx.closePath(); };
    L.paint(shape, (gx, gy, px) => {
      const u = (gx - x), v = (gy - (y - h / 2));
      const row = Math.floor(v / 7); const fr = v / 7 - row; const col = Math.floor((u + 400) / 12); const over = (row + col) % 2 === 0;
      const strand = Math.sin(Math.PI * fr); const stake = Math.abs(((u + 400) % 12) - 6) < 1.6;
      const n = sample(f.mid, gx * 2, gy * 2);
      let c = [146 * (0.7 + 0.35 * n), 106 * (0.7 + 0.35 * n), 56 * (0.7 + 0.35 * n)];
      let hh = z + 0.08 + 0.04 * strand + (over ? 0.02 : 0);
      if (stake && !over) { c = c.map((vv) => vv * 0.6); hh -= 0.02; }
      c = shade(c, (0.6 + 0.4 * strand) * (0.8 + 0.25 * (1 - (u / (w / 2)) ** 2)));
      px.rgb = c; px.h = hh + 0.1 * (1 - (u / (w / 2)) ** 2); px.hMode = 'set'; px.kind = 'wood'; px.metal = 0; px.rough = 0.8;
    });
    L.tube(poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2]], false), 8, { albedo: '#8a6636', base: z + 0.16, peak: z + 0.28, kind: 'wood', rough: 0.7 });
  }
  function sack(L, x, y, w, h, z, col = '#8a7652') {
    const f = F(); const c0 = hex(col);
    const path = (ctx) => { ctx.beginPath(); ctx.moveTo(x - w * 0.14, y - h * 0.42); ctx.quadraticCurveTo(x - w * 0.62, y - h * 0.1, x - w * 0.46, y + h / 2); ctx.lineTo(x + w * 0.46, y + h / 2); ctx.quadraticCurveTo(x + w * 0.62, y - h * 0.1, x + w * 0.14, y - h * 0.42); ctx.closePath(); };
    const folds = (gx, gy) => Math.sin((gx - x) * 0.25 + sample(f.mid, gx, gy) * 4) * smooth(y - h * 0.05, y - h * 0.42, gy);
    pillow(L, path, { base: z, lift: 0.28, radius: w * 0.42, kind: 'cloth', rough: 0.92, color: (gx, gy, t) => shade(burlapTex(c0, gx, gy, f), (0.6 + 0.45 * t) * (1 + 0.14 * folds(gx, gy))), bump: (gx, gy) => 0.012 * folds(gx, gy) });
    pillow(L, (ctx) => { ctx.beginPath(); ctx.ellipse(x, y - h * 0.46, w * 0.2, h * 0.08, 0, 0, TAU); }, { base: z + 0.22, lift: 0.06, radius: 5, kind: 'cloth', rough: 0.92, color: (gx, gy, t) => shade(burlapTex(c0, gx, gy, f), 0.6 + 0.3 * t) });
    L.tube(poly([[x - w * 0.16, y - h * 0.38], [x + w * 0.16, y - h * 0.38]], false), 4, { albedo: '#5a4a2c', base: z + 0.24, peak: z + 0.3, kind: 'cloth', rough: 0.9 });
    const r = rng(Math.round(x + y));
    for (let k = 0; k < 11; k += 1) L.ellipse(x + (r() - 0.5) * w * 0.34, y - h * 0.47 - r() * 6, 3.2, 2.2, r() * 3, { albedo: ['#c9a85c', '#b8964e', '#d6b870'][k % 3], base: z + 0.28, peak: z + 0.33, kind: 'organic', rough: 0.7 });
  }

  /* ---------- colporteur (marché ambulant) ---------- */
  function wheel(L, cx, cy, R, o = {}) {
    const f = F(); const z = o.z ?? 0.3; const n = o.spokes || 12;
    const wood = hex(o.wood || '#6a4a2c');
    for (let k = 0; k < n; k += 1) { if (o.skip && o.skip.includes(k)) continue; const a = (k / n) * TAU + (o.phase || 0); L.taper([[cx + Math.cos(a) * R * 0.16, cy + Math.sin(a) * R * 0.16], [cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86]], (t) => R * (0.075 - 0.02 * t) + 2, { albedo: o.spokeCol || '#5e3e24', base: z, peak: z + 0.12, kind: 'wood', rough: 0.62 }); }
    L.paint((ctx) => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.arc(cx, cy, R * 0.82, 0, TAU, true); }, (x, y, px) => {
      const rr = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx); const u = (rr - R * 0.82) / (R * 0.18);
      const tire = u > 0.78; const seg = Math.floor(((a + Math.PI) / TAU) * 6); const fs = ((a + Math.PI) / TAU) * 6 - seg; const joint = Math.min(fs, 1 - fs) * R * 1.05 < 1.4;
      let c; let kind = 'wood', metal = 0, rough = 0.66;
      if (tire) { const nn = sample(f.mid, x * 2, y * 2); c = mix(shade([60, 56, 54], 0.85 + 0.3 * nn), [96, 54, 30], smooth(0.58, 0.78, nn) * 0.6); kind = 'iron'; metal = 0.8; rough = 0.5; }
      else { c = woodTex(wood, a * R, rr, f, seg); if (joint) c = shade(c, 0.4); }
      const mud = smooth(0.2, 0.9, (y - cy) / R) * smooth(0.45, 0.7, sample(f.low, x * 3, y * 3)) * (o.mud ?? 0.7);
      c = mix(c, [58, 44, 30], mud);
      px.rgb = c; px.h = z + 0.1 + 0.08 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) + (tire ? 0.02 : 0); px.hMode = 'set'; px.kind = kind; px.metal = metal; px.rough = rough;
    }, { rule: 'evenodd' });
    for (let k = 0; k < 12; k += 1) { const a = (k / 12) * TAU + 0.26; rivet(L, cx + Math.cos(a) * R * 0.955, cy + Math.sin(a) * R * 0.955, Math.max(1.6, R * 0.025), { base: z + 0.2, peak: z + 0.26 }); }
    if (o.hub !== false) {
      L.dome(cx, cy, R * 0.18, { albedo: '#5a3a22', base: z + 0.1, peak: z + 0.26, kind: 'wood', rough: 0.6 });
      L.torus(cx, cy, R * 0.15, R * 0.15, 0, 0.25, { albedo: '#3a3431', base: z + 0.2, peak: z + 0.28, kind: 'iron', metal: 0.85, rough: 0.5 });
      L.dome(cx, cy, R * 0.07, { albedo: '#3a3431', base: z + 0.24, peak: z + 0.32, kind: 'iron', metal: 0.85, rough: 0.45 });
    }
  }
  function backpack(L, x, y, s, z) {
    const f = F();
    pillow(L, (ctx) => { ctx.beginPath(); ctx.roundRect(x - 52 * s, y - 50 * s, 104 * s, 104 * s, 26 * s); }, { base: z, lift: 0.22, radius: 26 * s, kind: 'cloth', rough: 0.9, color: (gx, gy, t) => mix(shade(burlapTex([126, 104, 70], gx, gy, f), 0.6 + 0.45 * t), [70, 54, 36], smooth(0.6, 0.78, sample(f.low, gx * 3, gy * 3)) * 0.5) });
    pillow(L, (ctx) => { ctx.beginPath(); ctx.roundRect(x - 32 * s, y + 4 * s, 64 * s, 40 * s, 10 * s); }, { base: z + 0.16, lift: 0.08, radius: 8 * s, kind: 'cloth', rough: 0.9, color: (gx, gy, t) => shade(burlapTex([112, 92, 62], gx, gy, f), 0.6 + 0.4 * t) });
    pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(x - 50 * s, y - 48 * s); ctx.lineTo(x + 50 * s, y - 48 * s); ctx.lineTo(x + 46 * s, y - 8 * s); ctx.quadraticCurveTo(x, y + 4 * s, x - 46 * s, y - 8 * s); ctx.closePath(); }, { base: z + 0.18, lift: 0.08, radius: 8 * s, kind: 'leather', rough: 0.6, color: (gx, gy, t) => shade(leatherTex([86, 52, 30], gx, gy, f), 0.6 + 0.45 * t) });
    for (const d of [-1, 1]) {
      L.fill(roundRectAt(x + d * 26 * s, y - 2 * s, 10 * s, 64 * s, 0, 2), { albedo: '#3e2616', height: z + 0.3, kind: 'leather', rough: 0.6, op: 'source-over' });
      L.stroke(roundRectAt(x + d * 26 * s, y + 22 * s, 13 * s, 10 * s, 0, 1), 2, { albedo: '#8a7a5a', height: z + 0.33, kind: 'silver', metal: 0.8, rough: 0.4 });
    }
    L.stroke(smoothPath([[x - 44 * s, y - 12 * s], [x, y - 2 * s], [x + 44 * s, y - 12 * s]]), 1, { albedo: '#c0a878', keepMaterial: true, dash: [2, 3] });
  }
  function blanketRoll(L, x, y, w, t, rot, z, stripes = [[196, 176, 136], [118, 34, 26], [40, 52, 70]]) {
    const f = F();
    local(L, x, y, rot, roundRect(w, t, t * 0.5), (u, v, px, gx, gy) => {
      const fv = v / (t / 2); const prof = Math.sqrt(Math.max(0, 1 - fv * fv));
      let c = stripes[Math.floor((u + w) / 9) % 3];
      c = shade(c, (0.62 + 0.4 * prof) * (0.85 + 0.25 * sample(f.mid, gx * 2, gy * 2)));
      const end = w / 2 - Math.abs(u); if (end < t * 0.5) { const rr = Math.hypot(t * 0.5 - end, v); c = shade(c, 0.6 + 0.3 * (0.5 + 0.5 * Math.sin(rr * 1.5))); }
      px.rgb = c; px.h = z + 0.16 * prof; px.hMode = 'set'; px.kind = 'cloth'; px.metal = 0; px.rough = 0.92;
    });
    for (const d of [-0.28, 0.28]) { const [bx, by] = localPts(x, y, rot, 1, [[w * d, 0]])[0]; L.fill(roundRectAt(bx, by, 8, t + 6, rot, 2), { albedo: '#3e2616', height: z + 0.18, kind: 'leather', rough: 0.6, op: 'source-over' }); }
  }
  function pot(L, x, y, s, z) {
    const f = F();
    L.taper(bezierPts([x - 30 * s, y - 26 * s], [x - 26 * s, y - 64 * s], [x + 26 * s, y - 64 * s], [x + 30 * s, y - 26 * s], 30), [3.4 * s, 3.4 * s], { albedo: '#34302c', base: z + 0.04, peak: z + 0.12, kind: 'iron', metal: 0.8, rough: 0.5 });
    pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(x - 34 * s, y - 28 * s); ctx.quadraticCurveTo(x - 36 * s, y + 10 * s, x, y + 12 * s); ctx.quadraticCurveTo(x + 36 * s, y + 10 * s, x + 34 * s, y - 28 * s); ctx.closePath(); }, { base: z, lift: 0.22, radius: 22 * s, kind: 'iron', metal: 0.7, rough: 0.7, color: (gx, gy, t) => mix(shade([56, 52, 50], 0.7 + 0.4 * t), [20, 18, 16], smooth(0.4, 0.8, sample(f.mid, gx * 2, gy * 2)) * 0.6) });
    L.ellipse(x, y - 28 * s, 36 * s, 7 * s, 0, { albedo: '#403a36', flat: z + 0.2, kind: 'iron', metal: 0.8, rough: 0.5 });
    L.ellipse(x, y - 28 * s, 30 * s, 4.6 * s, 0, { albedo: '#141210', flat: z + 0.16, kind: 'iron', metal: 0.5, rough: 0.8 });
    for (const d of [-1, 1]) L.torus(x + d * 33 * s, y - 26 * s, 4 * s, 4 * s, 0, 0.4, { albedo: '#34302c', base: z + 0.18, peak: z + 0.26, kind: 'iron', metal: 0.8, rough: 0.5 });
  }
  function pan(L, x, y, r, rot, z) {
    const f = F();
    const [hx, hy] = [x + Math.cos(rot) * (r + 50), y + Math.sin(rot) * (r + 50)];
    L.taper([[x + Math.cos(rot) * r * 0.8, y + Math.sin(rot) * r * 0.8], [hx, hy]], [9, 7], { albedo: '#2e2a28', base: z + 0.06, peak: z + 0.16, kind: 'iron', metal: 0.8, rough: 0.5 });
    L.torus(hx, hy, 5, 5, 0, 0.45, { albedo: '#2e2a28', base: z + 0.08, peak: z + 0.16, kind: 'iron', metal: 0.8, rough: 0.5 });
    L.paint(circle(r, x, y), (gx, gy, px) => { const d = Math.hypot(gx - x, gy - y) / r; const rimZone = d > 0.84; const n = sample(f.mid, gx * 2, gy * 2); px.rgb = rimZone ? shade([70, 66, 62], 0.8 + 0.4 * n) : mix(shade([34, 32, 30], 0.8 + 0.3 * n), [60, 40, 24], smooth(0.55, 0.8, n) * 0.4); px.h = z + (rimZone ? 0.14 * Math.sqrt(Math.max(0, 1 - ((d - 0.92) / 0.08) ** 2)) : 0.04); px.hMode = 'set'; px.kind = 'iron'; px.metal = 0.75; px.rough = rimZone ? 0.4 : 0.7; });
  }
  function lantern(L, x, y, s, z, o = {}) {
    const iron = { kind: 'iron', metal: 0.85, rough: 0.5 };
    L.torus(x, y - 44 * s, 5 * s, 5 * s, 0, 0.45, { albedo: '#2c2826', base: z + 0.1, peak: z + 0.2, ...iron });
    L.fill(poly([[x - 15 * s, y - 26 * s], [x + 15 * s, y - 26 * s], [x, y - 40 * s]]), { albedo: '#2c2826', height: z + 0.22, ...iron, op: 'source-over' });
    L.fill((ctx) => { ctx.beginPath(); ctx.rect(x - 12 * s, y - 26 * s, 24 * s, 34 * s); }, { albedo: o.glass || '#f0c068', height: z + 0.16, kind: 'glass', rough: 0.2, op: 'source-over', emissive: o.flame || 'rgba(255,184,90,0.95)' });
    for (const d of [-12, 0, 12]) L.stroke(poly([[x + d * s, y - 26 * s], [x + d * s, y + 8 * s]], false), 2 * s, { albedo: '#2c2826', height: z + 0.24, ...iron });
    L.fill((ctx) => { ctx.beginPath(); ctx.rect(x - 14 * s, y + 8 * s, 28 * s, 5 * s); }, { albedo: '#2c2826', height: z + 0.22, ...iron, op: 'source-over' });
    L.glow((e) => { const g = e.createRadialGradient(x, y - 10 * s, 0, x, y - 10 * s, 70 * s); g.addColorStop(0, o.halo || 'rgba(255,170,70,0.45)'); g.addColorStop(1, 'rgba(255,120,30,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y - 10 * s, 70 * s, 0, TAU); e.fill(); });
  }
  function bindle(L, x0, y0, x1, y1, z, o = {}) {
    const f = F();
    L.taper([[x0, y0], [x1, y1]], [9, 7], { albedo: '#5a3c22', base: z, peak: z + 0.12, kind: 'wood', rough: 0.6 });
    const a = Math.atan2(y1 - y0, x1 - x0);
    for (let k = 1; k < 6; k += 1) { const t = k / 6; L.dome(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 4.5, { albedo: '#4a3018', base: z + 0.04, peak: z + 0.12, kind: 'wood', rough: 0.6 }); }
    const side = o.side ?? 1; const R = o.r || 34;
    const bx = x1 + Math.cos(a + side * Math.PI / 2) * (R * 0.7), by = y1 + Math.sin(a + side * Math.PI / 2) * (R * 0.7) + R * 0.25;
    pillow(L, smoothPath([[bx - R, by], [bx - R * 0.8, by - R * 0.7], [bx, by - R * 0.9], [bx + R * 0.8, by - R * 0.7], [bx + R, by], [bx + R * 0.7, by + R * 0.75], [bx, by + R * 0.9], [bx - R * 0.7, by + R * 0.75]], true), { base: z + 0.06, lift: 0.26, radius: R * 0.8, kind: 'cloth', rough: 0.9, color: (gx, gy, t) => { const cx = Math.floor((gx - bx + 400) / 8), cy = Math.floor((gy - by + 400) / 8); const check = (cx % 2 === 0) && (cy % 2 === 0); const band = (cx % 2 === 0) !== (cy % 2 === 0); const pal = o.palette || [[118, 30, 24], [158, 96, 80], [206, 188, 160]]; let c = check ? pal[0] : band ? pal[1] : pal[2]; return shade(c, (0.55 + 0.5 * t) * (0.85 + 0.25 * sample(f.mid, gx * 2, gy * 2))); } });
    for (const d of [-1, 1]) L.taper([[x1, y1], [x1 + d * 14 + Math.cos(a) * 6, y1 - 16]], [8, 3], { albedo: o.tie || '#7e241e', base: z + 0.2, peak: z + 0.3, kind: 'cloth', rough: 0.9 });
    L.dome(x1, y1, 7, { albedo: o.knot || '#6e201a', base: z + 0.22, peak: z + 0.32, kind: 'cloth', rough: 0.9 });
  }
  function horseshoe(L, x, y, s, rot, z) {
    const pts = []; for (let i = 0; i <= 40; i += 1) { const t = i / 40; const a = Math.PI * 0.15 + t * Math.PI * 1.7 + rot; pts.push([x + Math.cos(a) * 20 * s, y + Math.sin(a) * 22 * s]); }
    L.taper(pts, [9 * s, 9 * s], { albedo: '#4a4440', base: z, peak: z + 0.12, kind: 'iron', metal: 0.85, rough: 0.55 });
    for (let k = 0; k < 6; k += 1) { const t = 0.12 + k * 0.152; const [px2, py2] = pts[Math.round(t * 40)]; L.engraveFill(circle(1.3 * s, px2, py2), 0.5, { albedo: '#140e0a' }); }
  }
  function bells(L, x0, y0, x1, y1, n, z) {
    const pts = bezierPts([x0, y0], [lerp(x0, x1, 0.33), Math.max(y0, y1) + 18], [lerp(x0, x1, 0.66), Math.max(y0, y1) + 18], [x1, y1], 40);
    L.stroke(poly(pts, false), 1.4, { albedo: '#5a4630', height: z, kind: 'cloth', rough: 0.9 });
    for (let k = 1; k <= n; k += 1) {
      const [bx, by] = pts[Math.round((k / (n + 1)) * 40)];
      L.stroke(poly([[bx, by], [bx, by + 6]], false), 1, { albedo: '#5a4630', height: z + 0.02 });
      pillow(L, (ctx) => { ctx.beginPath(); ctx.moveTo(bx - 3, by + 6); ctx.quadraticCurveTo(bx - 6, by + 8, bx - 7, by + 16); ctx.lineTo(bx + 7, by + 16); ctx.quadraticCurveTo(bx + 6, by + 8, bx + 3, by + 6); ctx.closePath(); }, { base: z + 0.04, lift: 0.1, radius: 5, kind: 'gold', metal: 0.95, rough: 0.34, color: (gx, gy, t) => shade([176, 138, 60], 0.7 + 0.4 * t) });
    }
  }

  root.Props = { pillow, distanceField, local, roundRectAt, book, openBook, candle, inkwell, scroll, apple, grapes, bread, cheese, drumstick, flask, crystals, mortar, herbs, sword, heaterShield, greatHelm, axe, coin, coinPile, coinStack, pouch, dagger, crown, barrel, tankard, wineBottle, amphora, hourglass, casket, basket, sack, wheel, backpack, blanketRoll, pot, pan, lantern, bindle, horseshoe, bells };
}(window));
