import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassReport from '@/models/classReportModel';

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        
        const { id } = params;
        const body = await req.json();
        const { programId, updatedData } = body;

        if (!id || !programId || !updatedData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const report = await ClassReport.findById(id);
        
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        if (report.status === 'reviewed') {
            return NextResponse.json({ error: 'Cannot edit programs of a reviewed report' }, { status: 403 });
        }

        const programIndex = report.programs.findIndex(p => p._id.toString() === programId);
        
        if (programIndex === -1) {
            return NextResponse.json({ error: 'Program not found in this report' }, { status: 404 });
        }

        // Update program fields
        Object.keys(updatedData).forEach(key => {
            if (key !== '_id') {
                report.programs[programIndex][key] = updatedData[key];
            }
        });

        await report.save();

        return NextResponse.json({ message: 'Program updated successfully', report }, { status: 200 });
    } catch (error) {
        console.error("Error updating program:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        
        const { id } = params;
        const { searchParams } = new URL(req.url);
        const programId = searchParams.get('programId');

        if (!id || !programId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const report = await ClassReport.findById(id);
        
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        if (report.status === 'reviewed') {
            return NextResponse.json({ error: 'Cannot delete programs from a reviewed report' }, { status: 403 });
        }

        report.programs = report.programs.filter(p => p._id.toString() !== programId);
        
        await report.save();

        return NextResponse.json({ message: 'Program deleted successfully', report }, { status: 200 });
    } catch (error) {
        console.error("Error deleting program:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
