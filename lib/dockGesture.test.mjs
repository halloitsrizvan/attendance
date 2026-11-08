import test from 'node:test';
import assert from 'node:assert/strict';
import { dockPosition } from './dockGesture.mjs';
const rect = { left: 20, right: 420, top: 700, bottom: 756, width: 400 };
test('dragging selects each of the four tabs', () => {
  for (let i = 0; i < 4; i++) {
    const hit = dockPosition(24 + 98 * (i + .5), 728, rect, 4);
    assert.equal(hit.index, i);
    assert.equal(hit.position, i);
  }
});
test('thumb follows the finger between tabs', () => {
  assert.deepEqual(dockPosition(122, 728, rect, 4), { index: 1, position: .5 });
});
test('releasing outside cancels instead of opening an edge tab', () => {
  for (const [x, y] of [[19, 728], [421, 728], [200, 699], [200, 757]]) assert.equal(dockPosition(x, y, rect, 4), null);
});
test('rounded-edge padding stays within the first and last tabs', () => {
  assert.deepEqual(dockPosition(20, 728, rect, 4), { index: 0, position: 0 });
  assert.deepEqual(dockPosition(420, 728, rect, 4), { index: 3, position: 3 });
});
