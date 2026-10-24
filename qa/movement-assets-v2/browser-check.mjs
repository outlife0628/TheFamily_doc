// Dependency-free, real Chromium integration checks for the authored local app.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const base = process.env.FAMILY_PREVIEW_URL || 'http://127.0.0.1:8081';
const profile = await mkdtemp(join(tmpdir(), 'family-movement-chrome-'));
const browserExe = process.env.FAMILY_BROWSER_EXE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(browserExe, [
  '--headless=new', '--disable-gpu', '--in-process-gpu', '--no-first-run', '--no-default-browser-check', '--enable-logging=stderr',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'
], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
let chromeLog = '';
chrome.stderr.on('data', chunk => { chromeLog += chunk.toString(); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, counter = 0, session, failures = [], successes = [], errors = [], requests = [], diagnostics = [];
const waiting = new Map();
const out = resolve('qa/movement-assets-v2', process.env.FAMILY_QA_RUN || 'chrome');
await mkdir(join(out, 'screenshots'), { recursive: true });
async function call(method, params = {}, ownSession = session) {
  const id = ++counter;
  return await new Promise((res, rej) => {
    const timer = setTimeout(() => { waiting.delete(id); rej(new Error(`CDP timeout: ${method}`)); }, 12000);
    waiting.set(id, { res: v => { clearTimeout(timer); res(v); }, rej: e => { clearTimeout(timer); rej(e); } });
    diagnostics.push({ send: method, id, session: ownSession });
    ws.send(JSON.stringify({ id, method, params, ...(ownSession ? { sessionId: ownSession } : {}) }));
  });
}
async function evaluate(expression) {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ': ' + r.exceptionDetails.exception?.description);
  return r.result.value;
}
async function until(expression) {
  for (let n = 0; n < 100; n++) { if (await evaluate(expression)) return; await sleep(70); }
  throw new Error(`UI timeout: ${expression}`);
}
async function pointerClick(x,y,clickCount=1) {
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount});
}
async function bounds(selector) {
  const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control');const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};})()`);
  assert.ok(point.w>0&&point.h>0,`Control is not visible: ${selector}`);
  return point;
}
async function click(selector) { const p=await bounds(selector);await pointerClick(p.x,p.y); }
async function doubleClick(selector) { const p=await bounds(selector);await pointerClick(p.x,p.y,1);await pointerClick(p.x,p.y,2); }
const textOf = selector => evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent.trim()`);
async function shot(name) {
  await sleep(120);
  const { data } = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(out, 'screenshots', name + '.png'), Buffer.from(data, 'base64'));
}
async function actionGeometry(selector) {
  const controls = await evaluate(`(()=>[...document.querySelectorAll(${JSON.stringify(selector)})].map(e=>{const r=e.getBoundingClientRect(),t=e.querySelector('span').getBoundingClientRect();return {w:r.width,h:r.height,x:r.x,y:r.y,textFits:t.width<r.width-60};}))()`);
  assert.ok(controls.length > 0);
  for (const control of controls) {
    assert.equal(control.w, 320); assert.equal(control.h, 64);
    assert.ok(control.x >= 0 && control.x + control.w <= 1920 && control.y >= 0 && control.y + control.h <= 1080);
    assert.ok(control.textFits, 'Action label fits its visible button');
  }
}
async function check(name, fn) {
  try { await fn(); successes.push(name); console.log(`PASS ${name}`); }
  catch (error) { failures.push({ name, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); throw error; }
}
async function key(key, code, modifiers = 0, type = 'keyDown') {
  await call('Input.dispatchKeyEvent', { type, key, code, modifiers, windowsVirtualKeyCode: { Tab: 9, Enter: 13, Escape: 27, ArrowDown: 40 }[key] || 0 });
  if (type === 'keyDown') await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers });
}

try {
  let endpoint;
  for (let n = 0; n < 120; n++) {
    try { const lines = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/); endpoint = `ws://127.0.0.1:${lines[0]}${lines[1]}`; break; } catch { await sleep(100); }
  }
  if (!endpoint) throw Error('Installed Chrome did not expose its temporary debugging endpoint.');
  ws = new WebSocket(endpoint);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    diagnostics.push({ receive: msg.method || 'response', id: msg.id, session: msg.sessionId, error: msg.error });
    if (msg.id && waiting.has(msg.id)) {
      const p = waiting.get(msg.id); waiting.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails);
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args);
    else if (msg.method === 'Network.responseReceived') requests.push({ url: msg.params.response.url, status: msg.params.response.status });
    else if (msg.method === 'Network.loadingFailed') errors.push(msg.params);
  };
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' }, null);
  diagnostics.push({ targets: await call('Target.getTargets', {}, null) });
  diagnostics.push({ processes: await call('SystemInfo.getProcessInfo', {}, null) });
  ({ sessionId: session } = await call('Target.attachToTarget', { targetId, flatten: true }, null));
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: base });
  await until("document.querySelector('#app')?.dataset.ready === 'true'");

  await check('ART-02 / eight approved bitmap skins decoded before UI boot', async () => {
    assert.equal(await evaluate("document.querySelector('#app').dataset.artReady"), 'true');
    const skins=await evaluate("fetch('assets/skin-manifest.json').then(r=>r.json()).then(m=>m.skins.length)");
    assert.equal(skins,8);
    assert.match(await evaluate("getComputedStyle(document.querySelector('.quest-tracker'),'::before').borderImageSource"), /objective\.svg/);
    assert.equal(await evaluate("document.querySelector('.minimap-bezel').naturalWidth > 0"),true);
    assert.equal(await evaluate("document.querySelector('.minimap-art').getBoundingClientRect().width"),252);
  });

  await check('HTML-01 / field HUD and original map load', async () => {
    assert.equal(await evaluate("document.querySelector('#app').dataset.screen"), 'field');
    assert.equal(await evaluate("document.querySelectorAll('.quest-tracker').length"), 1);
    assert.equal(await evaluate("document.querySelectorAll('.actor-portrait').length"), 0);
    assert.equal(await evaluate('innerWidth'), 1920);
    await shot('01-field');
  });
  await click('[data-action="worldmap"]');
  await check('ART-01 / raster materials attached to native panels and actions', async () => {
    assert.match(await evaluate("getComputedStyle(document.querySelector('.destination-panel'),'::before').borderImageSource"), /parchment\.svg/);
    assert.match(await evaluate("getComputedStyle(document.querySelector('.button-primary'),'::before').borderImageSource"), /button-gold\.svg/);
    assert.match(await evaluate("getComputedStyle(document.querySelector('.button-secondary'),'::before').borderImageSource"), /button-charcoal\.svg/);
    assert.equal(await evaluate("document.querySelector('.asset-compass').naturalWidth > 0"),true);
    await actionGeometry('.action-dock .action-button');
  });
  await check('MOV-01 / destination and transport selection leave real state unchanged', async () => {
    assert.match(await textOf('#cash'), /2,400/);
    await click('.map-marker[data-destination="dwarf"]');
    assert.equal(await evaluate("document.querySelector('.destination-row[aria-selected=true]').dataset.destination"), 'dwarf');
    assert.equal(await evaluate("document.querySelector('.map-marker.is-selected').dataset.destination"), 'dwarf');
    assert.match(await textOf('#cash'), /2,400/);
    assert.match(await textOf('#calendar'), /경과 0일/);
    assert.match(await textOf('#current-location'), /시드리아/);
    await click('.destination-row[data-destination="human"]');
    await shot('02-worldmap');
  });
  await check('MOV-03 / overloaded transport and closed route show reasons', async () => {
    await evaluate("(()=>{const e=document.querySelector('#transport-select');e.value='foot';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    assert.match(await textOf('#departure-reasons'), /적재 초과/);
    assert.equal(await evaluate("document.querySelector('[data-action=prepare]').disabled"), true);
    await shot('08-overload');
    await evaluate("(()=>{const e=document.querySelector('#transport-select');e.value='cart';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await click('.destination-row[data-destination="elf"]');
    assert.match(await textOf('#departure-reasons'), /通行|통행/);
    await click('.destination-row[data-destination="human"]');
  });
  await check('UI-05 / map zoom changes display only and keeps image ratio', async () => {
    const before = await evaluate("document.querySelector('#world-map').getAttribute('viewBox')");
    await click('[data-action="zoom-in"]');
    assert.notEqual(await evaluate("document.querySelector('#world-map').getAttribute('viewBox')"), before);
    assert.equal(await evaluate("document.querySelector('#world-map image').getAttribute('width')"), '1511');
    assert.equal(await evaluate("document.querySelector('#world-map image').getAttribute('height')"), '1041');
    assert.match(await textOf('#cash'), /2,400/);
    await click('[data-action="map-fit"]');
  });
  await click('[data-action="prepare"]');
  await check('UI-04 / modal cancel focus, trap, synthetic composition handler and inert background', async () => {
    assert.equal(await evaluate("document.activeElement.dataset.action"), 'cancel-modal');
    assert.equal(await evaluate("document.querySelector('#screen-content').inert"), true);
    assert.match(await evaluate("getComputedStyle(document.querySelector('.confirm-dialog'),'::before').borderImageSource"), /dialog\.svg/);
    await actionGeometry('[role=dialog] .action-button');
    const before = await evaluate("document.querySelector('#app').dataset.phase");
    await evaluate("document.querySelector('[data-action=confirm-depart]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}));");
    assert.equal(await evaluate("document.querySelector('#app').dataset.phase"), before);
    await key('Tab', 'Tab', 8);
    assert.equal(await evaluate("document.activeElement.closest('[role=dialog]') !== null"), true);
    await shot('03-departure-confirm');
    await key('Escape', 'Escape');
    assert.equal(await evaluate("document.querySelector('[role=dialog]') === null"), true);
    assert.equal(await evaluate("document.activeElement.dataset.action"), 'prepare');
    assert.match(await textOf('#cash'), /2,400/);
  });
  await click('[data-action="prepare"]');
  await doubleClick('[data-action="confirm-depart"]');
  await check('MOV-02 / native pointer double confirmation consumes fare once', async () => {
    assert.match(await textOf('#cash'), /2,280/);
    assert.match(await textOf('#calendar'), /경과 0일/);
    assert.equal(await evaluate("document.querySelector('#app').dataset.phase"), 'traveling');
    await shot('04-journey');
  });
  await doubleClick('[data-action="advance"]');
  await check('MOV-04 / stop and field inspection preserve remaining journey', async () => {
    assert.equal(await evaluate("document.querySelector('#app').dataset.phase"), 'stopped');
    assert.match(await textOf('#remaining-days'), /2/);
    await shot('05-stopped');
    await click('[data-action="inspect-stop"]');
    assert.equal(await evaluate("document.querySelector('#app').dataset.screen"), 'stop-field');
    await shot('06-stop-field');
    await click('[data-action="journey"]');
    assert.match(await textOf('#remaining-days'), /2/);
    assert.match(await textOf('#cash'), /2,280/);
    await doubleClick('[data-action="resume"]');
    assert.match(await textOf('#calendar'), /경과 1일/);
    assert.match(await textOf('#remaining-days'), /2/);
    await click('[data-action="advance"]'); await click('[data-action="advance"]');
  });
  await check('MOV-05 / arrival changes city once without trade, return or rewards', async () => {
    assert.equal(await evaluate("document.querySelector('#app').dataset.phase"), 'arrived');
    assert.match(await textOf('#current-location'), /인간 도시/);
    assert.match(await textOf('#cash'), /2,280/);
    assert.match(await textOf('#calendar'), /경과 3일/);
    assert.match(await textOf('#cargo-value'), /18/);
    await shot('07-arrival');
  });
  await check('UI-01~03 / 100% typography, fixed action slots and viewport bounds', async () => {
    assert.equal(await evaluate("document.querySelectorAll('[data-font-scale],#font-scale').length"), 0);
    const primary = await evaluate("(()=>{const r=document.querySelector('.action-dock .button-primary').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()");
    assert.equal(primary.w, 320); assert.equal(primary.h, 64);
    await actionGeometry('.action-dock .action-button');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight'), true);
  });
  await check('UI-03 / journey parchment frame stays outside the scrolling body', async () => {
    const result=await evaluate(`(()=>{
      const panel=document.querySelector('.journey-summary');
      const scroll=panel.querySelector('.surface-scroll');
      if(!scroll)throw Error('Missing inner scroll body');
      const filler=document.createElement('div');filler.style.height='900px';filler.setAttribute('aria-hidden','true');scroll.append(filler);
      const original=scroll.scrollTop;scroll.scrollTop=scroll.scrollHeight;
      const result={innerScroll:scroll.scrollTop,outerScroll:panel.scrollTop,outerOverflow:getComputedStyle(panel).overflowY,material:getComputedStyle(panel,'::before').borderImageSource};
      filler.remove();scroll.scrollTop=original;return result;
    })()`);
    assert.ok(result.innerScroll>0); assert.equal(result.outerScroll,0); assert.equal(result.outerOverflow,'hidden');
    assert.match(result.material,/parchment\.svg/);
  });
  await check('QA-01 / browser console and local resource requests', async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(requests.filter(r => r.status >= 400), []);
    assert.equal(requests.filter(r => /^https?:/.test(r.url)).every(r => r.url.startsWith(base)), true);
  });
} catch (e) {
  if (!failures.length) failures.push({ name: 'browser setup or flow', error: e.stack });
  process.exitCode = 1;
} finally {
  await writeFile(join(out, 'browser-results.json'), JSON.stringify({ date: new Date().toISOString(), base, browserExe, viewport: [1920,1080], successes, failures, errors, requests, diagnostics, chromeLog }, null, 2));
  if (ws?.readyState === 1) { try { await call('Browser.close', {}, null); } catch {} ws.close(); }
  chrome.kill();
  console.log(`Browser checks: ${successes.length} passed, ${failures.length} failed.`);
}
