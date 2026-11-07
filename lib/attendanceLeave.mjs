const periods = {
  1: [450, 490], 2: [490, 530], 3: [530, 600], 4: [600, 640],
  5: [640, 680], 6: [690, 730], 7: [730, 770], 8: [840, 880],
  9: [880, 920], 10: [920, 970],
};

function indiaDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // College dates and session times use IST, independently of the server timezone.
  const local = new Date(date.getTime() + 330 * 60000);
  return { day: local.toISOString().slice(0, 10), minute: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

export function activeLeaveForAttendance(record, leaves) {
  const instant = indiaDateTime(record.attendanceDate);
  if (!instant) return null;
  const range = record.attendanceTime === 'Period' ? periods[record.period]
    : record.attendanceTime === 'Morning' ? periods[1]
    : ['Afternoon', 'Noon'].includes(record.attendanceTime) ? periods[8]
    : record.attendanceTime === 'Night' ? [1140, 1230] : null;

  return leaves.find(leave => {
    if (String(leave.studentId) !== String(record.studentId)) return false;
    if (record.academicYearId && String(leave.academicYearId) !== String(record.academicYearId)) return false;
    if (!['active', 'late', 'pending', 'on leave'].includes(leave.status?.trim().toLowerCase())) return false;
    const startDay = leave.fromDate?.slice(0, 10);
    if (!startDay || instant.day < startDay) return false;
    if (instant.day > startDay) return true;
    const [hours, minutes] = (leave.fromTime || '').split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;
    const start = hours * 60 + minutes;
    // Active/late leave remains in effect until explicitly marked returned.
    return range ? range[1] > start : instant.minute >= start;
  }) || null;
}
