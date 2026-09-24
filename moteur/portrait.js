// Portrait de test : charge portrait.png (à côté de ce fichier) s'il existe,
// sinon dessine une silhouette neutre. Mets n'importe quelle image carrée ou verticale.
window.loadPortrait = function loadPortrait() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      const c = document.createElement('canvas'); c.width = 315; c.height = 774;
      const g = c.getContext('2d'); const bg = g.createLinearGradient(0, 0, 0, 774);
      bg.addColorStop(0, '#5a4a3e'); bg.addColorStop(1, '#2a221c'); g.fillStyle = bg; g.fillRect(0, 0, 315, 774);
      g.fillStyle = '#c8a488'; g.beginPath(); g.ellipse(160, 250, 70, 92, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1e1814'; g.beginPath(); g.ellipse(160, 560, 150, 170, 0, 0, Math.PI * 2); g.fill();
      resolve(c);
    };
    img.src = 'portrait.png';
  });
};
