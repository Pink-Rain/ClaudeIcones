// Labo Eraser — tokens de base : un anneau fin et sobre (esprit « Ancien »),
// en or, argent, cuivre, émail rouge et émail bleu clair, dans quatre états d'usure.
(function (root) {
  'use strict';
  const { C, TAU, rng, createLayers, render, compose, portraitCanvas, smooth, clamp01, getFields, sample, hex } = root.Relief;
  const { P, circle, ringPath, arcPath, poly, voronoi, scatter } = root.Helpers;

  const angleDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  // Retire une forme de tous les calques (éclat, brèche).
  function cut(L, path) {
    for (const ctx of [L.a, L.m, L.e]) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; path(ctx); ctx.fill(); ctx.restore(); }
    L.h.save(); L.h.fillStyle = '#000'; path(L.h); L.h.fill(); L.h.restore();
  }

  // Métal plein, ou émail posé en champlevé sur un métal dont les bords restent visibles.
  const MATERIALS = {
    gold: { label: 'Or', metal: '#c09a4e', kind: 'silver', patina: [70, 48, 22], room: [0.32, 0.27, 0.2] },
    silver: { label: 'Argent', metal: '#bdbec2', kind: 'silver', patina: [30, 28, 27], room: [0.28, 0.29, 0.31] },
    copper: { label: 'Cuivre', metal: '#b3693c', kind: 'bronze', patina: [48, 34, 24], room: [0.3, 0.25, 0.2] },
    red: { label: 'Émail rouge', metal: '#b8964e', kind: 'silver', enamel: '#861f1b', patina: [40, 26, 20], room: [0.3, 0.25, 0.21] },
    blue: { label: 'Émail bleu clair', metal: '#bcbec3', kind: 'silver', enamel: '#8fb8d6', patina: [36, 38, 42], room: [0.27, 0.29, 0.33] },
    vividRed: { label: 'Rouge vif', metal: '#c8a452', kind: 'silver', enamel: '#f00a14', patina: [40, 26, 20], room: [0.3, 0.25, 0.21], vivid: true },
    vividGreen: { label: 'Vert vif', metal: '#c8a452', kind: 'silver', enamel: '#0ad232', patina: [30, 34, 22], room: [0.27, 0.3, 0.25], vivid: true },
    vividBlue: { label: 'Bleu vif', metal: '#c6c8cd', kind: 'silver', enamel: '#0a46ff', patina: [30, 32, 40], room: [0.26, 0.28, 0.34], vivid: true },
  };
  const STATES = [
    { label: 'Neuf', wear: 0, rough: 0.2, scratches: 0, chips: 0, dents: 0, cracks: 0, patina: 0, enamelChips: 0, hammer: 0.05 },
    { label: 'Abîmé', wear: 0.9, rough: 0.32, scratches: 34, chips: 3, dents: 2, cracks: 0, patina: 0.35, enamelChips: 7, hammer: 0.08 },
    { label: 'Très abîmé', wear: 1.7, rough: 0.42, scratches: 80, chips: 9, dents: 6, cracks: 3, patina: 0.65, enamelChips: 18, hammer: 0.1 },
    { label: 'Détruit', wear: 2.4, rough: 0.52, scratches: 100, chips: 14, dents: 9, cracks: 5, patina: 0.85, enamelChips: 40, hammer: 0.12 },
  ];
  const R_IN = 212, R_BAND = 220, R_OUT = 246, R_EDGE = 249;

  function build(L, mk, level) {
    const M = MATERIALS[mk], S = STATES[level];
    const F = getFields();
    const r = rng(level * 131 + mk.length * 17 + 5);
    const metalCol = hex(M.metal), enamelCol = M.enamel ? hex(M.enamel) : null;
    // Martelage : petites facettes, chacune un peu inclinée.
    const seeds = scatter(1100, (x, y) => { const d = Math.hypot(x - C, y - C); return d > 200 && d < 258; }, 77, 5);
    const vor = voronoi(seeds, 12);
    const tilt = seeds.map((_, i) => { const q = rng(i * 7 + 3); return [q() - 0.5, q() - 0.5, q()]; });
    // Éclats d'émail : zones où le métal réapparaît.
    const eChips = Array.from({ length: S.enamelChips }, () => ({ a: r() * TAU, u: 0.2 + r() * 0.6, s: 2 + r() * (2 + level * 2.2) }));
    // Déformation (anneau cabossé, détruit seulement) : l'anneau est enfoncé vers l'intérieur.
    const dentAt = level === 3 ? 2.35 : null;
    const deform = (a) => (dentAt === null ? 0 : 6 * Math.exp(-((angleDiff(a, dentAt) / 0.32) ** 2)));
    L.paint(ringPath(200, 256), (x, y, px) => {
      const dx = x - C, dy = y - C; const a = Math.atan2(dy, dx); const rr = Math.hypot(dx, dy) + deform(a);
      if (rr < R_IN || rr > R_EDGE) { px.skip = true; return; }
      const q = vor.query(x, y); const [tx, ty, tv] = tilt[q.i];
      let h, u = 0, band = false;
      if (rr < R_BAND) { const f = (rr - R_IN) / (R_BAND - R_IN); h = 0.3 + 0.12 * Math.sin(Math.PI * f); }
      else if (rr < R_OUT) { u = (rr - R_BAND) / (R_OUT - R_BAND); band = true; h = 0.34 + 0.28 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)); }
      else { const f = (rr - R_OUT) / (R_EDGE - R_OUT); h = 0.34 - 0.12 * f; }
      const n = sample(F.mid, x * 1.2, y * 1.2), lo = sample(F.low, x * 2.2, y * 2.2), hi = sample(F.high, x, y);
      const vary = [0.04, 0.08, 0.1, 0.12][level]; let col = metalCol.map((v) => v * (1 - vary / 2 + vary * tv));
      let kind = M.kind, metal = 0.95, rough = S.rough + 0.08 * (tv - 0.5);
      // Émail en champlevé au centre du bandeau.
      if (enamelCol && band && u > 0.14 && u < 0.86) {
        let chipped = false;
        for (const c of eChips) { const du = (u - c.u) * 26, da = angleDiff(a, c.a) * rr; const d = Math.hypot(du, da) / (c.s * (0.7 + 0.6 * hi)); if (d < 1) { chipped = true; break; } }
        if (!chipped) {
          col = enamelCol.map((v) => v * (0.96 + 0.06 * n));
          kind = 'paint'; metal = 0; rough = 0.2 + level * 0.1;
          h -= 0.004;
          if (level >= 2) { const craze = 1 - smooth(0.003, 0.008, Math.abs(sample(F.mid, x * 3.1, y * 3.1) - 0.5)); col = col.map((v) => v * (1 - 0.55 * craze)); }
        } else { h -= 0.03; col = col.map((v) => v * 0.8); rough += 0.15; }
      }
      // Patine en taches, plus marquée avec l'âge.
      const blot = smooth(0.45, 0.75, n * 0.6 + lo * 0.5) * S.patina * (M.vivid && kind === 'paint' ? 0.4 : 1);
      if (blot > 0) col = col.map((v, k) => v + (M.patina[k] - v) * blot * 0.75);
      if (mk === 'copper' && S.patina > 0) { const vg = smooth(0.62, 0.8, lo) * S.patina * (band ? 0.5 + 0.5 * Math.abs(2 * u - 1) : 1); col = [col[0] + (70 - col[0]) * vg, col[1] + (118 - col[1]) * vg, col[2] + (100 - col[2]) * vg]; if (vg > 0.3) { metal = 0.3; rough = 0.85; } }
      px.rgb = col; px.h = h + (hi - 0.5) * 0.004 * (1 + level); px.hMode = 'set';
      px.kind = kind; px.metal = metal; px.rough = clamp01(rough + blot * 0.3);
      const amp = S.hammer; px.n = [tx * amp * 2, ty * amp * 2, 1];
      if (q.edge < 0.7) px.h -= 0.004;
    });
    // Filet de séparation entre le bandeau et la lèvre intérieure.
    L.engrave(circle(R_BAND), 1.2, 0.18);
    // Éraflures le long de l'anneau.
    for (let k = 0; k < S.scratches; k += 1) {
      const a = r() * TAU, rr = R_IN + 3 + r() * (R_EDGE - R_IN - 6), len = 0.02 + r() * 0.1;
      L.engrave(arcPath(rr, a, a + len), 0.6 + r() * 0.7, 0.1 + r() * 0.08, { albedo: r() > 0.35 ? 'rgba(245,235,215,0.35)' : 'rgba(20,12,6,0.35)' });
    }
    // Bosses (zones enfoncées).
    for (let k = 0; k < S.dents; k += 1) { const [x, y] = P(R_BAND + r() * 24, r() * TAU); L.engraveFill((ctx) => { ctx.beginPath(); ctx.ellipse(x, y, 4 + r() * 6, 3 + r() * 3, r() * 3, 0, TAU); }, 0.06 + r() * 0.05); }
    // Fêlures.
    for (let k = 0; k < S.cracks; k += 1) {
      let a = r() * TAU, rr = R_IN; const pts = [P(rr, a)]; const end = R_IN + 12 + r() * 30;
      while (rr < end) { rr += 3 + r() * 4; a += (r() - 0.5) * 0.03; pts.push(P(rr, a)); }
      L.engrave(poly(pts, false), 1.3, 0.55, { albedo: '#140c06' });
    }
    // Ébréchures sur les bords.
    for (let k = 0; k < S.chips; k += 1) {
      const a = r() * TAU, outer = r() > 0.3, s = 2.5 + r() * (2 + level * 1.6);
      const [cx, cy] = P(outer ? R_EDGE + 1 : R_IN - 1, a);
      const pts = []; for (let q = 0; q < 7; q += 1) { const qa = (q / 7) * TAU; const rad = s * (0.55 + r() * 0.6); pts.push([cx + Math.cos(qa) * rad, cy + Math.sin(qa) * rad]); }
      cut(L, poly(pts));
    }
    if (level === 3) {
      // Un pan arraché, une cassure franche de l'autre côté, de la suie.
      const jag = (a, sgn) => { const pts = []; for (let rr = 200; rr <= 258; rr += 5) pts.push(P(rr, a + sgn * r() * 0.035)); return pts; };
      const a0 = -0.95, a1 = -0.62;
      cut(L, poly([...jag(a0, -1), ...jag(a1, 1).reverse()]));
      const b = 1.2; const crackPts = []; for (let rr = 200; rr <= 258; rr += 4) crackPts.push(P(rr, b + (r() - 0.5) * 0.02));
      const other = crackPts.map(([x, y]) => [x + Math.cos(b + Math.PI / 2) * 2.2, y + Math.sin(b + Math.PI / 2) * 2.2]).reverse();
      cut(L, poly([...crackPts, ...other]));
      L.paint(ringPath(200, 256), (x, y, px) => {
        if (px.A < 0.1) { px.skip = true; return; }
        const n = sample(F.mid, x * 1.5 + 70, y * 1.5), l = sample(F.low, x * 2.5 + 30, y * 2.5);
        const soot = smooth(0.52, 0.74, n * 0.55 + l * 0.5); if (soot < 0.05) { px.skip = true; return; }
        px.rgb = [24, 19, 16]; px.alpha = soot * 0.7; px.rough = 0.9; px.metal = 0.2;
      });
    }
    const vivid = M.vivid ? { saturation: 1.12, tint: [1, 1, 1] } : {};
    return { opening: R_IN - 2, options: { ...vivid, seed: level * 3 + 2, wear: S.wear, room: M.room, lights: [{ dir: [-0.45, -0.62, 0.64], color: [1.65, 1.5, 1.25] }, { dir: [0.7, 0.45, 0.5], color: [0.16, 0.2, 0.3], shadow: false }], shadowHeight: 0.3 } };
  }

  function renderBase(mk, level, img) {
    const L = createLayers();
    const spec = build(L, mk, level);
    const lit = render(L, { ...spec.options, opening: spec.opening });
    const portrait = portraitCanvas(img, spec.opening + 6, { focus: [0.52, 0.33], zoom: 1, vignette: 0.5 });
    return compose({ portrait, frame: lit, opening: spec.opening });
  }

  root.BaseLab = { MATERIALS, STATES, renderBase };
}(window));
