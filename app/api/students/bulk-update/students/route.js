import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  await dbConnect();
  try {
    const { updates } = await req.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates should be an array" }, { status: 400 });
    }

    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { ADNO: u.ADNO },
        update: {
          $set: {
            Status: u.Status,
            Time: u.Time,
            Date: u.Date
          }
        }
      }
    }));

    await Student.bulkWrite(bulkOps);

    return NextResponse.json({ message: "Students updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
