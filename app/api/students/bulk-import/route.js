import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();
  try {
    const { students } = await req.json();
    
    if (!Array.isArray(students)) {
      return NextResponse.json({ error: "Students should be an array" }, { status: 400 });
    }

    const bulkOps = students.map((s) => ({
      updateOne: {
        filter: { ADNO: Number(s.ADNO) },
        update: {
          $set: {
            "FULL NAME": s["FULL NAME"],
            "SHORT NAME": s["SHORT NAME"],
            SL: Number(s.SL),
            CLASS: Number(s.CLASS),
            Password: Number(s.Password || s.Password_PIN || 1234), // Default to 1234 if missing
            onLeave: s.onLeave === 'true' || s.onLeave === true
          }
        },
        upsert: true
      }
    }));

    const result = await Student.bulkWrite(bulkOps);

    return NextResponse.json({ 
      message: "Sync complete!", 
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
