import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Leave from '@/models/leaveModel';
import Student from '@/models/studentsModel';
import { complaintViewer } from '@/utils/complaintAuth';
import { hasAssignedTeacherRole } from '@/lib/teacherPermissions.mjs';
import { getActiveAcademicYearId } from '@/lib/getActiveAcademicYear';

async function classScope(req) {
    await dbConnect();
    const viewer = await complaintViewer(req);
    if (viewer.isStudent || !hasAssignedTeacherRole(viewer.account, 'class_teacher') || !(Number(viewer.account.classNum) > 0)) {
        throw Object.assign(new Error('Only assigned class teachers can access this page.'), { status: 403 });
    }
    const students = await Student.find({ CLASS: Number(viewer.account.classNum) }).select({ 'FULL NAME': 1, 'SHORT NAME': 1, ADNO: 1, SL: 1 }).sort({ SL: 1, 'FULL NAME': 1 }).lean();
    const query = { studentId: { $in: students.map(student => student._id) } };
    const year = await getActiveAcademicYearId();
    if (year) query.academicYearId = year;
    return { query, classNumber: viewer.account.classNum, students };
}
function failure(error) {
    return NextResponse.json({ error: error.status ? error.message : 'Unable to process leave documentation.' }, { status: error.status || 500 });
}
export async function GET(req) {
    try {
        const { query, classNumber, students } = await classScope(req);
        const leaves = await Leave.find(query).select('studentId fromDate toDate reason returnedAt status documented programDocumented documentUrl programDocumentUrl isMedicalSubmitted isProgramSubmitted').populate('studentId', { 'FULL NAME': 1, 'SHORT NAME': 1, ADNO: 1, CLASS: 1 }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ classNumber, leaves, students });
    } catch (error) { return failure(error); }
}
export async function PATCH(req) {
    try {
        const { query } = await classScope(req);
        const { id, type, verified } = await req.json();
        if (!mongoose.Types.ObjectId.isValid(id) || !['medical', 'program'].includes(type) || verified !== true) {
            return NextResponse.json({ error: 'Invalid documentation update.' }, { status: 400 });
        }
        const leave = await Leave.findOne({ ...query, _id: id });
        if (!leave) return NextResponse.json({ error: 'Leave not found in your class.' }, { status: 404 });
        if (verified && !leave.returnedAt) return NextResponse.json({ error: 'The student must return before this leave can be documented.' }, { status: 400 });
        const field = type === 'medical' ? 'documented' : 'programDocumented';
        leave[field] = verified;
        await leave.save();
        return NextResponse.json({ id, [field]: verified });
    } catch (error) { return failure(error); }
}
