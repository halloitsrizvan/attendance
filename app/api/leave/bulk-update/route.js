import dbConnect from "@/lib/mongodb";
import Leave from "@/models/leaveModel";
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
        filter: { _id: u._id },
        update: { $set: u.updateData }
      }
    }));

    await Leave.bulkWrite(bulkOps);

    return NextResponse.json({ message: "Leaves updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
