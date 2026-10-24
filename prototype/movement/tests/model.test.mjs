import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createState, quote, selectDestination, selectTransport, depart, advance, resume } from '../model.mjs';

const data = JSON.parse(readFileSync(new URL('../data/review_data.json', import.meta.url)));
const start = () => createState(data);
const prepared = () => { const s = start(); selectDestination(s, 'human', data); return s; };
const travel = () => { const s = prepared(); depart(s, data); return s; };
const actual = s => ({ money: s.money, days: s.days, location: s.location, cargo: s.cargo, journey: s.journey });

test('initial state separates the selected destination from actual city', () => {
  const s = start();
  assert.deepEqual(s.location, { kind: 'city', cityId: 'sydria' });
  assert.equal(s.money, 2400);
  assert.equal(s.days, 0);
  assert.equal(s.cargo, 18);
  assert.equal(s.phase, 'city');
});
test('destination selection and quote do not move assets or spend time/money', () => {
  const s = start(), before = structuredClone(actual(s));
  assert.equal(selectDestination(s, 'dwarf', data), true);
  assert.equal(quote(s, data).cost, 180);
  assert.deepEqual(actual(s), before);
});
test('unknown and non-public destinations cannot be selected', () => {
  const s = start(), before = s.selectedId;
  assert.equal(selectDestination(s, 'unknown', data), false);
  const hidden = structuredClone(data); hidden.locations[1].public = false;
  assert.equal(selectDestination(s, 'human', hidden), false);
  assert.equal(s.selectedId, before);
});
test('quote is read only and cancelling a quote leaves real state unchanged', () => {
  const s = prepared(), before = structuredClone(s);
  for (let i = 0; i < 3; i++) quote(s, data);
  assert.deepEqual(s, before);
});
test('current city cannot be a departure destination', () => {
  const s = start(); selectDestination(s, 'sydria', data);
  assert.match(quote(s, data).reasons.join(' '), /현재 위치/);
  assert.equal(depart(s, data).ok, false);
});
test('overloaded transport is explained and cannot depart', () => {
  const s = prepared(); selectTransport(s, 'foot', data);
  assert.match(quote(s, data).reasons.join(' '), /적재 초과/);
  assert.equal(depart(s, data).ok, false);
  assert.equal(s.money, 2400);
});
test('incompatible route and unowned vehicle are explained', () => {
  const s = start(); selectDestination(s, 'port', data);
  assert.match(quote(s, data).reasons.join(' '), /이 수단으로/);
  selectTransport(s, 'airship', data);
  assert.match(quote(s, data).reasons.join(' '), /미보유/);
  assert.equal(depart(s, data).ok, false);
});
test('closed public route is readable and refuses departure', () => {
  const s = start(); selectDestination(s, 'elf', data);
  assert.match(quote(s, data).reasons.join(' '), /통행이 중단/);
  assert.equal(depart(s, data).ok, false);
});
test('departure rechecks insufficient money and preserves state', () => {
  const s = prepared(); assert.equal(quote(s, data).canDepart, true);
  s.money = 119; const before = structuredClone(actual(s));
  assert.equal(depart(s, data).ok, false);
  assert.deepEqual(actual(s), before);
});
test('exact fare is allowed and departure consumes fare once without time advancement', () => {
  const s = prepared(); s.money = 120;
  assert.equal(depart(s, data).ok, true);
  assert.equal(s.money, 0);
  assert.equal(s.days, 0);
  assert.equal(s.location.kind, 'route');
  assert.equal(depart(s, data).ok, false);
  assert.equal(s.money, 0);
  assert.equal(s.nextJourneyId, 2);
});
test('a journey snapshots the committed destination and transport', () => {
  const s = travel();
  assert.equal(selectDestination(s, 'dwarf', data), false);
  assert.equal(selectTransport(s, 'foot', data), false);
  assert.equal(s.journey.to, 'human');
  assert.equal(s.journey.transportId, 'cart');
});
test('advance halts at a stop boundary and cannot advance while stopped', () => {
  const s = travel();
  assert.equal(advance(s).ok, true);
  assert.equal(s.phase, 'stopped');
  assert.equal(s.days, 1);
  assert.equal(s.journey.elapsed, 1);
  const before = structuredClone(actual(s));
  assert.equal(advance(s).ok, false);
  assert.deepEqual(actual(s), before);
});
test('resume retains journey identity, fare, cargo and remaining work', () => {
  const s = travel(); advance(s);
  const id = s.journey.id;
  assert.equal(resume(s).ok, true);
  assert.equal(s.journey.id, id);
  assert.equal(s.journey.elapsed, 1);
  assert.equal(s.money, 2280);
  assert.equal(s.days, 1);
  assert.equal(s.cargo, 18);
  assert.equal(resume(s).ok, false);
});
test('arrival changes actual city once with no automatic trade, return or reward', () => {
  const s = travel(); advance(s); resume(s); advance(s); advance(s);
  assert.equal(s.phase, 'arrived');
  assert.equal(s.days, 3);
  assert.deepEqual(s.location, { kind: 'city', cityId: 'human' });
  assert.equal(s.money, 2280);
  assert.equal(s.cargo, 18);
  assert.equal(s.records.filter(r => r.type === 'arrival').length, 1);
  const before = structuredClone(s);
  assert.equal(advance(s).ok, false);
  assert.equal(resume(s).ok, false);
  assert.deepEqual(s, before);
});
test('reverse journey uses the actual arrival city and returns on the same route', () => {
  const s = travel(); advance(s); resume(s); advance(s); advance(s);
  selectDestination(s, 'sydria', data);
  assert.equal(quote(s, data).canDepart, true);
  assert.equal(depart(s, data).ok, true);
  assert.equal(s.journey.from, 'human');
  assert.equal(s.journey.to, 'sydria');
  advance(s); resume(s); advance(s); advance(s);
  assert.deepEqual(s.location, { kind: 'city', cityId: 'sydria' });
  assert.equal(s.money, 2160);
  assert.equal(s.days, 6);
});
test('no direct route is not silently treated as free instantaneous travel', () => {
  const s = start(); s.location = { kind: 'city', cityId: 'human' };
  selectDestination(s, 'dwarf', data);
  assert.equal(quote(s, data).canDepart, false);
  assert.match(quote(s, data).reasons.join(' '), /직접 연결/);
});
test('party above eight, invalid costs and invalid cargo fail safely', () => {
  const s = prepared(); s.actorIds = Array(9).fill('chris');
  assert.equal(depart(s, data).ok, false);
  s.actorIds = ['chris']; s.cargo = -1;
  assert.equal(depart(s, data).ok, false);
  s.cargo = 18; const invalid = structuredClone(data); invalid.routes[0].cost = -1;
  assert.equal(depart(s, invalid).ok, false);
});
