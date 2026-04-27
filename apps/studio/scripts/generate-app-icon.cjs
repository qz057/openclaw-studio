const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const iconDir = path.resolve(__dirname, "../build/icons");
const icoPath = path.join(iconDir, "icon.ico");
const svgPath = path.join(iconDir, "icon.svg");
const previewPath = path.join(iconDir, "icon-1024.png");
const icoSizes = [16, 24, 32, 48, 64, 128, 256];

const colors = {
  bgTop: hexToRgb("#17232c"),
  bgBottom: hexToRgb("#071017"),
  bgGlow: hexToRgb("#1ddbcf"),
  plate: hexToRgb("#0f1921"),
  plateDeep: hexToRgb("#0a1118"),
  cyan: hexToRgb("#6efff1"),
  teal: hexToRgb("#16d6c8"),
  mint: hexToRgb("#c7fff4"),
  shadow: hexToRgb("#000000")
};

const crcTable = buildCrcTable();

fs.mkdirSync(iconDir, { recursive: true });
fs.writeFileSync(svgPath, buildSvg());
fs.writeFileSync(previewPath, encodePng(renderIcon(1024)));
fs.writeFileSync(icoPath, encodeIco(icoSizes.map((size) => encodePng(renderIcon(size)))));

console.log(`Generated ${svgPath}`);
console.log(`Generated ${previewPath}`);
console.log(`Generated ${icoPath}`);

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const aa = 1.6 / size;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const index = (y * size + x) * 4;
      const dst = [0, 0, 0, 0];

      const box = sdRoundRect(nx - 0.5, ny - 0.5, 0.47, 0.47, 0.18);
      const bgAlpha = clamp01(smoothStep(aa, -aa, box));
      if (bgAlpha <= 0) {
        continue;
      }

      const radial = clamp01(1 - distance(nx, ny, 0.29, 0.22) / 0.74);
      const vertical = clamp01(ny);
      const bg = mixColor(
        mixColor(colors.bgTop, colors.bgBottom, vertical),
        colors.bgGlow,
        0.12 * radial
      );
      blend(dst, bg, bgAlpha);

      const border = clamp01(smoothStep(0.018 + aa, 0.018 - aa, Math.abs(box)));
      blend(dst, colors.teal, border * bgAlpha * 0.42);

      const innerGlow = clamp01(smoothStep(0.13, -0.02, box)) * clamp01(1 - distance(nx, ny, 0.5, 0.5));
      blend(dst, colors.cyan, innerGlow * 0.07);

      const shield = [
        [0.5, 0.16],
        [0.76, 0.29],
        [0.69, 0.7],
        [0.5, 0.84],
        [0.31, 0.7],
        [0.24, 0.29]
      ];
      const insideShield = pointInPolygon(nx, ny, shield);
      if (insideShield) {
        const plateColor = mixColor(colors.plate, colors.plateDeep, ny);
        blend(dst, plateColor, 0.68);
      }
      drawPolyline(dst, nx, ny, shield.concat([shield[0]]), 0.026, colors.teal, colors.cyan, 0.7, aa);

      drawStrokeShadow(dst, nx, ny, [[0.36, 0.32], [0.42, 0.51], [0.5, 0.73]], 0.082, aa);
      drawStrokeShadow(dst, nx, ny, [[0.5, 0.25], [0.5, 0.66]], 0.086, aa);
      drawStrokeShadow(dst, nx, ny, [[0.64, 0.32], [0.58, 0.51], [0.5, 0.73]], 0.082, aa);

      drawPolyline(dst, nx, ny, [[0.36, 0.32], [0.42, 0.51], [0.5, 0.73]], 0.058, colors.cyan, colors.teal, 1, aa);
      drawPolyline(dst, nx, ny, [[0.5, 0.25], [0.5, 0.66]], 0.064, colors.mint, colors.teal, 1, aa);
      drawPolyline(dst, nx, ny, [[0.64, 0.32], [0.58, 0.51], [0.5, 0.73]], 0.058, colors.cyan, colors.teal, 1, aa);

      drawDot(dst, nx, ny, 0.5, 0.74, 0.04, colors.mint, 0.82, aa);
      drawDot(dst, nx, ny, 0.5, 0.74, 0.025, colors.teal, 0.9, aa);

      pixels[index] = Math.round(clamp01(dst[0]) * 255);
      pixels[index + 1] = Math.round(clamp01(dst[1]) * 255);
      pixels[index + 2] = Math.round(clamp01(dst[2]) * 255);
      pixels[index + 3] = Math.round(clamp01(dst[3]) * 255);
    }
  }

  return { width: size, height: size, data: pixels };
}

function drawStrokeShadow(dst, x, y, points, width, aa) {
  drawPolyline(dst, x + 0.018, y + 0.02, points, width, colors.shadow, colors.shadow, 0.3, aa);
}

function drawPolyline(dst, x, y, points, width, startColor, endColor, opacity, aa) {
  let best = Infinity;
  let progress = 0;
  let totalLength = 0;
  const segmentLengths = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const length = distance(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    segmentLengths.push(length);
    totalLength += length;
  }

  let walked = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const nearest = distanceToSegment(x, y, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    if (nearest.distance < best) {
      best = nearest.distance;
      progress = totalLength > 0 ? (walked + nearest.t * segmentLengths[i]) / totalLength : 0;
    }
    walked += segmentLengths[i];
  }

  const alpha = clamp01(smoothStep(width / 2 + aa, width / 2 - aa, best)) * opacity;
  if (alpha <= 0) {
    return;
  }
  blend(dst, mixColor(startColor, endColor, progress), alpha);
}

function drawDot(dst, x, y, cx, cy, radius, color, opacity, aa) {
  const alpha = clamp01(smoothStep(radius + aa, radius - aa, distance(x, y, cx, cy))) * opacity;
  if (alpha > 0) {
    blend(dst, color, alpha);
  }
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function sdRoundRect(x, y, halfWidth, halfHeight, radius) {
  const qx = Math.abs(x) - halfWidth + radius;
  const qy = Math.abs(y) - halfHeight + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp01(((px - ax) * dx + (py - ay) * dy) / lengthSq);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return { distance: distance(px, py, cx, cy), t };
}

function encodePng(image) {
  const stride = image.width * 4;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    raw[y * (stride + 1)] = 0;
    image.data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", Buffer.concat([
      uint32(image.width),
      uint32(image.height),
      Buffer.from([8, 6, 0, 0, 0])
    ])),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function encodeIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = Buffer.alloc(count * 16);
  let offset = 6 + count * 16;
  for (let i = 0; i < count; i += 1) {
    const size = icoSizes[i];
    const png = pngBuffers[i];
    entries[i * 16] = size >= 256 ? 0 : size;
    entries[i * 16 + 1] = size >= 256 ? 0 : size;
    entries[i * 16 + 2] = 0;
    entries[i * 16 + 3] = 0;
    entries.writeUInt16LE(1, i * 16 + 4);
    entries.writeUInt16LE(32, i * 16 + 6);
    entries.writeUInt32LE(png.length, i * 16 + 8);
    entries.writeUInt32LE(offset, i * 16 + 12);
    offset += png.length;
  }

  return Buffer.concat([header, entries, ...pngBuffers]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([uint32(data.length), typeBuffer, data, uint32(crc32(crcInput))]);
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function buildSvg() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="192" y1="64" x2="832" y2="960" gradientUnits="userSpaceOnUse">
      <stop stop-color="#17232C"/>
      <stop offset="1" stop-color="#071017"/>
    </linearGradient>
    <linearGradient id="mark" x1="384" y1="256" x2="512" y2="760" gradientUnits="userSpaceOnUse">
      <stop stop-color="#C7FFF4"/>
      <stop offset=".48" stop-color="#6EFFF1"/>
      <stop offset="1" stop-color="#16D6C8"/>
    </linearGradient>
    <filter id="softShadow" x="120" y="100" width="784" height="824" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse">
      <feDropShadow dx="20" dy="22" stdDeviation="34" flood-color="#000000" flood-opacity=".34"/>
    </filter>
  </defs>
  <rect x="31" y="31" width="962" height="962" rx="184" fill="url(#bg)"/>
  <rect x="43" y="43" width="938" height="938" rx="172" stroke="#16D6C8" stroke-opacity=".42" stroke-width="24"/>
  <path d="M512 164 778 297 708 717 512 860 316 717 246 297 512 164Z" fill="#0F1921" fill-opacity=".72" stroke="#44F1E1" stroke-opacity=".72" stroke-width="26" filter="url(#softShadow)"/>
  <path d="M369 328C402 458 433 615 512 750" stroke="url(#mark)" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M512 258V676" stroke="url(#mark)" stroke-width="66" stroke-linecap="round"/>
  <path d="M655 328C622 458 591 615 512 750" stroke="url(#mark)" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="512" cy="758" r="42" fill="#C7FFF4" fill-opacity=".82"/>
  <circle cx="512" cy="758" r="26" fill="#16D6C8"/>
</svg>
`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  ];
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function mixColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function blend(dst, rgb, alpha) {
  const srcAlpha = clamp01(alpha);
  const outAlpha = srcAlpha + dst[3] * (1 - srcAlpha);
  if (outAlpha === 0) {
    return;
  }
  dst[0] = (rgb[0] * srcAlpha + dst[0] * dst[3] * (1 - srcAlpha)) / outAlpha;
  dst[1] = (rgb[1] * srcAlpha + dst[1] * dst[3] * (1 - srcAlpha)) / outAlpha;
  dst[2] = (rgb[2] * srcAlpha + dst[2] * dst[3] * (1 - srcAlpha)) / outAlpha;
  dst[3] = outAlpha;
}

function smoothStep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
