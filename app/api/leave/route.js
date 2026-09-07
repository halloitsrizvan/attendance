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

    if (status) {
      const statusList = status.split(',');
      query.status = { $in: statusList };
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
