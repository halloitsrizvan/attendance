import dbConnect from "@/lib/mongodb";
import Teacher from "@/models/teachersModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === 'true';
    
    let query = {};
    if (!includeInactive) {
      query.active = { $ne: false };
    }
    
    const teachers = await Teacher.find(query).select("-password").sort({ createdAt: -1 });
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { email, password, name, phone, classNum, role } = body;

    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = await Teacher.create({
      email,
      password: hashedPassword,
      name,
      phone,
      classNum,
      role
    });

    const teacherResponse = teacher.toObject();
    delete teacherResponse.password;
    
    return NextResponse.json(teacherResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
