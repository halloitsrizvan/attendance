import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassReport from '@/models/classReportModel';

export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'Missing report ID' }, { status: 400 });
        }

        const report = await ClassReport.findById(id);
        
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        report.classTeacherApproved = true;
        await report.save();

        return NextResponse.json({ message: 'Report approved by class teacher', report }, { status: 200 });
    } catch (error) {
        console.error("Error approving class report:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
