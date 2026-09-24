// Labo Eraser — boutiques rondes, pack 1 : un anneau fin et un tas d'objets à taille réelle.
(function (root) {
  'use strict';
  const { C, TAU, rng, createLayers, render, compose, portraitCanvas, domeStyle, ringStyle, linearStyle, gray, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { P, circle, ringPath, poly, smoothPath, bezierPts, lerp, rivet, gem, leaf, skull, rope, beads } = root.Helpers;
  const Pr = root.Props;
  const ST = root.Strange;

  const R0 = 208, R1 = 236;
  function thinRing(L, style) {
    const f = getFields();
    const S = {
      leather: { col: '#3e2618', kind: 'leather', metal: 0, rough: 0.6, line: '#b08d45' },
      wood: { col: '#6a4a2c', kind: 'wood', metal: 0, rough: 0.66 },
      gilt: { col: '#b0904e', kind: 'gold', metal: 0.95, rough: 0.34 },
      iron: { col: '#4a4644', kind: 'iron', metal: 0.85, rough: 0.5 },
      black: { col: '#242226', kind: 'silver', metal: 0.9, rough: 0.4 },
      copper: { col: '#9a5a34', kind: 'bronze', metal: 0.9, rough: 0.45 },
      oak: { col: '#5a3a22', kind: 'wood', metal: 0, rough: 0.62 },
      wheel: {},
    }[style];
    if (style === 'wheel') { wheelRing(L); return; }
    const c0 = hex(S.col);
    L.paint(ringPath(R0, R1), (x, y, px) => {
      const rr = Math.hypot(x - C, y - C), a = Math.atan2(y - C, x - C); const u = (rr - R0) / (R1 - R0);
      const n = sample(f.mid, x * 1.4, y * 1.4); const g = S.kind === 'wood' ? sample(f.mid, a * 200, rr * 3) : n;
      px.rgb = c0.map((v) => v * (0.8 + 0.35 * g)); px.h = 0.3 + 0.18 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)); px.hMode = 'set';
      px.kind = S.kind; px.metal = S.metal; px.rough = S.rough;
    });
    if (S.line) { L.stroke(circle(R0 + 6), 1.4, { albedo: S.line, height: 0.44, kind: 'gold', metal: 0.9, rough: 0.4 }); L.stroke(circle(R1 - 6), 1.4, { albedo: S.line, height: 0.44, kind: 'gold', metal: 0.9, rough: 0.4 }); }
    if (style === 'iron' || style === 'black') for (let k = 0; k < 20; k += 1) rivet(L, ...P((R0 + R1) / 2, (k / 20) * TAU), 3, { base: 0.44, peak: 0.56 });
    if (style === 'gilt') beads(L, R1 - 3, 130, 2, { albedo: S.col, kind: 'gold', metal: 0.95, rough: 0.34, base: 0.34, peak: 0.46 });
    if (style === 'oak') for (const rr of [R0 + 4, R1 - 4]) L.stroke(circle(rr), 4, { albedo: '#2e2a28', height: 0.46, kind: 'iron', metal: 0.85, rough: 0.5 });
    if (style === 'wood') for (let k = 0; k < 16; k += 1) L.engrave(poly([P(R0, k * TAU / 16), P(R1, k * TAU / 16)], false), 1.2, 0.3);
    L.fill(ringPath(R0 - 6, R0 + 1), { albedo: '#1c140e', height: ringStyle(C, C, R0 - 6, R0 + 1, 0.28, 0.4, 'round'), kind: 'wood', rough: 0.7, op: 'source-over' });
  }

  // Jante de roue de charrette : six jantes de bois, bouts de rayons, bandage de fer, boue.
  function wheelRing(L) {
    const f = getFields();
    L.paint(ringPath(R0, R1 + 8), (x, y, px) => {
      const rr = Math.hypot(x - C, y - C), a = Math.atan2(y - C, x - C); const u = (rr - R0) / (R1 + 8 - R0);
      const tire = rr > R1 - 1; const seg = Math.floor(((a + Math.PI) / TAU) * 6); const fs = ((a + Math.PI) / TAU) * 6 - seg; const joint = Math.min(fs, 1 - fs) * 222 * 1.05 < 1.3;
      const g = sample(f.mid, a * 220 + seg * 40, rr * 3); let c; let kind = 'wood', metal = 0, rough = 0.66;
      if (tire) { const nn = sample(f.mid, x * 2, y * 2); c = [60 * (0.85 + 0.3 * nn), 56 * (0.85 + 0.3 * nn), 54 * (0.85 + 0.3 * nn)]; if (nn > 0.62) c = [c[0] + 30, c[1] + 10, c[2]]; kind = 'iron'; metal = 0.8; rough = 0.52; }
      else { c = [98 * (0.66 + 0.46 * g), 66 * (0.66 + 0.46 * g), 40 * (0.66 + 0.46 * g)]; if (joint) c = c.map((v) => v * 0.4); }
      const mud = smooth(0.25, 0.95, (y - C) / 240) * smooth(0.42, 0.7, sample(f.low, x * 3, y * 3));
      c = c.map((v, k) => v + ([62, 46, 30][k] - v) * mud * 0.8);
      px.rgb = c; px.h = 0.3 + 0.16 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) + (tire ? 0.03 : 0); px.hMode = 'set'; px.kind = kind; px.metal = metal; px.rough = rough;
    });
    for (let k = 0; k < 12; k += 1) { const a = (k / 12) * TAU + TAU / 24; const [x, y] = P((R0 + R1) / 2 - 2, a); L.dome(x, y, 6.5, { albedo: '#4a3a2c', base: 0.4, peak: 0.52, kind: 'wood', rough: 0.7 }); L.engrave(circle(4, x, y), 0.9, 0.25); }
    for (let k = 0; k < 18; k += 1) rivet(L, ...P(R1 + 3, (k / 18) * TAU), 2.2, { base: 0.5, peak: 0.58 });
    // Éclisses de fer sur les joints des jantes.
    for (let k = 0; k < 6; k += 1) {
      const a = -Math.PI + (k / 6) * TAU; const [x, y] = P((R0 + R1) / 2, a);
      L.fill((ctx) => { ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.roundRect(-15, -6, 30, 12, 2); }, { albedo: '#34302c', height: 0.5, kind: 'iron', metal: 0.8, rough: 0.55, op: 'source-over' });
      for (const d of [-9, 9]) { const [rx, ry] = [x + Math.cos(a) * d, y + Math.sin(a) * d]; rivet(L, rx, ry, 2.4, { base: 0.52, peak: 0.6 }); }
    }
    L.fill(ringPath(R0 - 6, R0 + 1), { albedo: '#1c140e', height: ringStyle(C, C, R0 - 6, R0 + 1, 0.28, 0.4, 'round'), kind: 'wood', rough: 0.7, op: 'source-over' });
  }

  const PILES = {
    bookshop: { label: 'Librairie', ring: 'leather', lights: [[384, 236, 110, [1.4, 0.9, 0.42]]], build(L) {
      Pr.scroll(L, 482, 424, 118, -1.3, 0.46);
      const stack = [[176, 30, 0.02, '#3e1512', 'spine'], [160, 26, -0.04, '#1e2a44', 'pages'], [168, 28, 0.05, '#27321c', 'spine'], [142, 24, -0.03, '#4a3018', 'spine'], [148, 26, 0.06, '#321a2c', 'pages']];
      let y = 500, z = 0.5;
      stack.forEach(([w, t, rot, col, face], k) => { Pr.book(L, 392 + (k % 2 ? 8 : -6) - k * 2, y - t / 2, w, t, rot, { color: col, z, face, clasp: k === 2 }); y -= t - 1; z += 0.07; });
      Pr.candle(L, 384, y - 2, 64, z + 0.02, { w: 18, halo: 90 });
      Pr.inkwell(L, 270, 498, 1.15, 0.52);
    } },
    market: { label: 'Marché', ring: 'wood', build(L) {
      Pr.sack(L, 96, 368, 112, 130, 0.42, '#7a6848');
      Pr.cheese(L, 222, 402, 1.35, 0.5);
      Pr.basket(L, 128, 454, 180, 76, 0.56);
      const apples = [[70, 412, 21, '#6e1a12'], [108, 404, 22, '#7a2a12'], [150, 406, 21, '#661810'], [188, 414, 19, '#566422'], [88, 384, 20, '#6e1a12'], [130, 380, 21, '#7a2010'], [168, 386, 19, '#6e2a14']];
      apples.forEach(([x, y, r, c], k) => Pr.apple(L, x, y, r, { z: 0.64 + k * 0.01, color: c, blush: c === '#566422' ? '#a8923a' : '#b07a36', leaf: k === 5 }));
      Pr.grapes(L, 226, 444, 1.3, 0.72);
      Pr.bread(L, 216, 481, 132, 52, -0.12, 0.7);
    } },
    antique: { label: 'Antiquaire', ring: 'gilt', lights: [[262, 420, 90, [1.2, 0.8, 0.45]]], build(L) {
      Pr.amphora(L, 444, 470, 1.5, 0.44);
      Pr.hourglass(L, 316, 444, 1.3, 0.5);
      Pr.casket(L, 398, 466, 1.35, 0.6);
      Pr.coinPile(L, 304, 490, 7, 44, 0.66);
      Pr.candle(L, 262, 494, 44, 0.62, { w: 13, halo: 60 });
    } },
    armory: { label: 'Armurerie', ring: 'iron', build(L) {
      Pr.sword(L, 172, 436, 52, 140, 0.4, { width: 18, grip: 56 });
      Pr.axe(L, 58, 496, 250, 392, 0.44);
      Pr.heaterShield(L, 146, 404, 1.32, -0.18, 0.52, { c1: '#4a1214', c2: '#a88a48' });
      Pr.greatHelm(L, 226, 455, 1.28, 0.62);
    } },
    'black-market': { label: 'Marché noir', ring: 'black', lights: [[462, 436, 90, [0.3, 0.9, 0.4]]], build(L) {
      Pr.crown(L, 434, 406, 1.4, 0.5, 0.46);
      Pr.pouch(L, 346, 448, 1.55, 0.52);
      Pr.coinPile(L, 404, 481, 16, 96, 0.58);
      Pr.coinStack(L, 286, 498, 6, 0.6);
      Pr.flask(L, 472, 496, 1.15, { z: 0.6, liquid: '#2e8a3a', glow: true, type: 'round', level: 0.6, wax: '#2a2a2a' });
      Pr.dagger(L, 318, 400, 470, 330, 0.64);
    } },
    alchemist: { label: 'Alchimiste', ring: 'copper', lights: [[120, 430, 90, [0.5, 0.8, 1.2]]], build(L) {
      Pr.herbs(L, 66, 300, 110, 0.44); Pr.herbs(L, 102, 286, 92, 0.46, { colors: ['#5a4a2a', '#6a5a30', '#4a4424'] });
      Pr.crystals(L, 222, 489, 1.35, 0.46, '#4e2a78');
      Pr.flask(L, 88, 498, 1.4, { z: 0.5, liquid: '#1e5aa8', glow: true, type: 'round', level: 0.62, label: true });
      Pr.flask(L, 158, 482, 1.2, { z: 0.54, liquid: '#8a1c14', glow: true, type: 'tall', level: 0.5, label: true, wax: '#5a1210' });
      Pr.mortar(L, 150, 495, 1.2, 0.6);
      skull(L, 232, 410, 0.78, 0.25, { base: 0.5, lift: 0.3, seed: 3 });
      Pr.candle(L, 240, 362, 26, 0.68, { w: 11, halo: 56, holder: false });
    } },
    tavern: { label: 'Taverne', ring: 'oak', lights: [[400, 330, 90, [1.2, 0.75, 0.38]]], build(L) {
      Pr.barrel(L, 408, 404, 178, 140, 0.44);
      Pr.wineBottle(L, 456, 494, 1.25, 0.35, 0.56);
      Pr.tankard(L, 306, 494, 1.35, 0.58);
      Pr.tankard(L, 380, 499, 1.45, 0.62);
      Pr.drumstick(L, 438, 482, 1.2, -0.3, 0.66);
      Pr.bread(L, 244, 486, 84, 36, 0.2, 0.6);
    } },
    traveling: { label: 'Marché ambulant', ring: 'wheel', lights: [[112, 250, 70, [0.28, 0.7, 0.42]], [222, 450, 60, [0.34, 0.26, 0.66]]], back(L) { Pr.wheel(L, 444, 444, 62, { z: 0.22, mud: 1, wood: '#4a3e34', spokeCol: '#382e26', skip: [4], phase: 0.3 }); }, build(L) {
      Pr.bindle(L, 222, 498, 70, 214, 0.44, { side: -1, r: 36, palette: [[66, 44, 62], [98, 88, 76], [150, 138, 112]], tie: '#3a2a30', knot: '#2e2028' });
      Pr.backpack(L, 130, 426, 1.1, 0.5);
      Pr.blanketRoll(L, 128, 346, 146, 34, -0.05, 0.64, [[150, 140, 118], [66, 44, 58], [52, 70, 74]]);
      ST.eyeJar(L, 48, 484, 1.0, 0.56);
      ST.crystalBall(L, 222, 500, 30, 0.62);
      ST.greenLantern(L, 110, 276, 1, 0.7);
      ST.charmString(L, 66, 396, 192, 402, 14, ['bone', 'key', 'skull', 'feather'], 0.76, { scale: 1 });
      ST.crow(L, 112, 230, 0.8, false, 0.9);
    } },
  };

  function renderPile(type, img, po) {
    const spec = PILES[type];
    const L = createLayers();
    if (spec.back) spec.back(L);
    thinRing(L, spec.ring);
    spec.build(L);
    const lights = [{ dir: [-0.45, -0.62, 0.64], color: [1.5, 1.36, 1.1] }, { dir: [0.7, 0.45, 0.5], color: [0.14, 0.16, 0.26], shadow: false }];
    for (const [x, y, z, col] of spec.lights || []) lights.push({ pos: [x, y, z], radius: 150, color: col });
    const lit = render(L, { seed: type.length, lights, room: [0.24, 0.21, 0.17], opening: R0 - 4, sheen: 0.35 });
    const portrait = portraitCanvas(img, R0 - 2, po ? { ...po, zoom: po.fit ? 256 / (R0 - 2) : po.zoom } : { focus: [0.52, 0.33] });
    return compose({ portrait, frame: lit, opening: R0 - 4 });
  }

  root.ShopPack1 = { types: Object.keys(PILES), label: (t) => PILES[t].label, render: renderPile };
}(window));
