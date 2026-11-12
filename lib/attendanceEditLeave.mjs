import { attendanceDateKey } from './attendanceSession.mjs';

const idOf = value => String(value?._id || value || '');

export function editAttendanceLeaveInfo(record, leaves, passes, now = new Date()) {
  if (!record.onLeave || String(record.status).toLowerCase() === 'present') return null;

  const studentId = idOf(record.studentId);
  const leave = leaves.find(item =>
    (record.leaveId ? idOf(item) === idOf(record.leaveId) : idOf(item.studentId) === studentId) &&
    ['active', 'late', 'pending', 'on leave'].includes(String(item.status).toLowerCase())
  );
  const pass = record.studentId?.onLeave && passes.find(item =>
    (record.shortLeaveId ? idOf(item) === idOf(record.shortLeaveId) : idOf(item.studentId) === studentId) &&
    attendanceDateKey(item.date) === attendanceDateKey(now) &&
    String(item.status || '').toLowerCase() !== 'returned'
  );
  const active = leave || pass;
  if (!active) return null;

  const endDate = leave?.toDate || (pass?.date && attendanceDateKey(pass.date));
  const endTime = active.toTime;
  const end = endDate && endTime ? new Date(`${endDate}T${endTime}:00+05:30`) : null;
  const late = String(active.status).toLowerCase() === 'late' || (end && !Number.isNaN(end.getTime()) && now > end);
  const type = late ? 'Late' : leave ? /medical|hospital|room/i.test(leave.reason || '') ? 'Medical' : 'On Leave' : 'CEP';
  return { type, leave: leave || null, pass: pass || null };
}

export function editAttendanceLeave(record, leaves, passes, now = new Date()) {
  return editAttendanceLeaveInfo(record, leaves, passes, now)?.type || null;
}

export function formatEditAbsentees({ classNumber, date, time, records, statuses, leaveTypes }) {
  const heading = `Class ${classNumber} Absentiees\n${date ? new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }) : ''} | ${time}\n\n`;
  const groups = [
    ['Absent', record => !leaveTypes[record._id]],
    ['Class excused pass', record => leaveTypes[record._id] === 'CEP'],
    ['Medical Leave', record => leaveTypes[record._id] === 'Medical'],
    ['On Leave', record => leaveTypes[record._id] === 'On Leave'],
    ['Late', record => leaveTypes[record._id] === 'Late'],
  ];
  const absent = records.filter(record => statuses[record._id] !== 'Present');
  if (!absent.length) return heading + 'All students are present 🎉';
  return heading + groups.map(([label, matches]) => {
    const students = absent.filter(matches);
    if (!students.length) return '';
    return `${label}:\n${students.map(record => {
      const student = record.studentId || {};
      const name = student['SHORT NAME'] || student['FULL NAME'] || record.nameOfStd || record.name || 'Unknown student';
      return `${name} (AdNo: ${student.ADNO || record.ad})`;
    }).join('\n')}`;
  }).filter(Boolean).join('\n\n');
}
