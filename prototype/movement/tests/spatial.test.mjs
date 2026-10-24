import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPosition, positionKey, readPosition, rememberPosition, routePoint } from '../spatial.mjs';

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
