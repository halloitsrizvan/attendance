import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassReport from '@/models/classReportModel';

export async function PATCH(req) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { reportId, programs, adminId } = body;

        if (!reportId || !programs || !adminId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const report = await ClassReport.findById(reportId);
        
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        let totalMark = 0;

        // Update each program's mark
        programs.forEach(updatedProgram => {
            const programToUpdate = report.programs.id(updatedProgram._id);
            if (programToUpdate) {
                // Ensure mark is a valid number, default to 0
                const markValue = Number(updatedProgram.mark) || 0;
                programToUpdate.mark = markValue;
                totalMark += markValue;
            }
        });

        // Update root report properties
        report.totalMark = totalMark;
        report.status = 'reviewed';
        report.markedBy = adminId;
        report.reviewedAt = new Date();

        await report.save();

        return NextResponse.json({ message: 'Report reviewed successfully', report }, { status: 200 });
    } catch (error) {
        console.error("Error reviewing class report:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
