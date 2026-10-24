import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPosition, positionKey, readPosition, rememberPosition, routePoint, minimapPoint } from '../spatial.mjs';

test('map/field re-entry retains the same position without mixing cities and stops', () => {
  const positions = {};
  const key = positionKey('field', { cityId: 'sydria' });
  rememberPosition(positions, key, { x: 1020, y: 810 });
  assert.deepEqual(readPosition(positions, key), { x: 1020, y: 810 });
  assert.deepEqual(readPosition(positions, positionKey('field', { cityId: 'human' })), { x: 960, y: 735 });
  assert.deepEqual(readPosition(positions, positionKey('stop-field', {})), defaultPosition());
  const copy=readPosition(positions,key); copy.x=0;
  assert.equal(readPosition(positions,key).x,1020);
});

test('journey map marker follows the route and reaches the destination exactly',()=>{
  const points=[[0,0],[1,0],[1,1]];
  assert.deepEqual(routePoint(points,.25),[.5,0]);
  assert.deepEqual(routePoint(points,.75),[1,.5]);
  assert.deepEqual(routePoint(points,0),[0,0]);
  assert.deepEqual(routePoint(points,1),[1,1]);
  assert.deepEqual(routePoint([...points].reverse(),.25),[1,.5]);
});

test('circular minimap retains the whole player marker at every field boundary', () => {
  // The circular crop of the 240x167 viewBox has centre(120,83.5), radius83.5.
  // The marker including its halo needs 13 viewBox units of clearance.
  const safeRadius = 83.5 - 13;
  for (const x of [670, 960, 1270]) for (const y of [650, 735, 795, 940]) {
    const [mx, my] = minimapPoint({ x, y });
    assert.ok(Math.hypot(mx - 120, my - 83.5) <= safeRadius, `Clipped marker at field (${x},${y})`);
  }
  const [left] = minimapPoint({ x: 670, y: 795 });
  const [right] = minimapPoint({ x: 1270, y: 795 });
  const [, top] = minimapPoint({ x: 960, y: 650 });
  const [, bottom] = minimapPoint({ x: 960, y: 940 });
  assert.ok(left < 120 && right > 120 && top < 83.5 && bottom > 83.5);
});
