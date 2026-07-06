import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassReport from '@/models/classReportModel';
import Student from '@/models/studentsModel';
import Points from '@/models/pointsModel';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

async function calculateZehnuthPoints(classNumber, month, year) {
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return 0;
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 1);

    const studentsInClass = await Student.find({ CLASS: Number(classNumber) }).select('_id');
    const studentIds = studentsInClass.map(s => s._id);

    const approvedPoints = await Points.aggregate([
        {
            $match: {
                studentId: { $in: studentIds },
                status: 'approved',
                createdAt: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$points' }
            }
        }
    ]);
    
    return approvedPoints[0]?.total || 0;
}

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

        // Validate Tier 1 limit only if changing this program's tier to Tier 1
        const programToEdit = report.programs[programIndex];
        const updatedTier = updatedData.tier || programToEdit.tier;
        if (updatedTier === 'Tier 1' && programToEdit.tier !== 'Tier 1') {
            const otherReports = await ClassReport.find({
                classNumber: report.classNumber,
                month: report.month,
                year: report.year
            });
            
            let totalTier1 = 0;
            otherReports.forEach(r => {
                r.programs.forEach(p => {
                    if (p.tier === 'Tier 1' && !p.rejected) {
                        // Exclude the current program being updated from the count
                        if (r._id.toString() === report._id.toString() && p._id.toString() === programId) {
                            return;
                        }
                        totalTier1++;
                    }
                });
            });

            if (totalTier1 >= 10) {
                return NextResponse.json({ error: 'Tier 1 programs limit exceeded (maximum 10 per month)' }, { status: 400 });
            }
        }

        // Update program fields
        Object.keys(updatedData).forEach(key => {
            if (key !== '_id') {
                report.programs[programIndex][key] = updatedData[key];
            }
        });

        // Recalculate monthly Zehnuth Points
        report.zehnuthPoints = await calculateZehnuthPoints(report.classNumber, report.month, report.year);

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
        
        // Recalculate monthly Zehnuth Points
        report.zehnuthPoints = await calculateZehnuthPoints(report.classNumber, report.month, report.year);

        await report.save();

        return NextResponse.json({ message: 'Program deleted successfully', report }, { status: 200 });
    } catch (error) {
        console.error("Error deleting program:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
