import test from 'node:test';
import assert from 'node:assert/strict';
import { teacherSessionIsCurrent, teacherReturnPath, teacherSignInPath } from './teacherSession.mjs';
const now = Date.UTC(2026, 10, 8);
const token = payload => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

test('an unexpired super-admin teacher session passes the client expiry check', () => {
  assert.equal(teacherSessionIsCurrent(token({ id: 'teacher-1', role: ['teacher', 'super_admin'], exp: now / 1000 + 3600 }), now), true);
});
test('teacher sessions without expiry remain valid in the future', () => {
  const permanent = token({ id: 'teacher-1', role: ['teacher', 'super_admin'] });
  assert.equal(teacherSessionIsCurrent(permanent, now + 20 * 365 * 86400000), true);
});
test('expired, missing and malformed tokens require login', () => {
  for (const value of [null, '', 'null', 'broken.token.value', token({ id: '1', exp: now / 1000 - 1 }), token({ id: '1' })]) assert.equal(teacherSessionIsCurrent(value, now), false);
});
test('student tokens cannot masquerade as a teacher session', () => {
  assert.equal(teacherSessionIsCurrent(token({ id: '1', role: 'student', exp: now / 1000 + 3600 }), now), false);
  assert.equal(teacherSessionIsCurrent(token({ id: '1', role: 'student' }), now), false);
  assert.equal(teacherSessionIsCurrent(token({ id: '1', role: ['student'] }), now), false);
});
test('sign-in preserves complaints as the return destination', () => {
  const target = new URL(teacherSignInPath('/complaints'), 'https://college.example');
  assert.equal(target.pathname, '/login');
  assert.equal(target.searchParams.get('next'), '/complaints');
});
test('return destinations cannot send users off-site or into a login loop', () => {
  for (const value of [null, 'https://other.example', '//other.example', '/\\other.example', '/\n/other.example', '/login', '/login?next=/login', '/login#test']) assert.equal(teacherReturnPath(value), '/');
  assert.equal(teacherReturnPath('/edit-attendance/1?date=2026-11-04'), '/edit-attendance/1?date=2026-11-04');
});
