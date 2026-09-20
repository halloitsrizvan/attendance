import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import Leave from "@/models/leaveModel";
import ClassExcusedPass from "@/models/shortLeaveModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

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

function format12Hour(timeStr) {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  if (str.toLowerCase().includes('am') || str.toLowerCase().includes('pm')) return str;
  const parts = str.split(':');
  if (parts.length < 2) return str;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  if (isNaN(hours)) return str;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function getSessionLabel(att) {
  const timeType = (att.attendanceTime || '').trim();
  if (timeType === 'Period') {
    return att.period ? `Period ${att.period}` : 'Period';
  }
  if (timeType === 'Jamath') {
    const more = att.more || att.custom;
    return more ? `Jamath (${more})` : 'Jamath';
  }
  return timeType || 'Session';
}

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
    } else if (more.includes('magrib')) {
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

  return { start, end, dateStr, fromStr, toStr, timeType, period, more: att.more || att.custom };
}

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const classNumber = searchParams.get('class');
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');

    const activeYearId = await getActiveAcademicYearId();

    // Query ONLY attendances where the student was marked ABSENT and onLeave is false/falsy
    const attendanceQuery = {
      status: { $in: ['Absent', 'absent', 'A'] },
      $or: [{ onLeave: false }, { onLeave: { $exists: false } }, { onLeave: null }]
    };

    if (activeYearId && searchParams.get('all') !== 'true') {
      attendanceQuery.academicYearId = activeYearId;
    }
    if (classNumber) {
      attendanceQuery.classNumber = Number(classNumber);
    }
    if (fromDateStr && toDateStr) {
      const s = new Date(fromDateStr);
      s.setHours(0, 0, 0, 0);
      const e = new Date(toDateStr);
      e.setHours(23, 59, 59, 999);
      attendanceQuery.attendanceDate = { $gte: s, $lte: e };
    }

    // 1. Fetch relevant Attendances with status: Absent and onLeave: false
    const attendances = await Attendance.find(attendanceQuery)
      .populate('studentId')
      .populate('teacherId')
      .sort({ attendanceDate: -1, createdAt: -1 });

    if (!attendances || attendances.length === 0) {
      return NextResponse.json({ discrepancies: [], count: 0 });
    }

    const studentIds = [...new Set(attendances.map(a => a.studentId?._id || a.studentId).filter(Boolean))];

    // 2. Fetch approved Leaves for these students
    const leaveQuery = {
      studentId: { $in: studentIds },
      status: { $nin: ['rejected'] },
      approved: { $ne: false }
    };
    if (activeYearId && searchParams.get('all') !== 'true') {
      leaveQuery.academicYearId = activeYearId;
    }

    const [leaves, shortLeaves] = await Promise.all([
      Leave.find(leaveQuery).populate('studentId').populate('teacherId'),
      ClassExcusedPass.find({
        studentId: { $in: studentIds },
        ApproveCEP: { $ne: false }
      }).populate('studentId').populate('teacherId')
    ]);

    // Group leaves by student string ID
    const leavesByStudent = {};
    leaves.forEach(l => {
      const sId = (l.studentId?._id || l.studentId)?.toString();
      if (!sId) return;
      if (!leavesByStudent[sId]) leavesByStudent[sId] = [];
      leavesByStudent[sId].push(l);
    });

    const shortLeavesByStudent = {};
    shortLeaves.forEach(sl => {
      const sId = (sl.studentId?._id || sl.studentId)?.toString();
      if (!sId) return;
      if (!shortLeavesByStudent[sId]) shortLeavesByStudent[sId] = [];
      shortLeavesByStudent[sId].push(sl);
    });

    const discrepancies = [];

    for (const att of attendances) {
      const sObj = att.studentId;
      if (!sObj) continue;
      const sId = (sObj._id || sObj).toString();

      const timeRange = getAttendanceTimeRange(att);
      if (!timeRange || isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) continue;

      const studentLeaves = leavesByStudent[sId] || [];
      const studentShortLeaves = shortLeavesByStudent[sId] || [];

      let matchingLeave = null;
      let matchingType = null;

      // Check standard leaves
      for (const leave of studentLeaves) {
        if (!leave.fromDate) continue;
        const lFromStr = leave.fromDate;
        const lFromTime = leave.fromTime || '00:00';
        const leaveStart = new Date(`${lFromStr}T${lFromTime}:00`);

        let leaveEnd;
        if (leave.returnedAt) {
          leaveEnd = new Date(leave.returnedAt);
        } else if (leave.toDate && leave.toTime) {
          leaveEnd = new Date(`${leave.toDate}T${leave.toTime}:00`);
        } else if (leave.toDate) {
          leaveEnd = new Date(`${leave.toDate}T23:59:59`);
        } else {
          leaveEnd = new Date('2099-12-31T23:59:59');
        }

        if (isNaN(leaveStart.getTime()) || isNaN(leaveEnd.getTime())) continue;

        // Session overlaps with active leave window
        if (timeRange.start < leaveEnd && timeRange.end > leaveStart) {
          matchingLeave = leave;
          matchingType = 'Leave';
          break;
        }
      }

      // Check short leaves if not matched
      if (!matchingLeave) {
        for (const sl of studentShortLeaves) {
          if (!sl.date || !sl.fromTime || !sl.toTime) continue;
          let slDateStr;
          try {
            slDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(sl.date));
          } catch (e) {
            const slDate = new Date(sl.date);
            const pad = (n) => String(n).padStart(2, '0');
            slDateStr = `${slDate.getFullYear()}-${pad(slDate.getMonth() + 1)}-${pad(slDate.getDate())}`;
          }

          const slStart = new Date(`${slDateStr}T${sl.fromTime}:00`);
          let slEnd;
          if (sl.returnedAt) {
            slEnd = new Date(sl.returnedAt);
          } else {
            slEnd = new Date(`${slDateStr}T${sl.toTime}:00`);
          }

          if (isNaN(slStart.getTime()) || isNaN(slEnd.getTime())) continue;

          if (timeRange.start < slEnd && timeRange.end > slStart) {
            matchingLeave = sl;
            matchingType = 'ClassExcusedPass';
            break;
          }
        }
      }

      if (matchingLeave) {
        const sessionLabel = getSessionLabel(att);
        const fromTime12 = format12Hour(timeRange.fromStr);
        const toTime12 = format12Hour(timeRange.toStr);
        const sessionRange12 = `${fromTime12} – ${toTime12}`;

        discrepancies.push({
          attendanceId: att._id,
          attendanceDate: timeRange.dateStr,
          attendanceTime: att.attendanceTime,
          period: att.period,
          more: att.more || att.custom || '',
          sessionType: sessionLabel,
          sessionRange: sessionRange12,
          fromTime: timeRange.fromStr,
          toTime: timeRange.toStr,
          fromTimeFormatted: fromTime12,
          toTimeFormatted: toTime12,
          recordedAt: att.createdAt ? new Date(att.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : null,
          attendanceStatus: att.status,
          onLeave: att.onLeave || false,
          teacherName: att.teacherId?.name || 'Unknown',
          student: {
            _id: sObj._id,
            ADNO: sObj.ADNO,
            name: sObj['SHORT NAME'] || sObj['FULL NAME'] || sObj.name || 'Unknown',
            class: sObj.CLASS || att.classNumber
          },
          matchedLeave: {
            _id: matchingLeave._id,
            type: matchingType,
            reason: matchingLeave.reason,
            disease: matchingLeave.disease || '',
            program: matchingLeave.program || '',
            fromDate: matchingLeave.fromDate || (matchingLeave.date ? new Date(matchingLeave.date).toISOString().split('T')[0] : ''),
            fromTime: matchingLeave.fromTime,
            fromTimeFormatted: format12Hour(matchingLeave.fromTime),
            toDate: matchingLeave.toDate || (matchingLeave.date ? new Date(matchingLeave.date).toISOString().split('T')[0] : ''),
            toTime: matchingLeave.toTime,
            toTimeFormatted: format12Hour(matchingLeave.toTime),
            returnedAt: matchingLeave.returnedAt || null,
            returnedAtFormatted: matchingLeave.returnedAt ? new Date(matchingLeave.returnedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : null,
            status: matchingLeave.status
          }
        });
      }
    }

    return NextResponse.json({
      discrepancies,
      count: discrepancies.length
    });
  } catch (error) {
    console.error("Error fetching unregistered leave discrepancies:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const { attendanceIds } = await req.json();

    if (!attendanceIds || !Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return NextResponse.json({ error: "attendanceIds array is required" }, { status: 400 });
    }

    const result = await Attendance.updateMany(
      { _id: { $in: attendanceIds } },
      { $set: { onLeave: true, status: "Absent" } }
    );

    return NextResponse.json({
      message: `Successfully updated ${result.modifiedCount} attendance records to onLeave: true`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error fixing attendance onLeave records:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
