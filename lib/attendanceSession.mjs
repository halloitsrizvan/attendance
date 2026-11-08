export function attendanceDateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 10);
}

export function attendanceDayBounds(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) throw new Error('Invalid attendance date');
  const start = new Date(`${day}T00:00:00+05:30`);
  if (!Number.isFinite(start.getTime()) || attendanceDateKey(start) !== day) throw new Error('Invalid attendance date');
  return { start, end: new Date(start.getTime() + 86400000) };
}

function sessionKey(record) {
  return JSON.stringify([
    attendanceDateKey(record.attendanceDate), record.attendanceTime,
    record.attendanceTime === 'Period' ? String(record.period ?? '') : '',
    ['Jamath', 'More'].includes(record.attendanceTime) ? (record.custom || record.more || '').trim().toLowerCase() : '',
  ]);
}

// Records arrive newest first. Never mix different attendance sessions.
export function selectAttendanceSession(records, requested = {}) {
  const matches = records.filter(record =>
    (!requested.date || attendanceDateKey(record.attendanceDate) === requested.date) &&
    (!requested.time || record.attendanceTime === requested.time) &&
    (!requested.period || String(record.period) === String(requested.period)) &&
    (!requested.custom || (record.custom || record.more || '').trim().toLowerCase() === requested.custom.trim().toLowerCase())
  );
  if (!matches.length) return [];
  const key = sessionKey(matches[0]);
  const byStudent = new Map();
  for (const record of matches) {
    if (sessionKey(record) !== key) continue;
    const studentId = String(record.studentId?._id || record.studentId || record.ad || record._id);
    if (!byStudent.has(studentId)) byStudent.set(studentId, record);
  }
  return [...byStudent.values()].sort((a, b) => (a.studentId?.SL || a.SL || 0) - (b.studentId?.SL || b.SL || 0));
}

export function editableAttendanceStatus(record) {
  return !record.onLeave && !record.isLate && String(record.status).trim().toLowerCase() === 'present' ? 'Present' : 'Absent';
}

export function attendanceEditFields(status) {
  if (!['Present', 'Absent'].includes(status)) throw new Error('Attendance status must be Present or Absent');
  // Leave evidence is preserved for absences. A present correction only clears
  // flags on this attendance record; it never returns a student's current leave.
  return status === 'Present'
    ? { status, onLeave: false, isLate: false, leaveId: null, shortLeaveId: null }
    : { status };
}
