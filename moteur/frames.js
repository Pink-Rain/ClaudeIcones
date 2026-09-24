// Labo Eraser — cadres épiques sculptés (hors application) : noyau commun.
(function (root) {
  'use strict';
  const { C, TAU, createLayers, render, compose, portraitCanvas, ringStyle } = root.Relief;
  const { ringPath } = root.Helpers;

  const frames = [];
  const add = (id, name, build) => frames.push({ id, name, build });
  const FONT = (size, weight = 700) => `${weight} ${size}px "FreeSerif", "Liberation Serif", serif`;

  // Lèvre intérieure commune : demi-jonc sur lequel repose le portrait.
  function innerLip(L, r, mat, color, w = 10) {
    L.fill(ringPath(r, r + w), { albedo: color, height: ringStyle(C, C, r, r + w, 0.28, 0.6, 'round'), ...mat, op: 'source-over' });
  }
  const glowDot = (x, y, r, color) => (e) => { const g = e.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = g; e.beginPath(); e.arc(x, y, r, 0, TAU); e.fill(); };
  // Vide l'ouverture : rien du cadre ne doit recouvrir le portrait.
  function cutOpening(L, r) {
    for (const ctx of [L.a, L.m, L.e]) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(C, C, r, 0, TAU); ctx.fill(); ctx.restore(); }
    L.h.save(); L.h.fillStyle = '#000'; L.h.beginPath(); L.h.arc(C, C, r, 0, TAU); L.h.fill(); L.h.restore();
  }
  const angleDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

  function renderFrame(id, img) {
    const frame = frames.find((item) => item.id === id);
    const L = createLayers();
    const spec = frame.build(L) || {};
    const opening = spec.opening || 176;
    const lit = render(L, { ...(spec.options || {}), opening, ...(root.LabOverride || {}) });
    const portrait = portraitCanvas(img, opening + 4, { focus: [0.52, 0.34], zoom: 1, ...(spec.portrait || {}) });
    return compose({ back: spec.back, portrait, frame: lit, front: spec.front, opening });
  }

  root.FrameKit = { add, innerLip, FONT, glowDot, cutOpening, angleDiff };
  root.EpicLab = { frames, renderFrame };
}(window));
