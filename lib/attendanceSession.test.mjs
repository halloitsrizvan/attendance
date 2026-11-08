import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceDateKey, attendanceDayBounds, attendanceEditFields, editableAttendanceStatus, selectAttendanceSession } from './attendanceSession.mjs';
import { activeLeaveForAttendance } from './attendanceLeave.mjs';

const row = (student, date, time = 'Morning', extra = {}) => ({ _id: `${student}-${date}-${time}`, studentId: { _id: student, ADNO: student }, attendanceDate: `${date}T07:30:00+05:30`, attendanceTime: time, status: 'Present', ...extra });

test('the session selected three days ago is loaded rather than the latest per-student records', () => {
  const earlier = row('1', '2026-11-04');
  const current = row('1', '2026-11-07', 'Morning', { studentId: { _id: '1', ADNO: '1', onLeave: true }, onLeave: true });
  assert.deepEqual(selectAttendanceSession([current, earlier], { date: '2026-11-04', time: 'Morning' }), [earlier]);
  assert.equal(editableAttendanceStatus(earlier), 'Present');
});
test('current student leave flags never override a saved historical present', () => {
  const record = row('1', '2026-11-04', 'Morning', { studentId: { _id: '1', onLeave: true, Status: 'On Leave' } });
  assert.equal(editableAttendanceStatus(record), 'Present');
});

test('a medical leave starting today does not apply to attendance three days earlier', () => {
  const historical = { studentId: '1', attendanceDate: '2026-11-04T08:30:00+05:30', attendanceTime: 'Period', period: 2 };
  const currentLeave = { studentId: '1', status: 'active', fromDate: '2026-11-07', fromTime: '07:00', reason: 'Medical (Room)' };
  assert.equal(activeLeaveForAttendance(historical, [currentLeave]), null);
});
test('leave, late, medical and CEP entries appear as absent', () => {
  for (const extra of [{ status: 'On Leave' }, { status: 'Late' }, { status: 'Medical' }, { status: 'CEP' }, { onLeave: true }, { isLate: true }]) {
    assert.equal(editableAttendanceStatus(row('1', '2026-11-04', 'Morning', extra)), 'Absent');
  }
});
test('periods and prayers remain separate', () => {
  const second = row('1', '2026-11-04', 'Period', { period: 2 });
  const third = row('1', '2026-11-04', 'Period', { period: 3 });
  assert.deepEqual(selectAttendanceSession([third, second], { date: '2026-11-04', time: 'Period', period: '2' }), [second]);
  const fajr = row('1', '2026-11-04', 'Jamath', { custom: 'Fajr' });
  const zuhr = row('1', '2026-11-04', 'Jamath', { custom: 'Zuhr' });
  assert.deepEqual(selectAttendanceSession([zuhr, fajr], { time: 'Jamath', custom: 'fajr' }), [fajr]);
});
test('legacy links choose one coherent latest session and never fall back for missing requested dates', () => {
  const latest = row('1', '2026-11-07');
  const old = row('2', '2026-11-04');
  assert.deepEqual(selectAttendanceSession([latest, old]), [latest]);
  assert.deepEqual(selectAttendanceSession([latest, old], { date: '2026-11-05' }), []);
});
test('IST day boundaries correctly include early morning and late night', () => {
  const { start, end } = attendanceDayBounds('2026-11-04');
  assert.equal(start.toISOString(), '2026-11-03T18:30:00.000Z');
  assert.equal(end.toISOString(), '2026-11-04T18:30:00.000Z');
  assert.equal(attendanceDateKey('2026-11-03T23:30:00Z'), '2026-11-04');
  assert.throws(() => attendanceDayBounds('2026-02-30'));
});
test('absent corrections preserve stored leave evidence; present corrections only clear record flags', () => {
  assert.deepEqual(attendanceEditFields('Absent'), { status: 'Absent' });
  assert.deepEqual(attendanceEditFields('Present'), { status: 'Present', onLeave: false, isLate: false, leaveId: null, shortLeaveId: null });
  assert.throws(() => attendanceEditFields('Medical'));
});
