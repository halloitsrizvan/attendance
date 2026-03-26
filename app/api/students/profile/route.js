import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";
import { verifyStudentToken } from "@/utils/studentJwtUtils";

export async function GET(req) {
  await dbConnect();
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyStudentToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded.adno) {
        return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const student = await Student.findOne({ ADNO: Number(decoded.adno) });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
        id: student._id, 
        "SHORT NAME": student["SHORT NAME"], 
        ADNO: student.ADNO, 
        SL: student.SL,
        CLASS: student.CLASS,
        "FULL NAME": student["FULL NAME"]
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}
