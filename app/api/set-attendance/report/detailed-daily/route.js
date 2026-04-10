import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');
    const classNumber = searchParams.get('class');
    const attendanceTime = searchParams.get('attendanceTime');

    let startDate, endDate;
    let monthNum = null;
    let yearNum = null;

    if (fromDateStr && toDateStr) {
      startDate = new Date(fromDateStr);
      endDate = new Date(toDateStr);
      endDate.setHours(23, 59, 59, 999);
    } else if (month && year) {
      monthNum = parseInt(month, 10);
      yearNum = parseInt(year, 10);
      startDate = new Date(yearNum, monthNum - 1, 1);
      endDate = new Date(yearNum, monthNum, 1);
    } else {
      return NextResponse.json({ error: 'Either (fromDate and toDate) or (month and year) are required' }, { status: 400 });
    }

    const matchFilter = {
      attendanceDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (classNumber) {
      const studentsInClass = await Student.find({ CLASS: parseInt(classNumber, 10) });
      matchFilter.studentId = { $in: studentsInClass.map(s => s._id) };
    }
    if (attendanceTime) {
      matchFilter.attendanceTime = attendanceTime;
    }

    const attendanceRecords = await Attendance.find(matchFilter)
      .populate('studentId')
      .sort({
        attendanceDate: 1,
        attendanceTime: 1,
        period: 1
      });

    const studentMap = new Map();
    const availableTimeSlots = new Set();

    attendanceRecords.forEach(record => {
      if (!record.studentId) return;
      const key = record.studentId._id.toString();
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          SL: record.studentId.SL || 0,
          ad: record.studentId.ADNO,
          nameOfStd: record.studentId["SHORT NAME"] || record.studentId["FULL NAME"],
          class: record.studentId.CLASS,
          dailyAttendance: new Map()
        });
      }

      const student = studentMap.get(key);
      const date = record.attendanceDate instanceof Date
        ? record.attendanceDate.toISOString().split('T')[0]
        : record.attendanceDate;

      if (!student.dailyAttendance.has(date)) {
        student.dailyAttendance.set(date, {});
      }

      const dayAttendance = student.dailyAttendance.get(date);
      const timeKey = record.attendanceTime;

      if (timeKey === 'Period') {
        const periodNum = record.period || 1;
        if (!dayAttendance.Period) dayAttendance.Period = {};
        if (!dayAttendance.PeriodIds) dayAttendance.PeriodIds = {};
        dayAttendance.Period[periodNum] = record.status === 'Present' ? 'P' : 'A';
        dayAttendance.PeriodIds[periodNum] = record._id;
        availableTimeSlots.add('Period');
      } else {
        dayAttendance[timeKey] = record.status === 'Present' ? 'P' : 'A';
        if (!dayAttendance.SlotIds) dayAttendance.SlotIds = {};
        dayAttendance.SlotIds[timeKey] = record._id;
        availableTimeSlots.add(timeKey);
      }
    });

    const results = Array.from(studentMap.values()).map(student => {
      const dailyAttendanceArray = Array.from(student.dailyAttendance.entries()).map(([date, attendance]) => ({
        date,
        ...attendance
      }));

      let totalPresent = 0;
      let totalAbsent = 0;

      dailyAttendanceArray.forEach(day => {
        Object.entries(day).forEach(([key, value]) => {
          if (key === 'date') return;
          if (value === 'P') totalPresent++;
          else if (value === 'A') totalAbsent++;
          else if (typeof value === 'object' && value !== null) {
            Object.values(value).forEach(pv => {
              if (pv === 'P') totalPresent++;
              else if (pv === 'A') totalAbsent++;
            });
          }
        });
      });

      return {
        ...student,
        dailyAttendance: dailyAttendanceArray,
        present: totalPresent,
        absent: totalAbsent
      };
    });

    return NextResponse.json({
      month: monthNum,
      year: yearNum,
      results,
      availableTimeSlots: Array.from(availableTimeSlots).sort()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
