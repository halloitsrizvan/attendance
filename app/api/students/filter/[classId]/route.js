import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await dbConnect();
  try {
    const { classId } = params;
    
    const students = await Student.find({ CLASS: Number(classId) }).select('-Password');
    
    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'No students found for this class' }, { status: 404 });
    }
    
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}