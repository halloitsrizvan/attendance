import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/complaintModel';
import Attendance from '@/models/attendanceModel';
import Student from '@/models/studentsModel';
import Teacher from '@/models/teachersModel';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getActiveAcademicYearId } from '@/lib/getActiveAcademicYear';
import { complaintError, complaintScope, complaintViewer } from '@/utils/complaintAuth';
import { complaintMatchesClass } from '@/lib/complaintRouting.mjs';
import { attendanceEditFields } from '@/lib/attendanceSession.mjs';

const failure = (error, fallback = 500) => NextResponse.json({ error: error.message }, { status: error.status || fallback });
const populate = query => query.populate('studentId', { ADNO: 1, CLASS: 1, SL: 1, 'FULL NAME': 1, 'SHORT NAME': 1 }).populate('attendanceId').populate('teacherId', 'name classNum role');

export async function GET(req) {
  try {
    await dbConnect();
    const viewer = await complaintViewer(req);
    const { searchParams } = new URL(req.url);
    const scope = await complaintScope(viewer);
    const filters = {};
    const studentId = searchParams.get('studentId');
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) throw complaintError('Invalid student ID', 400);
      filters.studentId = studentId;
    }
    const year = await getActiveAcademicYearId();
    if (year && searchParams.get('all') !== 'true') filters.academicYearId = year;
    // Scope is always enforced independently of caller-supplied filters.
    const complaints = await populate(Complaint.find({ $and: [scope, filters] })).sort({ createdAt: -1 }).lean();
    return NextResponse.json(complaints);
  } catch (error) { return failure(error); }
}

export async function POST(req) {
  try {
    await dbConnect();
    const viewer = await complaintViewer(req);
    const body = await req.json();
    if (viewer.isStudent && body.attendanceId && (typeof body.message !== 'string' || !body.message.replace(/^\s*\[Medical Leave\]\s*/i, '').trim())) {
      throw complaintError('Please provide a description for your attendance complaint.', 400);
    }
    const studentId = viewer.isStudent ? viewer.account._id : body.studentId;
    if (!mongoose.Types.ObjectId.isValid(studentId)) throw complaintError('Invalid student ID', 400);
    const student = await Student.findById(studentId).select('CLASS');
    if (!student) throw complaintError('Student not found', 404);
    if (!viewer.isStudent && !viewer.isAdmin && !complaintMatchesClass({ studentId: student }, viewer.account)) throw complaintError('This student is outside your assigned class', 403);
    if (body.attendanceId) {
      const attendance = await Attendance.findById(body.attendanceId).select('studentId');
      if (!attendance || String(attendance.studentId) !== String(student._id)) throw complaintError('Attendance record does not belong to this student', 400);
    }
    const classTeacher = await Teacher.findOne({ classNum: student.CLASS, active: { $ne: false } }).sort({ _id: 1 }).select('_id');
    const year = await getActiveAcademicYearId();
    const complaint = await Complaint.create({
      studentId: student._id, attendanceId: body.attendanceId || undefined,
      teacherId: classTeacher?._id || null,
      actualStatus: body.actualStatus, isMedical: Boolean(body.isMedical),
      message: body.message, status: 'Pending', academicYearId: year || undefined,
    });
    // If a class teacher has not been assigned, super admins still receive it.
    return NextResponse.json(complaint, { status: 201 });
  } catch (error) { return failure(error, 400); }
}

export async function PATCH(req) {
  try {
    await dbConnect();
    const viewer = await complaintViewer(req);
    if (viewer.isStudent) throw complaintError('Only class teachers and super admins can review complaints', 403);
    const { id, status, adminRemark } = await req.json();
    if (!mongoose.Types.ObjectId.isValid(id)) throw complaintError('Invalid complaint ID', 400);
    if (!['Pending', 'Resolved', 'Rejected'].includes(status)) throw complaintError('Invalid complaint status', 400);
    const scope = await complaintScope(viewer);
    const complaint = await Complaint.findOne({ $and: [{ _id: id }, scope] });
    if (!complaint) throw complaintError('Complaint not found in your assigned class', 404);
    if (status === 'Resolved' && complaint.attendanceId) {
      const fields = complaint.actualStatus === 'Present' ? attendanceEditFields('Present')
        : ['Leave', 'CEP'].includes(complaint.actualStatus) ? { status: 'Absent', onLeave: true } : null;
      if (fields) await Attendance.findByIdAndUpdate(complaint.attendanceId, { $set: fields });
    }
    const updated = await populate(Complaint.findByIdAndUpdate(id, { $set: { status, adminRemark } }, { new: true, runValidators: true }));
    return NextResponse.json(updated);
  } catch (error) { return failure(error, 400); }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const viewer = await complaintViewer(req);
    if (!viewer.isAdmin) throw complaintError('Only super admins can delete complaints', 403);
    const id = new URL(req.url).searchParams.get('id');
    if (!mongoose.Types.ObjectId.isValid(id)) throw complaintError('Invalid complaint ID', 400);
    await Complaint.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) { return failure(error); }
}
