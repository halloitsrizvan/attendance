import dbConnect from "@/lib/mongodb";
import Complaint from "@/models/complaintModel";
import { NextResponse } from "next/server";

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const ad = searchParams.get('ad');

    try {
        let query = {};
        if (studentId) query.studentId = studentId;
        
        const complaints = await Complaint.find(query)
            .populate('studentId')
            .populate('attendanceId')
            .sort({ createdAt: -1 });
            
        return NextResponse.json(complaints);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const complaint = await Complaint.create(body);
        return NextResponse.json(complaint);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
