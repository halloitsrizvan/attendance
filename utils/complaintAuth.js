import jwt from 'jsonwebtoken';
import { secretKey } from '@/config/jwtConfig';
import Student from '@/models/studentsModel';
import Teacher from '@/models/teachersModel';
import { isComplaintAdmin } from '@/lib/complaintRouting.mjs';

export function complaintError(message, status) {
  return Object.assign(new Error(message), { status });
}

export async function complaintViewer(req) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  let decoded;
  try { decoded = jwt.verify(token, secretKey); }
  catch (error) {
    throw complaintError(error.name === 'TokenExpiredError' ? 'Your session has expired. Please sign in again.' : 'Your session is missing or invalid. Please sign in again.', 401);
  }
  const isStudent = decoded.role === 'student';
  const account = await (isStudent ? Student : Teacher).findById(decoded.id).select(isStudent ? 'CLASS active' : 'role classNum active');
  if (!account || account.active === false) throw complaintError('Account unavailable', 401);
  return { account, isStudent, isAdmin: !isStudent && isComplaintAdmin(account) };
}

export async function complaintScope(viewer) {
  if (viewer.isStudent) return { studentId: viewer.account._id };
  if (viewer.isAdmin) return {};
  const classNum = Number(viewer.account.classNum);
  if (!Number.isFinite(classNum) || classNum <= 0) return { studentId: { $in: [] } };
  const students = await Student.find({ CLASS: classNum }).select('_id').lean();
  return { studentId: { $in: students.map(student => student._id) } };
}
