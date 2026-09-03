import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";
import { protectMutation } from "@/utils/mutationGuard";

export async function PATCH(req, { params }) {
  const mutationBlocked = protectMutation(req);
  if (mutationBlocked) return mutationBlocked;

  await dbConnect();
  try {
    const { ad } = params;
    const { onLeave } = await req.json();
    
    const student = await Student.findOne({ ADNO: Number(ad) });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    student.onLeave = !!onLeave;
    await student.save();
    
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}