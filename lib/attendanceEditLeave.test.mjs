import test from 'node:test';
import assert from 'node:assert/strict';
import { editAttendanceLeave, editAttendanceLeaveInfo, formatEditAbsentees } from './attendanceEditLeave.mjs';

const now = new Date('2026-11-12T10:00:00+05:30');
const record = { _id: 'attendance-1', studentId: { _id: 'student-1', ADNO: 480, 'SHORT NAME': 'Nabeel', onLeave: true }, status: 'Absent', onLeave: true, leaveId: 'leave-1' };

test('only a leave recorded at attendance time that is still active is locked', () => {
  const active = { _id: 'leave-1', studentId: { _id: 'student-1' }, status: 'active', reason: 'Medical (Home)', toDate: '2026-11-13', toTime: '16:00' };
  assert.equal(editAttendanceLeave(record, [active], [], now), 'Medical');
  assert.equal(editAttendanceLeave(record, [{ ...active, status: 'returned' }], [], now), null);
  assert.equal(editAttendanceLeave({ ...record, onLeave: false }, [active], [], now), null);
  assert.equal(editAttendanceLeave({ ...record, leaveId: 'other-leave' }, [active], [], now), null);
  assert.equal(editAttendanceLeave({ ...record, status: 'Present' }, [active], [], now), null);
});

test('a current class excused pass is locked, while an old pass is not', () => {
  const passRecord = { ...record, leaveId: null, shortLeaveId: 'pass-1' };
  const pass = { _id: 'pass-1', studentId: { _id: 'student-1' }, date: '2026-11-12', toTime: '18:00' };
  assert.equal(editAttendanceLeave(passRecord, [], [pass], now), 'CEP');
  assert.equal(editAttendanceLeave(passRecord, [], [{ ...pass, status: 'returned' }], now), null);
  assert.equal(editAttendanceLeave(passRecord, [], [{ ...pass, date: '2026-11-11' }], now), null);
  assert.equal(editAttendanceLeave({ ...passRecord, studentId: { ...record.studentId, onLeave: false } }, [], [pass], now), null);
});

test('return details include both linked leave records when a student has both', () => {
  const linked = { ...record, shortLeaveId: 'pass-1' };
  const leave = { _id: 'leave-1', studentId: { _id: 'student-1' }, status: 'active', reason: 'Medical', toDate: '2026-11-13', toTime: '18:00' };
  const pass = { _id: 'pass-1', studentId: { _id: 'student-1' }, date: '2026-11-12', toTime: '18:00' };
  const info = editAttendanceLeaveInfo(linked, [leave], [pass], now);
  assert.equal(info.type, 'Medical');
  assert.equal(info.leave, leave);
  assert.equal(info.pass, pass);
});

test('copied absentees follow attendance page grouping and include live leave labels', () => {
  const regular = { ...record, _id: 'attendance-2', studentId: { ...record.studentId, ADNO: 481, 'SHORT NAME': 'Ali' }, onLeave: false };
  const text = formatEditAbsentees({ classNumber: 2, date: '2026-11-12', time: 'Morning', records: [record, regular], statuses: { 'attendance-1': 'Absent', 'attendance-2': 'Absent' }, leaveTypes: { 'attendance-1': 'Medical', 'attendance-2': null } });
  assert.match(text, /Absent:\nAli \(AdNo: 481\)/);
  assert.match(text, /Medical Leave:\nNabeel \(AdNo: 480\)/);
  assert.ok(text.indexOf('Absent:') < text.indexOf('Medical Leave:'));
});
