import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";
import { generateStudentToken } from "@/utils/studentJwtUtils";

export async function POST(req) {
  await dbConnect();
  try {
    const { "FULL NAME": fullName, "SHORT NAME": shortName, SL, ADNO, CLASS, Password } = await req.json();

    const existingStudent = await Student.findOne({ ADNO });
    if (existingStudent) {
      return NextResponse.json({ error: "Student already exists" }, { status: 400 });
    }

    const numericPassword = typeof Password === 'string' ? parseInt(Password) : Password;
    if (isNaN(numericPassword)) {
      return NextResponse.json({ error: "Password must be a valid number" }, { status: 400 });
    }

    const student = await Student.create({
      "FULL NAME": fullName,
      "SHORT NAME": shortName,
      SL,
      ADNO,
      CLASS,
      Password: numericPassword
    });

    const token = generateStudentToken(student);

    return NextResponse.json({
      token,
      students: { 
        id: student._id, 
        name: student["SHORT NAME"], 
        ad: student.ADNO, 
        sl: student.SL 
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
