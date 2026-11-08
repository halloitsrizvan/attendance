export function isComplaintAdmin(teacher) {
  const roles = Array.isArray(teacher?.role) ? teacher.role : [teacher?.role];
  return roles.includes('super_admin');
}

export function complaintMatchesClass(complaint, teacher) {
  const classNum = Number(teacher?.classNum);
  const studentClass = Number(complaint?.studentId?.CLASS);
  return Number.isFinite(classNum) && classNum > 0 && classNum === studentClass;
}
