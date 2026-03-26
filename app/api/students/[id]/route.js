import dbConnect from "@/lib/mongodb";
import Student from "@/models/studentsModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await dbConnect();
  const { id } = params;
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    const student = await Student.findById(id).select('-Password');
    if (student) return NextResponse.json(student);
  }
  
  const studentByAd = await Student.findOne({ ADNO: Number(id) }).select('-Password');
  if (studentByAd) return NextResponse.json(studentByAd);
  
  return NextResponse.json({ error: "Student not found" }, { status: 404 });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  const { id } = params;
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    const student = await Student.findByIdAndDelete(id);
    if (student) return NextResponse.json(student);
  }
  
  const studentByAd = await Student.findOneAndDelete({ ADNO: Number(id) });
  if (studentByAd) return NextResponse.json(studentByAd);
  
  return NextResponse.json({ error: "Student not found" }, { status: 404 });
}

export async function PATCH(req, { params }) {
  await dbConnect();
  const { id } = params;
  try {
    const body = await req.json();
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { ADNO: Number(id) };
    }
    
    if (body.Password) {
      body.Password = Number(body.Password);
    }
    
    const student = await Student.findOneAndUpdate(query, { $set: body }, { new: true });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  return PATCH(req, { params });
}