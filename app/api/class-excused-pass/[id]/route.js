import dbConnect from "@/lib/mongodb";
import ClassExcusedPass from "@/models/shortLeaveModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const pass = await ClassExcusedPass.findById(params.id);
  if (!pass) {
    return NextResponse.json({ error: "Pass not found" }, { status: 404 });
  }
  return NextResponse.json(pass);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 404 });
  }
  const pass = await ClassExcusedPass.findByIdAndDelete(params.id);
  if (!pass) {
    return NextResponse.json({ error: "Pass not found" }, { status: 404 });
  }
  return NextResponse.json(pass);
}