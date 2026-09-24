// Labo Eraser — icônes d'armes (brainstorm) : 6 armes témoins × 3 présentations.
(function (root) {
  'use strict';
  const { C, TAU, rng, createLayers, render, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { circle, ringPath, poly, smoothPath, bezierPts, lerp, localPts, rivet, gem } = root.Helpers;
  const Pr = root.Props;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));
  const IRON = { kind: 'iron', metal: 0.85, rough: 0.45 };
  const STEEL = { kind: 'silver', metal: 0.95, rough: 0.28 };
  const BRASS = { kind: 'bronze', metal: 0.9, rough: 0.4 };
  const GOLD = { kind: 'gold', metal: 0.95, rough: 0.34 };

  // Repère local : origine (x, y), axe u orienté selon a.
  const frame = (x, y, a) => ({ T: (pts) => localPts(x, y, a, 1, pts), p: (u, v) => localPts(x, y, a, 1, [[u, v]])[0] });
  function woodTaper(L, pts, w, z, col = '#5a3a22') {
    L.taper(pts, w, { albedo: col, base: z, peak: z + 0.12, kind: 'wood', rough: 0.55 });
  }
  function woodBody(L, path, z, col = [104, 66, 38], lift = 0.12) {
    const f = getFields();
    Pr.pillow(L, path, { base: z, lift, radius: 8, kind: 'wood', rough: 0.5, color: (gx, gy, t) => { const g = sample(f.mid, gx * 0.35 + gy * 0.35, (gx - gy) * 2.2); return shade(col, (0.62 + 0.42 * g) * (0.55 + 0.55 * t)); } });
  }
  function steelBody(L, path, z, o = {}) {
    const f = getFields();
    Pr.pillow(L, path, { base: z, lift: o.lift ?? 0.1, radius: o.radius ?? 6, ...STEEL, rough: o.rough ?? 0.3, color: (gx, gy, t) => { const n = sample(f.mid, gx * 2.2, gy * 2.2), sc = sample(f.high, gx * 1.5 + gy, gy * 1.5); let c = shade(o.col || [150, 154, 160], (0.62 + 0.45 * t) * (0.85 + 0.25 * n)); if (sc > 0.85) c = shade(c, 1.15); if (o.rust) c = mix(c, [110, 64, 34], smooth(0.62, 0.8, n) * o.rust); return c; } });
  }

  /* ---------- 6 armes témoins (dessinées dans 512 × 512, en diagonale) ---------- */
  const WEAPONS = {
    batarde: { name: 'Épée bâtarde', draw(L, z) {
      const a = -Math.PI / 4; const { T, p } = frame(160, 352, a); const len = 318, w = 24;
      steelBody(L, poly(T([[0, -w], [len * 0.8, -w * 0.8], [len, 0], [len * 0.8, w * 0.8], [0, w]])), z + 0.08, { radius: 14, lift: 0.12 });
      L.engrave(poly(T([[10, 0], [len * 0.72, 0]]), false), 5, 0.35, { albedo: '#5a5e64' });
      L.tube(smoothPath(T([[-6, -74], [-14, -60], [-4, -36], [-4, 36], [-14, 60], [-6, 74]]), false), 18, { albedo: '#8a6a34', base: z + 0.2, peak: z + 0.36, ...GOLD });
      for (const d of [-1, 1]) L.dome(...p(-6, d * 76), 10, { albedo: '#8a6a34', base: z + 0.24, peak: z + 0.38, ...GOLD });
      const f = getFields();
      Pr.pillow(L, poly(T([[-10, -13], [-112, -12], [-112, 12], [-10, 13]])), { base: z + 0.14, lift: 0.12, radius: 8, kind: 'leather', rough: 0.6, color: (gx, gy, t) => shade([66, 34, 22], (0.55 + 0.5 * t) * (0.8 + 0.3 * sample(f.mid, gx * 3, gy * 3))) });
      for (let k = 0; k < 11; k += 1) L.engrave(poly(T([[-16 - k * 9, -12], [-22 - k * 9, 12]]), false), 1.8, 0.3);
      Pr.pillow(L, circle(24, ...p(-132, 0)), { base: z + 0.14, lift: 0.16, radius: 12, ...GOLD, color: (gx, gy, t) => shade([168, 130, 62], 0.55 + 0.55 * t) });
      gem(L, ...p(-132, 0), 10, { color: '#7a1414', cut: 'cabochon', setting: 1, setAlbedo: '#6e5a32', base: z + 0.32, lift: 0.12 });
    } },
    hache: { name: 'Hache de guerre', draw(L, z) {
      const x0 = 110, y0 = 440, x1 = 350, y1 = 130; const a = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
      const { T, p } = frame(x0, y0, a); const f = getFields();
      woodTaper(L, T([[-10, 0], [len + 30, 0]]), [26, 22], z, '#5a3a22');
      L.fill(Pr.roundRectAt(...p(40, 0), 70, 30, a, 4), { albedo: '#3a2418', height: z + 0.14, kind: 'leather', rough: 0.6, op: 'source-over' });
      for (let k = 0; k < 9; k += 1) L.engrave(poly(T([[16 + k * 9, -7], [20 + k * 9, 7]]), false), 1.6, 0.3);
      L.dome(...p(-14, 0), 17, { albedo: '#3a3431', base: z + 0.08, peak: z + 0.24, ...IRON });
      // double lame en croissant
      for (const d of [-1, 1]) {
        const blade = [[len - 30, d * 8], [len - 58, d * 34], [len - 80, d * 92], [len - 20, d * 118], [len + 34, d * 110], [len + 50, d * 90], [len + 30, d * 34], [len + 8, d * 8]];
        steelBody(L, smoothPath(T(blade), true), z + 0.12, { radius: 10, col: [140, 144, 150], rust: 0.5 });
        L.stroke(smoothPath(T([[len - 80, d * 92], [len - 20, d * 118], [len + 34, d * 110], [len + 50, d * 90]]), false), 5, { albedo: '#d4d8dc', height: z + 0.24, ...STEEL, rough: 0.15 });
        L.engrave(smoothPath(T([[len - 40, d * 40], [len - 20, d * 80], [len + 20, d * 82]]), false), 1.6, 0.25);
      }
      L.fill(Pr.roundRectAt(...p(len - 6, 0), 50, 30, a, 4), { albedo: '#2e2a28', height: z + 0.2, ...IRON, op: 'source-over' });
      for (const u of [-14, 2]) rivet(L, ...p(len + u, 0), 4, { base: z + 0.22, peak: z + 0.3 });
      Pr.pillow(L, poly(T([[len + 18, -6], [len + 70, 0], [len + 18, 6]])), { base: z + 0.14, lift: 0.08, radius: 3, ...IRON, color: (gx, gy, t) => shade([120, 122, 126], 0.6 + 0.5 * t) });
    } },
    arbalete: { name: 'Arbalète', draw(L, z) {
      const a = -Math.PI / 4; const { T, p } = frame(250, 280, a);
      // arbrier
      woodBody(L, smoothPath(T([[-200, -30], [-150, -24], [-40, -22], [150, -20], [162, 0], [150, 20], [-40, 24], [-120, 32], [-200, 56], [-218, 14]]), true), z, [116, 72, 40]);
      L.engrave(poly(T([[-30, 0], [150, 0]]), false), 2.4, 0.3);
      // arc d'acier
      const limb = (d) => bezierPts([120, 0], [118, d * 70], [96, d * 140], [58, d * 176], 20);
      for (const d of [-1, 1]) L.taper(T(limb(d)), (t) => 24 - 12 * t, { albedo: '#8a8e94', base: z + 0.14, peak: z + 0.28, ...STEEL });
      // corde armée et carreau
      for (const d of [-1, 1]) L.stroke(poly(T([[58, d * 176], [-34, 0]]), false), 3.4, { albedo: '#d8ccb0', height: z + 0.3, kind: 'cloth', rough: 0.8 });
      L.taper(T([[-30, 0], [150, 0]]), [9, 9], { albedo: '#6a4a2c', base: z + 0.22, peak: z + 0.3, kind: 'wood', rough: 0.6 });
      Pr.pillow(L, poly(T([[150, -13], [196, 0], [150, 13]])), { base: z + 0.24, lift: 0.08, radius: 3, ...IRON, color: (gx, gy, t) => shade([96, 98, 104], 0.6 + 0.5 * t) });
      for (const d of [-1, 1]) L.fill(poly(T([[-30, 0], [-50, d * 10], [-40, d * 10], [-22, 0]])), { albedo: '#8a2a1e', height: z + 0.3, kind: 'cloth', rough: 0.8, op: 'source-over' });
      // étrier, noix, détente
      L.torus(...p(172, 0), 22, 16, a, 0.32, { albedo: '#3a3431', base: z + 0.12, peak: z + 0.24, ...IRON });
      L.fill(Pr.roundRectAt(...p(116, 0), 26, 34, a, 3), { albedo: '#2e2a28', height: z + 0.2, ...IRON, op: 'source-over' });
      L.dome(...p(-34, 0), 7, { albedo: '#b0a890', base: z + 0.26, peak: z + 0.34, kind: 'bone', rough: 0.5 });
      L.taper(T([[-60, 16], [-100, 58]]), [7, 4], { albedo: '#2e2a28', base: z + 0.1, peak: z + 0.2, ...IRON });
      for (const u of [-150, -90, 40, 90]) rivet(L, ...p(u, 0), 3, { base: z + 0.2, peak: z + 0.28, albedo: '#8a6a34' });
    } },
    pistolet: { name: 'Pistolet à silex', draw(L, z) {
      const a = -0.32; const { T, p } = frame(250, 270, a);
      // canon
      L.tube(poly(T([[-40, -20], [200, -20]]), false), 40, { albedo: '#4a4644', base: z + 0.1, peak: z + 0.3, ...IRON });
      L.tube(poly(T([[188, -20], [210, -20]]), false), 48, { albedo: '#8a6a34', base: z + 0.12, peak: z + 0.34, ...BRASS });
      for (const u of [40, 120]) L.tube(poly(T([[u, -20], [u + 12, -20]]), false), 46, { albedo: '#8a6a34', base: z + 0.12, peak: z + 0.32, ...BRASS });
      // fût et crosse
      woodBody(L, smoothPath(T([[150, -4], [150, 16], [-10, 22], [-50, 40], [-96, 120], [-140, 172], [-200, 156], [-184, 104], [-160, 30], [-120, -6], [-40, -4]]), true), z, [104, 56, 30]);
      Pr.pillow(L, circle(34, ...p(-176, 150)), { base: z + 0.14, lift: 0.1, radius: 8, ...BRASS, color: (gx, gy, t) => shade([168, 128, 62], 0.55 + 0.55 * t) });
      // platine, chien, silex, bassinet
      L.fill(Pr.roundRectAt(...p(-40, 4), 86, 30, a, 10), { albedo: '#4a4644', height: z + 0.16, ...IRON, op: 'source-over' });
      L.engrave(smoothPath(T([[-70, 4], [-40, -4], [-12, 6]]), false), 1.4, 0.25);
      L.taper(T(bezierPts([-66, 0], [-80, -30], [-60, -56], [-34, -52], 16)), [9, 7], { albedo: '#3a3634', base: z + 0.2, peak: z + 0.34, ...IRON });
      L.fill(Pr.roundRectAt(...p(-30, -50), 14, 12, a, 2), { albedo: '#2a2622', height: z + 0.34, kind: 'stone', rough: 0.7, op: 'source-over' });
      L.taper(T([[-4, -8], [2, -42]]), [7, 5], { albedo: '#4a4644', base: z + 0.2, peak: z + 0.3, ...IRON });
      // détente et pontet
      L.stroke((ctx) => { const [cx, cy] = p(-96, 40); ctx.beginPath(); ctx.ellipse(cx, cy, 24, 16, a, 0, TAU); }, 4, { albedo: '#8a6a34', height: z + 0.2, ...BRASS });
      L.taper(T([[-92, 22], [-100, 46]]), [5, 3], { albedo: '#2e2a28', base: z + 0.18, peak: z + 0.26, ...IRON });
      L.taper(T([[40, 8], [180, 8]]), [5, 5], { albedo: '#2a1a10', base: z + 0.16, peak: z + 0.22, kind: 'wood', rough: 0.6 });
    } },
    sceptreFeu: { name: 'Sceptre de feu', draw(L, z) {
      const x0 = 150, y0 = 430, a = -Math.PI * 0.36; const { T, p } = frame(x0, y0, a); const len = 300;
      L.tube(poly(T([[0, 0], [len, 0]]), false), 26, { albedo: '#3a2a22', base: z, peak: z + 0.18, kind: 'wood', rough: 0.4 });
      for (let k = 0; k < 7; k += 1) L.tube(poly(T([[40 + k * 30, 0], [50 + k * 30, 0]]), false), 32, { albedo: '#8a6a34', base: z + 0.04, peak: z + 0.22, ...GOLD });
      Pr.pillow(L, circle(22, ...p(-4, 0)), { base: z + 0.06, lift: 0.12, radius: 8, ...GOLD, color: (gx, gy, t) => shade([168, 130, 62], 0.55 + 0.55 * t) });
      // cœur de braise
      const [hx, hy] = p(len + 44, 0); const f = getFields();
      L.paint(circle(34, hx, hy), (gx, gy, px) => { const d = Math.hypot(gx - hx, gy - hy) / 34; const n = sample(f.mid, gx * 2.2, gy * 2.2); const hot = (1 - d) * (0.6 + 0.6 * n); px.rgb = mix([90, 16, 6], [255, 214, 120], clamp01(hot)); px.h = z + 0.2 + 0.2 * Math.sqrt(Math.max(0, 1 - d * d)); px.hMode = 'set'; px.kind = 'glass'; px.metal = 0; px.rough = 0.2; px.e = [255 * clamp01(hot + 0.2), 120 * clamp01(hot), 30 * clamp01(hot - 0.3)]; });
      // flammes
      for (const [ang, ln] of [[-0.3, 64], [0, 90], [0.35, 70], [-0.62, 46], [0.7, 46]]) {
        const { T: T2 } = frame(hx, hy, a + ang);
        L.fill(smoothPath(T2([[20, -14], [ln * 0.6, -10], [ln, 0], [ln * 0.6, 6], [26, 14]]), true), { albedo: '#ffb040', height: z + 0.36, kind: 'glass', rough: 0.3, emissive: 'rgba(255,140,40,0.85)', op: 'source-over' });
      }
      // griffes d'or qui tiennent la braise
      for (const d of [-1, 0, 1]) L.taper(T(bezierPts([len, d * 10], [len + 8, d * 40], [len + 40, d * 50], [len + 66, d * 32], 16)), [14, 4], { albedo: '#a8843a', base: z + 0.3, peak: z + 0.44, ...GOLD });
      L.glow((e) => { const g = e.createRadialGradient(hx, hy, 10, hx, hy, 130); g.addColorStop(0, 'rgba(255,140,40,0.55)'); g.addColorStop(1, 'rgba(255,80,10,0)'); e.fillStyle = g; e.beginPath(); e.arc(hx, hy, 130, 0, TAU); e.fill(); });
      return { lights: [[hx, hy, 90, [1.6, 0.8, 0.3]]] };
    } },
    bouclierPique: { name: 'Bouclier à pique', draw(L, z) {
      Pr.heaterShield(L, 256, 250, 2.4, 0, z, { c1: '#3a1416', c2: '#8a7444' });
      for (let k = 0; k < 14; k += 1) { const t = k / 13; const ang = Math.PI * (1.1 + 0.8 * t); }
      const rim = [[-116, -118], [0, -122], [116, -118], [118, -40], [96, 50], [50, 110], [0, 146], [-50, 110], [-96, 50], [-118, -40]];
      rim.forEach(([u, v]) => rivet(L, 256 + u, 250 + v, 5, { base: z + 0.24, peak: z + 0.34 }));
      Pr.pillow(L, circle(52, 256, 236), { base: z + 0.2, lift: 0.14, radius: 20, ...IRON, color: (gx, gy, t) => shade([96, 96, 100], 0.55 + 0.55 * t) });
      Pr.pillow(L, poly([[226, 250], [286, 222], [178, 128]]), { base: z + 0.4, lift: 0.3, radius: 16, ...STEEL, color: (gx, gy, t) => shade([176, 180, 188], 0.5 + 0.6 * t) });
      // pique conique
      const f = getFields();
      L.paint(circle(26, 256, 236), (gx, gy, px) => { const d = Math.hypot(gx - 256, gy - 236) / 26; const a2 = Math.atan2(gy - 236, gx - 256); const lit = 0.55 + 0.45 * Math.cos(a2 + 2.2); px.rgb = shade([170, 174, 180], (0.5 + 0.6 * lit) * (0.9 + 0.2 * sample(f.mid, gx * 3, gy * 3))); px.h = z + 0.36 + 0.5 * (1 - d); px.hMode = 'set'; px.kind = 'silver'; px.metal = 0.95; px.rough = 0.22; });
    } },
  };

  /* ---------- 3 présentations ---------- */
  const STYLES = {
    relique: { name: 'A · Relique', back: null },
    case: { name: 'B · Case d’inventaire', back(L) {
      const f = getFields();
      Pr.pillow(L, Pr.roundRectAt(256, 256, 470, 470, 0, 40), { base: 0.02, lift: 0.1, radius: 26, kind: 'leather', rough: 0.7, color: (gx, gy, t) => { const n = sample(f.mid, gx * 2, gy * 2); return shade([62, 44, 32], (0.55 + 0.5 * t) * (0.8 + 0.3 * n)); } });
      L.paint(Pr.roundRectAt(256, 256, 400, 400, 0, 26), (gx, gy, px) => { const d = Math.hypot(gx - 256, gy - 256) / 290; px.rgb = shade([34, 28, 24], 1.1 - 0.5 * d); px.h = 0.04; px.hMode = 'set'; px.kind = 'leather'; px.metal = 0; px.rough = 0.8; });
      L.stroke(Pr.roundRectAt(256, 256, 436, 436, 0, 34), 2, { albedo: '#a08450', height: 0.14, kind: 'gold', metal: 0.8, rough: 0.5, dash: [6, 5] });
      for (const [x, y] of [[40, 40], [472, 40], [40, 472], [472, 472]]) rivet(L, x, y, 7, { base: 0.12, peak: 0.24, albedo: '#8a6a34' });
    } },
    medaillon: { name: 'C · Médaillon', back(L) {
      const f = getFields();
      L.paint(circle(236), (gx, gy, px) => { const d = Math.hypot(gx - 256, gy - 256) / 236; px.rgb = shade([40, 30, 26], 1.05 - 0.45 * d); px.h = 0.02; px.hMode = 'set'; px.kind = 'stone'; px.metal = 0; px.rough = 0.9; });
      L.paint(ringPath(222, 248), (gx, gy, px) => { const rr = Math.hypot(gx - 256, gy - 256); const u = (rr - 222) / 26; const n = sample(f.mid, gx * 1.6, gy * 1.6); px.rgb = shade([150, 102, 56], (0.7 + 0.35 * n)); px.h = 0.06 + 0.14 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)); px.hMode = 'set'; px.kind = 'bronze'; px.metal = 0.9; px.rough = 0.42; });
    } },
  };

  function renderIcon(wk, sk) {
    const L = createLayers(); const st = STYLES[sk];
    if (st.back) st.back(L);
    const spec = WEAPONS[wk].draw(L, st.back ? 0.3 : 0.2) || {};
    const lights = [{ dir: [-0.45, -0.62, 0.64], color: [1.55, 1.42, 1.18] }, { dir: [0.7, 0.45, 0.5], color: [0.16, 0.18, 0.28], shadow: false }];
    for (const [x, y, zz, col] of spec.lights || []) lights.push({ pos: [x, y, zz], radius: 200, color: col });
    return render(L, { seed: wk.length, lights, room: [0.26, 0.23, 0.19], inside: () => false, sheen: 0.4, lichen: 0, dropShadow: st.back ? 0.35 : 0.6 });
  }
  root.WeaponLab = { WEAPONS, STYLES, render: renderIcon };
}(window));
