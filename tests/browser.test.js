// Opt-in: runs the portable core in headless Chromium and requires exactly
// the same results as Node. Needs a local Playwright install:
//   MWER_PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as core from '../tools/core/index.js';
import { loadCatalog } from '../tools/lib/catalog.js';
import { repoRoot } from '../tools/lib/vocabulary.js';

const playwright = process.env.MWER_PLAYWRIGHT;
const CREATED = '2026-09-15T00:00:00Z';

const PAGE = `<!doctype html><meta charset="utf-8"><script type="module">
import * as core from '/tools/core/index.js';
const catalog = await (await fetch('/__catalog.json')).json();
const { inputs, cells, created } = await (await fetch('/__cases.json')).json();
const composed = inputs.map(input => core.composeManifest(input, catalog, { created }));
const bootstraps = [];
for (const cell of cells) {
  const manifest = await (await fetch('/' + cell.manifest)).json();
  bootstraps.push(core.assembleBootstrap(manifest, catalog, { rung: cell.rung, label: cell.code }));
}
window.result = { composed, digests: composed.map(core.computeDigest), bootstraps };
</script>`;

test('the core runs in headless Chromium with results identical to Node', { skip: !playwright && 'set MWER_PLAYWRIGHT to run' }, async () => {
  const catalog = loadCatalog();
  const families = ['epistemic', 'agency', 'identity', 'world'];
  const inputs = Array.from({ length: 80 }, (_, i) => ({
    family: families[i % 4],
    setting: { path: i % 3 ? ['history'] : [], description: null, request: i % 2 ? 'Vatican during Medici control' : null },
    role: null,
    intensity: 1 + (i % 5),
    boundaries: { sexual: 'none', violence: 'implied', language: 'moderate', exclude: i % 7 ? [] : ['drowning'] },
    seed: `browser-${i}-Ἰθάκη`,
  }));
  const { cells } = JSON.parse(readFileSync(new URL('pilot/cells.json', repoRoot), 'utf8'));
  const cases = JSON.stringify({ inputs, cells, created: CREATED });

  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path === '/') return response.writeHead(200, { 'content-type': 'text/html' }).end(PAGE);
    if (path === '/__catalog.json') return response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(catalog));
    if (path === '/__cases.json') return response.writeHead(200, { 'content-type': 'application/json' }).end(cases);
    if (path.includes('..')) return response.writeHead(403).end();
    try {
      const body = readFileSync(new URL(`.${path}`, repoRoot));
      const type = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.json') ? 'application/json' : 'text/plain';
      response.writeHead(200, { 'content-type': type }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  const { chromium } = await import(pathToFileURL(playwright).href);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.result, null, { timeout: 60000 });
    const result = await page.evaluate(() => window.result);
    assert.deepEqual(pageErrors, []);

    const composed = inputs.map(input => core.composeManifest(input, catalog, { created: CREATED }));
    assert.deepEqual(result.composed, composed);
    assert.deepEqual(result.digests, composed.map(core.computeDigest));
    cells.forEach((cell, i) => {
      assert.equal(result.bootstraps[i], readFileSync(new URL(`pilot/bootstraps/${cell.code}.md`, repoRoot), 'utf8'), cell.code);
    });
  } finally {
    await browser.close();
    server.close();
  }
});
