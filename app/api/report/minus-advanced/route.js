import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/attendanceModel";
import Student from "@/models/studentsModel";
import Minus from "@/models/minusModel";
import Leave from "@/models/leaveModel";
import ClassExcusedPass from "@/models/shortLeaveModel";
import Points from "@/models/pointsModel";
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

    // Fetch Points
    const pointsRecords = await Points.find({
      studentId: { $in: studentIds },
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'approved'
    });

    const isWeekendRecord = (record) => {
      if (!record.attendanceDate) return false;
      const date = new Date(record.attendanceDate);
      const day = date.getDay(); // 4 = Thursday, 5 = Friday
      if (day === 4) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (hours > 16 || (hours === 16 && minutes >= 30)) {
          return true;
        }
        if (record.attendanceTime === 'Night') {
          return true;
        }
      } else if (day === 5) {
        return true;
      }
      return false;
    };

    const studentData = students.map(student => {
      const id = student._id.toString();
      
      const attendance = attendanceRecords.filter(r => r.studentId.toString() === id);
      
      // Deduplicate attendance records (per day, per time slot/period) to match detailed-daily reporting
      const seen = new Map();
      attendance.forEach(record => {
        const dateStr = record.attendanceDate instanceof Date
          ? record.attendanceDate.toISOString().split('T')[0]
          : new Date(record.attendanceDate).toISOString().split('T')[0];
        const time = record.attendanceTime;
        const periodNum = record.period || 1;
        const key = `${dateStr}|${time}|${time === 'Period' ? periodNum : ''}`;
        seen.set(key, record);
      });
      const deduplicatedAttendance = Array.from(seen.values());

      const manualMinus = minusRecords.filter(r => r.studentId.toString() === id);
      const studentPoints = pointsRecords.filter(r => r.studentId.toString() === id);

      // Group attendance by time slot
      const groupedAttendance = {};
      const medicalLeavesSet = new Set();
      const documentedLeavesSet = new Set();
      const ogeaLeavesSet = new Set();
      const documentedMedicalLeavesSet = new Set();
      const documentedOgeaLeavesSet = new Set();

      deduplicatedAttendance.forEach(record => {
        const time = record.attendanceTime;
        if (!groupedAttendance[time]) {
          groupedAttendance[time] = { 
            absentOnLeaveFalse: 0, 
            absentOnLeaveTrue: 0, 
            weekendAbsentOnLeaveFalse: 0, 
            weekendAbsentOnLeaveTrue: 0, 
            medicalAbsentOnLeaveTrue: 0,
            weekendMedicalAbsentOnLeaveTrue: 0,
            documentedMedicalAbsentOnLeaveTrue: 0,
            weekendDocumentedMedicalAbsentOnLeaveTrue: 0,
            ogeaAbsentOnLeaveTrue: 0,
            weekendOgeaAbsentOnLeaveTrue: 0,
            documentedOgeaAbsentOnLeaveTrue: 0,
            weekendDocumentedOgeaAbsentOnLeaveTrue: 0,
            documentedAbsentOnLeaveTrue: 0,
            weekendDocumentedAbsentOnLeaveTrue: 0,
            periods: {} 
          };
        }

        if (record.status === 'Absent') {
          // Check for Medical Leaves
          let isMedical = false;
          let isOtherDocumented = false;
          let isOgea = false;

          if (record.onLeave && record.leaveId) {
            const reason = record.leaveId.reason;
            isMedical = reason === 'Medical (Home)' || reason === 'Medical (Room)' || reason === 'Hospital';
            isOgea = reason === 'OGEA';
            const recordIsDocumented = record.leaveId.documented === true || record.leaveId.programDocumented === true;
            
            if (isMedical) {
              medicalLeavesSet.add(record.leaveId._id.toString());
              if (recordIsDocumented) {
                documentedMedicalLeavesSet.add(record.leaveId._id.toString());
              }
            } else if (isOgea) {
              ogeaLeavesSet.add(record.leaveId._id.toString());
              if (recordIsDocumented) {
                documentedOgeaLeavesSet.add(record.leaveId._id.toString());
              }
            }
            
            if (recordIsDocumented) {
              documentedLeavesSet.add(record.leaveId._id.toString());
              isOtherDocumented = true;
            }
          }

          const weekend = isWeekendRecord(record);
          const isDocumented = record.onLeave && record.leaveId && (record.leaveId.documented === true || record.leaveId.programDocumented === true);

          // Helper to increment documented/medical/ogea values
          const incrementSpecialCounters = (obj) => {
            if (isMedical) {
              if (weekend) obj.weekendMedicalAbsentOnLeaveTrue++;
              else obj.medicalAbsentOnLeaveTrue++;
            }
            if (isMedical && isDocumented) {
              if (weekend) obj.weekendDocumentedMedicalAbsentOnLeaveTrue++;
              else obj.documentedMedicalAbsentOnLeaveTrue++;
            }
            if (isOgea) {
              if (weekend) obj.weekendOgeaAbsentOnLeaveTrue++;
              else obj.ogeaAbsentOnLeaveTrue++;
            }
            if (isOgea && isDocumented) {
              if (weekend) obj.weekendDocumentedOgeaAbsentOnLeaveTrue++;
              else obj.documentedOgeaAbsentOnLeaveTrue++;
            }
            if (isDocumented) {
              if (weekend) obj.weekendDocumentedAbsentOnLeaveTrue++;
              else obj.documentedAbsentOnLeaveTrue++;
            }
          };

          if (time === 'Period') {
            const p = record.period || 1;
            if (!groupedAttendance[time].periods[p]) {
                groupedAttendance[time].periods[p] = { 
                  absentOnLeaveFalse: 0, 
                  absentOnLeaveTrue: 0,
                  weekendAbsentOnLeaveFalse: 0,
                  weekendAbsentOnLeaveTrue: 0,
                  medicalAbsentOnLeaveTrue: 0,
                  weekendMedicalAbsentOnLeaveTrue: 0,
                  documentedMedicalAbsentOnLeaveTrue: 0,
                  weekendDocumentedMedicalAbsentOnLeaveTrue: 0,
                  ogeaAbsentOnLeaveTrue: 0,
                  weekendOgeaAbsentOnLeaveTrue: 0,
                  documentedOgeaAbsentOnLeaveTrue: 0,
                  weekendDocumentedOgeaAbsentOnLeaveTrue: 0,
                  documentedAbsentOnLeaveTrue: 0,
                  weekendDocumentedAbsentOnLeaveTrue: 0
                };
            }

            // Always update special counters
            incrementSpecialCounters(groupedAttendance[time].periods[p]);

            if (record.onLeave) {
                if (weekend) {
                  groupedAttendance[time].periods[p].weekendAbsentOnLeaveTrue++;
                } else {
                  groupedAttendance[time].periods[p].absentOnLeaveTrue++;
                }
            } else {
                if (weekend) {
                  groupedAttendance[time].periods[p].weekendAbsentOnLeaveFalse++;
                } else {
                  groupedAttendance[time].periods[p].absentOnLeaveFalse++;
                }
            }
          } else {
            // Always update special counters
            incrementSpecialCounters(groupedAttendance[time]);

            if (record.onLeave) {
              if (weekend) {
                groupedAttendance[time].weekendAbsentOnLeaveTrue++;
              } else {
                groupedAttendance[time].absentOnLeaveTrue++;
              }
            } else {
              if (weekend) {
                groupedAttendance[time].weekendAbsentOnLeaveFalse++;
              } else {
                groupedAttendance[time].absentOnLeaveFalse++;
              }
            }
          }
        }
      });

      const totalManualMinus = manualMinus.reduce((sum, r) => sum + (r.minusNum || 0), 0);
      const totalZehnuthPoints = studentPoints.reduce((sum, r) => sum + (r.points || 0), 0);

      return {
        _id: student._id,
        SL: student.SL,
        ad: student.ADNO,
        nameOfStd: student["SHORT NAME"] || student["FULL NAME"],
        class: student.CLASS,
        groupedAttendance,
        totalManualMinus,
        totalMedicalLeave: medicalLeavesSet.size,
        totalDocumentedMedicalLeave: documentedMedicalLeavesSet.size,
        totalOgeaLeave: ogeaLeavesSet.size,
        totalDocumentedOgeaLeave: documentedOgeaLeavesSet.size,
        totalDocumentedLeave: documentedLeavesSet.size,
        totalZehnuthPoints
      };
    });

    return NextResponse.json({
      results: studentData
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
