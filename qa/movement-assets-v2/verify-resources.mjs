import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = process.env.FAMILY_PREVIEW_URL || 'http://127.0.0.1:8081';
const site = new URL('../../prototype/movement-assets-v2/', import.meta.url);
const project = new URL('../../', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile(new URL('assets/skin-manifest.json', site), 'utf8'));
const results = { date: new Date().toISOString(), base, resources: [], artwork: [], preservation: [] };
const resources = [
  ['', 'html'], ['styles.css', 'css'], ['art-skin.css', 'css'],
  ['app.js', 'javascript'], ['components.js', 'javascript'], ['field.js', 'javascript'],
  ['model.mjs', 'javascript'], ['commands.mjs', 'javascript'], ['spatial.mjs', 'javascript'],
  ['data/review_data.json', 'json'], ['assets/skin-manifest.json', 'json'],
  ['assets/world_map_source.png', 'image/png'],
  ...manifest.skins.flatMap(s => [[s.source, 'image/png'], [s.display, 'image/svg+xml']])
];
try {
  for (const [path, mime] of resources) {
    const response = await fetch(`${base}/${path}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const result = { path, status: response.status, mime: response.headers.get('content-type'), bytes: bytes.length };
    results.resources.push(result);
    assert.equal(response.status, 200, path);
    assert.ok(result.mime?.includes(mime), `${path}: expected ${mime}`);
    assert.ok(bytes.length > 0, `${path} is empty`);
  }
  for (const skin of manifest.skins) {
    const bytes = await readFile(new URL(skin.source, site));
    const svg = await readFile(new URL(skin.display, site), 'utf8');
    const payload = svg.match(/xlink:href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/);
    assert.ok(payload, `${skin.name} embeds its PNG without external SVG image dependencies`);
    const embedded = Buffer.from(payload[1], 'base64');
    const file = skin.source.split('/').at(-1);
    const approved = await readFile(new URL(`art/ui_review/set-01/${file}`, project));
    assert.equal(hash(embedded), hash(bytes), `${skin.name}: embedded pixels unchanged`);
    assert.equal(hash(bytes), hash(approved), `${skin.name}: approved original unchanged`);
    assert.equal(hash(bytes), skin.sha256, `${skin.name}: manifest agrees`);
    results.artwork.push({ name: skin.name, sha256: hash(bytes), approvedCopyMatches: true, embeddedCopyMatches: true });
  }
  assert.equal(hash(await readFile(new URL('assets/world_map_source.png', site))), hash(await readFile(new URL('reference/world/world_map_source.png', project))), 'Original world map preserved');
  const baseline = JSON.parse((await readFile(new URL('./pre-existing-files.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
  for (const file of baseline) {
    const unchanged = hash(await readFile(new URL(file.path, project))) === file.sha256;
    results.preservation.push({ path: file.path, unchanged });
    assert.ok(unchanged, `Pre-existing file changed: ${file.path}`);
  }
  results.passed = true;
  console.log(`HTTP ${results.resources.length}/${resources.length}; approved/embedded PNGs ${results.artwork.length}/8; original world map matched; pre-existing files ${results.preservation.length}/${baseline.length} unchanged.`);
} catch (error) {
  results.passed = false;
  results.error = error.message;
  process.exitCode = 1;
  console.error(error.message);
} finally {
  await writeFile(new URL('./resource-results.json', import.meta.url), JSON.stringify(results, null, 2));
}
