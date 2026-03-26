import dbConnect from "@/lib/mongodb";
import Classes from "@/models/classes";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  await dbConnect();
  try {
    const { classNumber } = params;
    const body = await req.json();
    
    const cls = await Classes.findOneAndUpdate(
      { class: Number(classNumber) },
      { $set: body },
      { new: true }
    );

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    
    return NextResponse.json(cls);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
