/**
 * Utility functions for leave return permissions and Friday return rules.
 */

/**
 * Checks whether the current college-local day is Friday
 * The exception ends at midnight starting Saturday in Asia/Kolkata.
 *
 * @param {Object} leave - The leave or short leave object
 * @returns {boolean}
 */
export const isFridayReturnWithinDeadline = (_leave, now = new Date()) => {
  const date = new Date(now);
  if (Number.isNaN(date.getTime())) return false;
  // The exception lasts for the current Friday in the college's timezone,
  // including leaves that became late on an earlier day.
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(date) === 'Friday';
};

/**
 * Checks if a teacher has role-based authority to return a late leave.
 * Authorized roles: Principal, Vice Principal, Super Admin, Class Teacher, Section Heads (HOS for class 1-7, HOD for class 8-10).
 *
 * @param {Object} teacher - Teacher profile object
 * @param {string|number} studentClassVal - The student's class
 * @returns {boolean}
 */
export const isTeacherAuthorizedForLateReturn = (teacher, studentClassVal) => {
  if (!teacher) return false;
  const teacherRoles = (Array.isArray(teacher.role) ? teacher.role : (teacher.role ? [teacher.role] : [])).map(r => String(r).toLowerCase());

  // Principal, Vice Principal, Super Admin
  if (teacherRoles.some(r => ['principal', 'vice_principal', 'vice-principal', 'viceprincipal', 'super_admin', 'superadmin'].includes(r))) {
    return true;
  }

  // Class teacher
  const teacherClass = teacher.classNum || teacher.class;
  if (teacherClass && studentClassVal && String(teacherClass).trim() === String(studentClassVal).trim()) {
    return true;
  }

  // Section heads: HOS (Class 1-7), HOD (Class 8-10)
  const classNumStr = String(studentClassVal || '').toLowerCase();
  const classNumberMatch = classNumStr.match(/\d+/);
  if (classNumberMatch) {
    const classLevel = parseInt(classNumberMatch[0], 10);
    if (classLevel >= 1 && classLevel <= 7 && teacherRoles.includes('hos')) {
      return true;
    }
    if (classLevel >= 8 && classLevel <= 10 && teacherRoles.includes('hod')) {
      return true;
    }
  }

  return false;
};

/**
 * Determines whether a teacher is permitted to return a student's leave.
 * Rules:
 * 1. If leave is NOT late, ALL teachers can return.
 * 2. If student returns from leave on Friday, ALL teachers can return until that Friday night 12:00.
 * 3. Otherwise (regular late leave), only authorized teachers (class teacher, HOS, HOD, admins) can return.
 *
 * @param {Object} params
 * @param {Object} params.teacher - Current teacher object
 * @param {Object} params.leave - Leave record
 * @param {Object} [params.student] - Student record
 * @param {boolean} [params.isLate] - Whether the leave is currently late
 * @param {string|number} [params.studentClass] - Student's class identifier
 * @returns {boolean}
 */
export const canTeacherReturnLeave = ({ teacher, leave, student, isLate = false, studentClass = null, now = new Date() }) => {
  if (!teacher) return false;

  // 1. If not late, all teachers can return
  if (!isLate) {
    return true;
  }

  // 2. If student returns on Friday and deadline (Friday night 12) has not passed, all teachers can return
  if (isFridayReturnWithinDeadline(leave, now)) {
    return true;
  }

  // 3. Otherwise, check role-based authorization for late returns
  const studentClassVal = studentClass || student?.CLASS || student?.class || leave?.studentId?.CLASS || leave?.classNum || leave?.class;
  return isTeacherAuthorizedForLateReturn(teacher, studentClassVal);
};
