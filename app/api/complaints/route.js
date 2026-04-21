import dbConnect from "@/lib/mongodb";
import Complaint from "@/models/complaintModel";
import Attendance from "@/models/attendanceModel";
import { NextResponse } from "next/server";

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const ad = searchParams.get('ad');

    try {
        let query = {};
        if (studentId) query.studentId = studentId;
        if (teacherId) query.teacherId = teacherId;
        
        const complaints = await Complaint.find(query)
            .populate('studentId')
            .populate('attendanceId')
            .populate('teacherId')
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
            } else if (complaint.actualStatus === 'Leave') {
                // If resolving as leave, we mark onLeave as true and keep status as 'Absent' (implicit)
                // usually 'Leave' means they were absent but excused.
                await Attendance.findByIdAndUpdate(complaint.attendanceId, { 
                    onLeave: true,
                    status: 'Absent' // Ensure it remains/becomes absent if it was marked wrongly
                });
            }
        }

        return NextResponse.json(updatedComplaint);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
