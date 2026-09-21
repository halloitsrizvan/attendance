import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";
import { protectMutation } from "@/utils/mutationGuard";

const PERIOD_TIMES = {
  1: { from: '07:30', to: '08:10' },
  2: { from: '08:10', to: '08:50' },
  3: { from: '08:50', to: '10:00' },
  4: { from: '10:00', to: '10:40' },
  5: { from: '10:40', to: '11:20' },
  6: { from: '11:30', to: '12:10' },
  7: { from: '12:10', to: '12:50' },
  8: { from: '14:00', to: '14:40' },
  9: { from: '14:40', to: '15:20' },
  10: { from: '15:20', to: '16:10' }
};

function getAttendanceTimeRange(att) {
  if (!att.attendanceDate) return null;
  const d = new Date(att.attendanceDate);
  const pad = (n) => String(n).padStart(2, '0');
  let dateStr;
  try {
    dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
  } catch (e) {
    dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  const timeType = (att.attendanceTime || '').trim();
  const period = att.period;
  const more = (att.more || att.custom || '').toLowerCase();

  let fromStr = '07:30';
  let toStr = '16:10';

  if (timeType === 'Morning') {
    fromStr = '07:30';
    toStr = '08:10';
  } else if (timeType === 'Afternoon') {
    fromStr = '14:00';
    toStr = '14:40';
  } else if (timeType === 'Night') {
    fromStr = '19:00';
    toStr = '20:30';
  } else if (timeType === 'Period') {
    if (period && PERIOD_TIMES[period]) {
      fromStr = PERIOD_TIMES[period].from;
      toStr = PERIOD_TIMES[period].to;
    } else {
      fromStr = '07:30';
      toStr = '16:10';
    }
  } else if (timeType === 'Jamath') {
    if (more.includes('fajr')) {
      fromStr = '05:00';
      toStr = '06:00';
    } else if (more.includes('zuhr')) {
      fromStr = '12:50';
      toStr = '14:00';
    } else if (more.includes('asr')) {
      fromStr = '16:10';
      toStr = '17:30';
    } else if (more.includes('magrib') || more.includes('maghrib')) {
      fromStr = '18:15';
      toStr = '19:00';
    } else if (more.includes('isha')) {
      fromStr = '20:30';
      toStr = '21:30';
    } else {
      fromStr = '12:50';
      toStr = '14:00';
    }
  } else if (timeType === 'Quiraath') {
    fromStr = '06:00';
    toStr = '07:00';
  }

  const start = new Date(`${dateStr}T${fromStr}:00`);
  const end = new Date(`${dateStr}T${toStr}:00`);

  return { start, end, dateStr, fromStr, toStr, timeType, period };
}

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const classNumber = searchParams.get('classNumber');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const fromTime = searchParams.get('fromTime');
    const toTime = searchParams.get('toTime');
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

    // Optional time range filtering
    let resultRecords = records;
    if (fromTime || toTime) {
      const filterFromDate = fromDate || toDate || new Date().toISOString().split('T')[0];
      const filterToDate = toDate || fromDate || new Date().toISOString().split('T')[0];
      const filterStart = new Date(`${filterFromDate}T${fromTime || '00:00'}:00`);
      const filterEnd = new Date(`${filterToDate}T${toTime || '23:59'}:59`);

      resultRecords = records.filter(rec => {
        const range = getAttendanceTimeRange(rec);
        if (!range) return true;
        return range.end > filterStart && range.start < filterEnd;
      });
    }

    return NextResponse.json(resultRecords);
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
