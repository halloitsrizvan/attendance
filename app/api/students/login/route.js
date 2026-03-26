import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";
import { generateStudentToken } from "@/utils/studentJwtUtils";

export async function POST(req) {
  await dbConnect();
  try {
    const { ADNO, Password } = await req.json();

    if (!ADNO || !Password) {
      return NextResponse.json({ error: 'AD and Password are required' }, { status: 400 });
    }

    const numericPassword = typeof Password === 'string' ? parseInt(Password) : Password;
    if (isNaN(numericPassword)) {
      return NextResponse.json({ error: "Password must be a valid number" }, { status: 400 });
    }

    const student = await Student.findOne({ ADNO: Number(ADNO) });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 401 });
    }

    const isPasswordValid = numericPassword === student.Password;
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const token = generateStudentToken(student);

    return NextResponse.json({
      token,
      student: { 
        id: student._id, 
        "SHORT NAME": student["SHORT NAME"], 
        ADNO: student.ADNO, 
        SL: student.SL,
        CLASS: student.CLASS
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
