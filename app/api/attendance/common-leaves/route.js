import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";
import { protectMutation } from "@/utils/mutationGuard";

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const classNumber = searchParams.get('classNumber');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const studentIds = searchParams.get('studentIds');

    if (!classNumber) {
      return NextResponse.json({ error: "classNumber is required" }, { status: 400 });
    }

    let query = {
      classNumber: Number(classNumber),
      $or: [
        { status: { $regex: /^absent$/i } },
        { status: 'false' },
        { status: false }
      ]
    };

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.attendanceDate = { $gte: start, $lte: end };
    } else if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(fromDate);
      end.setHours(23, 59, 59, 999);
      query.attendanceDate = { $gte: start, $lte: end };
    }

    if (studentIds) {
      const ids = studentIds.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        query.studentId = { $in: ids };
      }
    }

    const activeYearId = await getActiveAcademicYearId();
    if (activeYearId && searchParams.get('all') !== 'true') {
      query.academicYearId = activeYearId;
    }

    const records = await Attendance.find(query)
      .populate('studentId')
      .populate('teacherId', 'name username')
      .sort({ attendanceDate: 1, attendanceTime: 1, period: 1 });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error in GET /api/attendance/common-leaves:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const mutationBlocked = protectMutation(req);
  if (mutationBlocked) return mutationBlocked;

  await dbConnect();
  try {
    const body = await req.json();
    const { attendanceIds, target, customStatus, customOnLeave } = body;

    if (!Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return NextResponse.json({ error: "attendanceIds array is required" }, { status: 400 });
    }

    let updateFields = {};
    if (target === 'present') {
      updateFields = { status: 'Present', onLeave: false };
    } else if (target === 'onleave') {
      updateFields = { status: 'Absent', onLeave: true };
    } else if (target === 'absent_unexcused') {
      updateFields = { status: 'Absent', onLeave: false };
    } else {
      if (customStatus !== undefined) updateFields.status = customStatus;
      if (customOnLeave !== undefined) updateFields.onLeave = Boolean(customOnLeave);
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid update fields specified" }, { status: 400 });
    }

    const result = await Attendance.updateMany(
      { _id: { $in: attendanceIds } },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      appliedUpdate: updateFields
    });
  } catch (error) {
    console.error("Error in POST /api/attendance/common-leaves:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
