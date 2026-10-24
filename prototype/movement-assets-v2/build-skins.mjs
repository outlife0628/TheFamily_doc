// Display adapters for approved, unmodified PNGs. No raster pixels are regenerated.
// The SVG viewport removes export padding; CSS nine-slicing keeps corner geometry.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const definitions = [
  ['button-gold', '01-button-primary-gold.png', [94, 194, 1983, 315]],
  ['button-charcoal', '02-button-secondary-charcoal.png', [94, 189, 1984, 321]],
  ['parchment', '03-panel-parchment.png', [67, 89, 952, 1269]],
  ['dialog', '04-dialog-shell.png', [53, 70, 1577, 792]],
  ['dark', '05-panel-dark.png', [60, 118, 1740, 591]],
  ['minimap', '06-minimap-frame.png', [71, 60, 1113, 1103]],
  ['objective', '07-objective-card.png', [62, 186, 1898, 362]],
  ['compass', '08-compass-line-v3.png', [162, 161, 928, 940]]
];
const manifest = [];
for (const [name, file, crop] of definitions) {
  const bytes = await readFile(new URL(`./assets/ui/${file}`, import.meta.url));
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  const [x, y, w, h] = crop;
  if (x < 0 || y < 0 || x + w > width || y + h > height) throw Error(`Invalid display viewport: ${file}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="${crop.join(' ')}"><image width="${width}" height="${height}" xlink:href="data:image/png;base64,${bytes.toString('base64')}"/></svg>\n`;
  await writeFile(new URL(`./assets/skins/${name}.svg`, import.meta.url), svg);
  manifest.push({ name, source: `assets/ui/${file}`, display: `assets/skins/${name}.svg`, width, height, viewport: crop, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(new URL('./assets/skin-manifest.json', import.meta.url), JSON.stringify({ approval: 'User approved assets and HTML work on 2026-10-23', rasterPixelsChanged: false, compassVariant: 'B, thin line', skins: manifest }, null, 2));
console.log(`Prepared ${manifest.length} display adapters from unchanged approved PNGs.`);
