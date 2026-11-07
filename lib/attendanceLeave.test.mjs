import test from 'node:test';
import assert from 'node:assert/strict';
import { activeLeaveForAttendance } from './attendanceLeave.mjs';

const record = {
  studentId: 'student-1', academicYearId: 'year-1',
  attendanceDate: '2026-11-07T08:30:00+05:30',
  attendanceTime: 'Period', period: 2, onLeave: false,
};
const leave = {
  _id: 'leave-1', studentId: 'student-1', academicYearId: 'year-1',
  status: 'active', reason: 'Medical (Room)',
  fromDate: '2026-11-07', fromTime: '08:00', toDate: null,
};

test('open-ended medical leave is detected despite a false browser flag', () => {
  assert.equal(activeLeaveForAttendance(record, [leave]), leave);
});
test('leave starting after a session does not apply to that session', () => {
  assert.equal(activeLeaveForAttendance(record, [{ ...leave, fromTime: '08:50' }]), null);
});
test('afternoon uses the session time rather than submission time', () => {
  const afternoon = { ...record, attendanceTime: 'Afternoon', attendanceDate: '2026-11-07T20:00:00+05:30' };
  assert.equal(activeLeaveForAttendance(afternoon, [{ ...leave, fromTime: '15:00' }]), null);
});
test('future, returned and scheduled leaves do not mark attendance on leave', () => {
  for (const change of [{ fromDate: '2026-11-08' }, { status: 'returned' }, { status: 'Scheduled' }]) {
    assert.equal(activeLeaveForAttendance(record, [{ ...leave, ...change }]), null);
  }
});
test('a different student or academic year does not match', () => {
  for (const change of [{ studentId: 'student-2' }, { academicYearId: 'year-2' }]) {
    assert.equal(activeLeaveForAttendance(record, [{ ...leave, ...change }]), null);
  }
});
test('late medical leave remains on leave until returned', () => {
  const late = { ...leave, fromDate: '2026-11-06', toDate: '2026-11-06', status: 'late' };
  assert.equal(activeLeaveForAttendance(record, [late]), late);
});
test('early morning uses the college date rather than UTC date', () => {
  const morning = { ...record, attendanceTime: 'Jamath', attendanceDate: '2026-11-07T05:00:00+05:30' };
  const earlyLeave = { ...leave, fromTime: '04:00' };
  assert.equal(activeLeaveForAttendance(morning, [earlyLeave]), earlyLeave);
});
