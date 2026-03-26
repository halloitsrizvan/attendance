import dbConnect from "@/lib/mongodb";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateTeacherToken } from "@/utils/teacherJwtUtils";

export async function POST(req) {
  await dbConnect();
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const token = generateTeacherToken(teacher);

    return NextResponse.json({
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher?.role,
        subjectsTaught: teacher.subjectsTaught,
        classNum: teacher.classNum
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
