import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const classNum = searchParams.get("class");
    
    let query = {};
    if (classNum) {
      query.CLASS = Number(classNum);
    }
    
    // Performance: Only select required fields for common listing
    const students = await Student.find(query)
      .sort({ SL: 1 });
      
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const student = await Student.create(body);
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
