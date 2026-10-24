import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createState, selectDestination } from '../model.mjs';
import { applyTravelAction } from '../commands.mjs';
const data=JSON.parse(readFileSync(new URL('../data/review_data.json',import.meta.url)));
const prepared=()=>{const s=createState(data);selectDestination(s,'human',data);return s;};

test('one primary input reaches a stop; the second click cannot immediately resume it',()=>{
  const s=prepared();
  assert.equal(applyTravelAction(s,'depart',data,{clickCount:1}).ok,true);
  assert.equal(applyTravelAction(s,'advance',data,{clickCount:1}).ok,true);
  assert.equal(s.phase,'stopped');
  assert.equal(applyTravelAction(s,'resume',data,{clickCount:2}).ok,false);
  assert.equal(s.phase,'stopped');
  assert.equal(s.days,1);
});
test('double click after resume cannot consume an extra travel day',()=>{
  const s=prepared();applyTravelAction(s,'depart',data);applyTravelAction(s,'advance',data);
  assert.equal(applyTravelAction(s,'resume',data,{clickCount:1}).ok,true);
  assert.equal(applyTravelAction(s,'advance',data,{clickCount:2}).ok,false);
  assert.equal(s.days,1);
  assert.equal(s.journey.elapsed,1);
});
test('unknown input action preserves the whole travel state',()=>{
  const s=prepared(),before=structuredClone(s);
  assert.equal(applyTravelAction(s,'sell',data).ok,false);
  assert.deepEqual(s,before);
});
