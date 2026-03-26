import dbConnect from "@/lib/mongodb";
import { getStudentFromRequest } from "@/utils/studentAuthMiddleware";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();
  try {
    const student = await getStudentFromRequest(req);
    return NextResponse.json({ students: student });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
