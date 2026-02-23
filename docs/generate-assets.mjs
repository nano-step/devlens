import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData));
  return Buffer.concat([len, typeData, crc]);
}

function makePNG(width, height, rawData) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const compressed = deflateSync(rawData);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function drawIcon(width, height) {
  const raw = Buffer.alloc(height * (1 + width * 3), 255);
  const cx = width / 2 - width * 0.08;
  const cy = height / 2 - height * 0.08;
  const lensR = Math.min(width, height) * 0.32;
  const ringW = Math.max(2, width * 0.08);

  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const px = row + 1 + x * 3;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ringDist = Math.abs(dist - lensR);
      const hLen = (dx + dy) / Math.sqrt(2);
      const hPerp = Math.abs((dx - dy) / Math.sqrt(2));
      const onHandle = hPerp < ringW * 0.8 && hLen > lensR * 0.7 && hLen < lensR * 1.8;

      if (ringDist < ringW || onHandle) {
        const t = x / width;
        raw[px] = Math.round(99 * (1 - t) + 168 * t);
        raw[px + 1] = Math.round(102 * (1 - t) + 85 * t);
        raw[px + 2] = Math.round(241 * (1 - t) + 247 * t);
      } else if (dist < lensR - ringW) {
        const bx = x - cx, by = y - cy;
        const bw = lensR * 0.3, bh = lensR * 0.5;
        if (bx < 0 && bx > -bw && Math.abs(by) < bh) {
          raw[px] = 99; raw[px + 1] = 102; raw[px + 2] = 241;
        } else if (bx > 0 && bx < bw && Math.abs(by) < bh) {
          raw[px] = 168; raw[px + 1] = 85; raw[px + 2] = 247;
        }
      }
    }
  }
  return raw;
}

function drawOG() {
  const w = 1200, h = 630;
  const raw = Buffer.alloc(h * (1 + w * 3));

  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 3);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const px = row + 1 + x * 3;
      const t = (x / w + y / h) / 2;
      raw[px] = Math.round(49 + (99 - 49) * (1 - t) + (88 - 49) * t);
      raw[px + 1] = Math.round(46 + (102 - 46) * (1 - t) + (48 - 46) * t);
      raw[px + 2] = Math.round(200 + (241 - 200) * (1 - t));
    }
  }

  const cx = w / 2 - 60, cy = h * 0.4;
  const lr = 55, rw = 7;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rd = Math.abs(dist - lr);
      const hl = (dx + dy) / Math.sqrt(2);
      const hp = Math.abs((dx - dy) / Math.sqrt(2));
      const onH = hp < rw && hl > lr * 0.6 && hl < lr * 1.6;
      if (rd < rw || onH) {
        const row = y * (1 + w * 3);
        const px = row + 1 + x * 3;
        raw[px] = 255; raw[px + 1] = 255; raw[px + 2] = 255;
      }
    }
  }

  const textY = h * 0.4, textH = 36, textX = cx + 80, textW = 220;
  for (let y = Math.floor(textY - textH / 2); y < textY + textH / 2; y++) {
    for (let x = textX; x < textX + textW; x++) {
      if (x >= w || y >= h || y < 0) continue;
      const row = y * (1 + w * 3);
      const px = row + 1 + x * 3;
      raw[px] = 255; raw[px + 1] = 255; raw[px + 2] = 255;
    }
  }

  const subY = h * 0.62, subH = 14, subX = w / 2 - 200, subW = 400;
  for (let y = Math.floor(subY - subH / 2); y < subY + subH / 2; y++) {
    for (let x = subX; x < subX + subW; x++) {
      if (x >= w || y >= h || y < 0 || x < 0) continue;
      const row = y * (1 + w * 3);
      const px = row + 1 + x * 3;
      raw[px] = 220; raw[px + 1] = 220; raw[px + 2] = 255;
    }
  }

  return { raw, w, h };
}

const icon16 = drawIcon(16, 16);
const icon32 = drawIcon(32, 32);
const icon180 = drawIcon(180, 180);
const og = drawOG();

writeFileSync('docs/public/favicon-16x16.png', makePNG(16, 16, icon16));
writeFileSync('docs/public/favicon-32x32.png', makePNG(32, 32, icon32));
writeFileSync('docs/public/apple-touch-icon.png', makePNG(180, 180, icon180));
writeFileSync('docs/public/og-image.png', makePNG(og.w, og.h, og.raw));

console.log('Generated: favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, og-image.png');
