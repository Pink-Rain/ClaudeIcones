// usage: node crop.cjs in.png out.png left top width height [scale]
const sharp = require('sharp');
const [,, inp, out, l, t, w, h, s] = process.argv;
const sc = Number(s || 1);
sharp(inp).extract({ left: +l, top: +t, width: +w, height: +h }).resize(Math.round(w * sc), Math.round(h * sc), { kernel: 'lanczos3' }).toFile(out).then(() => console.log('ok'));
