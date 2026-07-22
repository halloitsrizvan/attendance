import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassReport from '@/models/classReportModel';

export async function PATCH(req) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { reportId, programs, adminId, vivaPoints, originalVivaPoints, tier2Points, zehnuthPoints, originalZehnuthPoints } = body;

        if (!reportId || !programs || !adminId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const report = await ClassReport.findById(reportId);
        
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        let tier1Points = 0;

        // Update each program's mark
        programs.forEach(updatedProgram => {
            const programToUpdate = report.programs.id(updatedProgram._id);
            if (programToUpdate) {
                // Ensure rejected status is persisted
                programToUpdate.rejected = !!updatedProgram.rejected;
                // If rejected, force mark to 0
                const markValue = programToUpdate.rejected ? 0 : (Number(updatedProgram.mark) || 0);
                programToUpdate.mark = markValue;
                
                if (programToUpdate.tier !== 'Tier 2') {
                    tier1Points += markValue;
                }
            }
        });

        const cappedTier2 = Math.min(Number(tier2Points) || 0, 10);
        const programPoints = tier1Points + cappedTier2;

        // Update root report properties
        const vp = Number(vivaPoints) || 0;
        const ogVp = Number(originalVivaPoints) || 0;
        const zp = Number(zehnuthPoints) || 0;
        const ogZp = Number(originalZehnuthPoints) || 0;
        
        report.programPoints = programPoints;
        report.tier1Points = tier1Points;
        report.tier2Points = cappedTier2;
        report.vivaPoints = vp;
        report.originalVivaPoints = ogVp;
        report.zehnuthPoints = zp;
        report.originalZehnuthPoints = ogZp;
        
        const scaledProgramPoints = (programPoints / 110) * 50;
        const scaledZehnuthPoints = zp * 0.25;
        const scaledVivaPoints = vp * 0.25;
        report.totalMark = parseFloat((scaledProgramPoints + scaledZehnuthPoints + scaledVivaPoints).toFixed(2));
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
