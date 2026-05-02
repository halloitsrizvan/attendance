import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import Minus from "@/models/minusModel";
import Leave from "@/models/leaveModel";
import ClassExcusedPass from "@/models/shortLeaveModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');
    const classNumber = searchParams.get('class');

    if (!fromDateStr || !toDateStr) {
      return NextResponse.json({ error: 'fromDate and toDate are required' }, { status: 400 });
    }

    const startDate = new Date(fromDateStr);
    const endDate = new Date(toDateStr);
    endDate.setHours(23, 59, 59, 999);

    let studentQuery = {};
    if (classNumber) {
      studentQuery.CLASS = parseInt(classNumber, 10);
    }

    const students = await Student.find(studentQuery).sort({ SL: 1, ADNO: 1 });
    const studentIds = students.map(s => s._id);

    // Fetch Attendance
    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      attendanceDate: { $gte: startDate, $lte: endDate }
    }).populate({ path: 'leaveId', strictPopulate: false }).sort({ attendanceDate: 1 });

    // Fetch Manual Minus
    const minusRecords = await Minus.find({
      studentId: { $in: studentIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const studentData = students.map(student => {
      const id = student._id.toString();
      
      const attendance = attendanceRecords.filter(r => r.studentId.toString() === id);
      const manualMinus = minusRecords.filter(r => r.studentId.toString() === id);

      // Group attendance by time slot
      const groupedAttendance = {};
      attendance.forEach(record => {
        const time = record.attendanceTime;
        if (!groupedAttendance[time]) {
          groupedAttendance[time] = { absentOnLeaveFalse: 0, absentOnLeaveTrue: 0, periods: {} };
        }

        if (record.status === 'Absent') {
          // Check for Documented Medical (Home) leave
          const isMedicalDocumented = record.onLeave && 
            record.leaveId && 
            record.leaveId.reason === 'Medical (Home)' && 
            record.leaveId.documented === true;

          if (isMedicalDocumented) {
            return; // Don't count as absent for minus purposes
          }

          if (time === 'Period') {
            const p = record.period || 1;
            if (!groupedAttendance[time].periods[p]) {
                groupedAttendance[time].periods[p] = { absentOnLeaveFalse: 0, absentOnLeaveTrue: 0 };
            }
            if (record.onLeave) {
                groupedAttendance[time].periods[p].absentOnLeaveTrue++;
            } else {
                groupedAttendance[time].periods[p].absentOnLeaveFalse++;
            }
          } else {
            if (record.onLeave) {
              groupedAttendance[time].absentOnLeaveTrue++;
            } else {
              groupedAttendance[time].absentOnLeaveFalse++;
            }
          }
        }
      });

      const totalManualMinus = manualMinus.reduce((sum, r) => sum + (r.minusNum || 0), 0);

      return {
        _id: student._id,
        SL: student.SL,
        ad: student.ADNO,
        nameOfStd: student["SHORT NAME"] || student["FULL NAME"],
        class: student.CLASS,
        groupedAttendance,
        totalManualMinus
      };
    });

    return NextResponse.json({
      results: studentData
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
