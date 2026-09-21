import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

import AcademicYear from "@/models/academicYearModel";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ad = searchParams.get('ad');
  const status = searchParams.get('status');
  const academicYearId = searchParams.get('academicYearId');
  const allYears = searchParams.get('all') === 'true' || academicYearId === 'all';
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const classesParam = searchParams.get('classes');
  const hasDoc = searchParams.get('hasDoc');
  const docType = searchParams.get('docType');

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

    if (classesParam && classesParam !== 'all' && !ad) {
      const classList = classesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (classList.length > 0) {
        const numericClasses = classList.map(c => Number(c)).filter(n => !isNaN(n));
        const students = await Student.find({
          $or: [
            { CLASS: { $in: classList } },
            { CLASS: { $in: numericClasses } }
          ]
        }).select('_id');
        const studentIds = students.map(s => s._id);
        query.studentId = { $in: studentIds };
      }
    }

    if (status) {
      const statusList = status.split(',');
      query.status = { $in: statusList };
    }

    if (fromDate && toDate) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } },
          { fromDate: { $gte: fromDate, $lte: toDate } },
          { toDate: { $gte: fromDate, $lte: toDate } },
          { fromDate: { $lte: toDate }, toDate: null }
        ]
      });
    } else if (fromDate) {
      query.fromDate = { $gte: fromDate };
    } else if (toDate) {
      query.fromDate = { $lte: toDate };
    }

    if (hasDoc === 'true') {
      if (docType === 'medical') {
        query.$or = [{ documentUrl: { $ne: null } }, { isMedicalSubmitted: true }];
      } else if (docType === 'program') {
        query.$or = [{ programDocumentUrl: { $ne: null } }, { isProgramSubmitted: true }];
      } else {
        query.$or = [
          { documentUrl: { $ne: null } },
          { isMedicalSubmitted: true },
          { programDocumentUrl: { $ne: null } },
          { isProgramSubmitted: true }
        ];
      }
    }

    if (!allYears) {
      if (academicYearId) {
        query.academicYearId = academicYearId;
      } else {
        const activeYearId = await getActiveAcademicYearId();
        if (activeYearId) {
          query.academicYearId = activeYearId;
        }
      }
    }

    const leaves = await Leave.find(query)
      .populate('studentId')
      .populate('teacherId')
      .populate('academicYearId')
      .sort({ createdAt: -1 });
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { protectMutation } from "@/utils/mutationGuard";

export async function POST(req) {
  const mutationBlocked = protectMutation(req);
  if (mutationBlocked) return mutationBlocked;

  await dbConnect();
  try {
    const body = await req.json();
    const activeYearId = await getActiveAcademicYearId();
    if (!body.academicYearId && activeYearId) {
      body.academicYearId = activeYearId;
    }
    const newLeave = await Leave.create(body);
    return NextResponse.json(newLeave);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
