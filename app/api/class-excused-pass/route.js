import dbConnect from "@/lib/mongodb";
import ClassExcusedPass from "@/models/shortLeaveModel";
import Student from "@/models/studentsModel";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import { getActiveAcademicYearId } from "@/lib/getActiveAcademicYear";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const ad = searchParams.get('ad');

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

    const activeYearId = await getActiveAcademicYearId();
    if (activeYearId && searchParams.get('all') !== 'true') {
      query.academicYearId = activeYearId;
    }

    const passes = await ClassExcusedPass.find(query)
      .populate('studentId')
      .populate('teacherId')
      .sort({ createdAt: -1 });
    return NextResponse.json(passes);
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
    const newPass = await ClassExcusedPass.create(body);
    return NextResponse.json(newPass);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
