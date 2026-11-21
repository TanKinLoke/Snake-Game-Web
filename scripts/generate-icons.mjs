import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(root, 'public', 'icon-art.svg'));
const sizes = [
  ['apple-touch-icon.png', 180],
  ['apple-touch-icon-v2.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['favicon-32x32.png', 32],
];

for (const [name, size] of sizes) {
  await sharp(svg, { density: 192 })
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(root, 'public', name));
}

  const faviconPng = await readFile(path.join(root, 'public', 'favicon-32x32.png'));
  const faviconHeader = Buffer.alloc(22);
  faviconHeader.writeUInt16LE(0, 0);
  faviconHeader.writeUInt16LE(1, 2);
  faviconHeader.writeUInt16LE(1, 4);
  faviconHeader.writeUInt8(32, 6);
  faviconHeader.writeUInt8(32, 7);
  faviconHeader.writeUInt8(0, 8);
  faviconHeader.writeUInt8(0, 9);
  faviconHeader.writeUInt16LE(1, 10);
  faviconHeader.writeUInt16LE(32, 12);
  faviconHeader.writeUInt32LE(faviconPng.length, 14);
  faviconHeader.writeUInt32LE(faviconHeader.length, 18);
  await writeFile(path.join(root, 'public', 'favicon.ico'), Buffer.concat([faviconHeader, faviconPng]));
