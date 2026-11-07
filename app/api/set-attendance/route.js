import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import Leave from "@/models/leaveModel";
import { activeLeaveForAttendance } from "@/lib/attendanceLeave.mjs";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ad = searchParams.get('ad');
  const classNumber = searchParams.get('classNumber');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const period = searchParams.get('period');

    const custom = searchParams.get('custom');

  try {
    let query = {};
    if (ad) {
      const student = await Student.findOne({ ADNO: Number(ad) });
      if (student) {
        query.studentId = student._id;
      } else {
        return NextResponse.json([]);
      }
    }
    if (classNumber) query.classNumber = Number(classNumber);
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0,0,0,0);
      const endDate = new Date(date);
      endDate.setHours(23,59,59,999);
      query.attendanceDate = { $gte: startDate, $lte: endDate };
    }
    if (time) query.attendanceTime = time;
    if (period) query.period = Number(period);
    if (custom) {
      const regex = new RegExp(`^${custom.trim()}$`, 'i');
      query.$or = [{ custom: regex }, { more: regex }];
    }

    const activeYearId = await getActiveAcademicYearId();
    if (activeYearId && searchParams.get('all') !== 'true') {
      query.academicYearId = activeYearId;
    }

    const all = searchParams.get('all') === 'true';
    let mongoQuery = Attendance.find(query)
      .populate('studentId')
      .populate('teacherId')
      .sort({ attendanceDate: -1, createdAt: -1 });

    if (!all && !date && !classNumber) {
      mongoQuery = mongoQuery.limit(500);
    }

    const attendance = await mongoQuery;
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(req) {

  await dbConnect();
  try {
    let body = await req.json();
    const activeYearId = await getActiveAcademicYearId();

    if (Array.isArray(body)) {
      body = body.map(item => ({
        ...item,
        academicYearId: item.academicYearId || activeYearId
      }));
    } else if (body && typeof body === 'object') {
      if (!body.academicYearId && activeYearId) {
        body.academicYearId = activeYearId;
      }
    }

    // Never rely solely on a potentially stale browser leave flag.
    const records = Array.isArray(body) ? body : [body];
    const studentIds = records.map(record => record.studentId).filter(Boolean);
    const leaves = await Leave.find({
      studentId: { $in: studentIds },
      status: { $in: ['active', 'late', 'pending', 'on leave'] },
    }).select('studentId academicYearId status fromDate fromTime').sort({ createdAt: -1 }).lean();
    const verifiedRecords = records.map(record => {
      const leave = activeLeaveForAttendance(record, leaves);
      return leave ? { ...record, onLeave: true, status: 'Absent', leaveId: leave._id } : record;
    });
    const attendance = await Attendance.create(Array.isArray(body) ? verifiedRecords : verifiedRecords[0]);
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req) {

  await dbConnect();
  try {
    const { updates } = await req.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates should be an array" }, { status: 400 });
    }
    
    const bulkOps = updates.map((student) => ({
      updateOne: {
        filter: { _id: student._id },
        update: { $set: { status: student.status } },
      },
    }));
    
    await Attendance.bulkWrite(bulkOps);
    
    return NextResponse.json({ message: "Attendance updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
