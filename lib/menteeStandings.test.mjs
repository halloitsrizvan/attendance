import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMenteeStandings } from './menteeStandings.mjs';
const student = id => ({ _id: id, ADNO: Number(id) });
test('a deleted student relation does not crash or hide available mentees', () => {
  const result = buildMenteeStandings([{ menteeId: null }, { menteeId: student('1') }], [{ student: student('1'), totalPoints: 25 }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].totalPoints, 25);
});
test('assigned mentees without approved points are included with zero and no rank', () => {
  assert.deepEqual(buildMenteeStandings([{ menteeId: student('1') }], []), [{ student: student('1'), totalPoints: 0, achievementCount: 0, globalRank: null }]);
});
test('global ranks deduplicate repeated leaderboard rows and assignments', () => {
  const result = buildMenteeStandings([{ menteeId: student('2') }, { menteeId: student('2') }], [{ student: student('1'), totalPoints: 50 }, { student: student('1'), totalPoints: 50 }, { student: student('2'), totalPoints: 10 }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].globalRank, 2);
});
test('unassigned students never enter the mentee summary', () => {
  assert.deepEqual(buildMenteeStandings([], [{ student: student('1'), totalPoints: 50 }]), []);
});
