import dbConnect from "@/lib/mongodb";
import Complaint from "@/models/complaintModel";
import Attendance from "@/models/attendanceModel";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const ad = searchParams.get('ad');

    try {
        let query = {};
        
        if (studentId) {
            if (mongoose.Types.ObjectId.isValid(studentId)) {
                query.studentId = studentId;
            } else {
                return NextResponse.json({ error: "Invalid studentId format" }, { status: 400 });
            }
        }
        
        if (teacherId) {
            if (mongoose.Types.ObjectId.isValid(teacherId)) {
                query.teacherId = teacherId;
            } else {
                return NextResponse.json({ error: "Invalid teacherId format" }, { status: 400 });
            }
        }
        
        const complaints = await Complaint.find(query)
            .populate('studentId')
            .populate('attendanceId')
            .populate('teacherId')
            .sort({ createdAt: -1 });
            
        return NextResponse.json(complaints);
    } catch (error) {
        console.error("Complaints GET Error:", error);
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

export async function PATCH(req) {
    await dbConnect();
    try {
        const { id, ...updates } = await req.json();
        
        // Find current complaint state
        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        }

        // Update complaint
        const updatedComplaint = await Complaint.findByIdAndUpdate(id, updates, { new: true });

        // Automated Correction: If status is set to 'Resolved', update the actual attendance record
        if (updates.status === 'Resolved' && complaint.attendanceId) {
            if (complaint.actualStatus === 'Present') {
                await Attendance.findByIdAndUpdate(complaint.attendanceId, { 
                    status: 'Present',
                    onLeave: false 
                });
            } else if (complaint.actualStatus === 'Leave' || complaint.actualStatus === 'CEP') {
                // If resolving as leave or CEP, we mark onLeave as true and keep status as 'Absent'
                await Attendance.findByIdAndUpdate(complaint.attendanceId, { 
                    onLeave: true,
                    status: 'Absent' 
                });
            }
        }

        return NextResponse.json(updatedComplaint);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
