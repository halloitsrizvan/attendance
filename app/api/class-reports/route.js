import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassReport from '@/models/classReportModel';
import Teacher from '@/models/teachersModel';
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
    
    const rawPoints = approvedPoints[0]?.total || 0;

    const maxPointsAgg = await Points.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: startDate, $lt: endDate } } },
        { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
        { $unwind: '$student' },
        { $group: { _id: '$student.CLASS', total: { $sum: '$points' } } },
        { $sort: { total: -1 } },
        { $limit: 1 }
    ]);
    const maxPoints = maxPointsAgg[0]?.total || 0;

    const calculatedPoints = maxPoints > 0 ? (rawPoints / maxPoints) * 100 : 0;
    
    return {
        original: rawPoints,
        calculated: parseFloat(calculatedPoints.toFixed(2))
    };
}

export async function POST(req) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { teacherId, studentId, submitterType, month, year, classNumber, programs } = body;

        if ((!teacherId && !studentId) || !month || !year || !classNumber || !programs) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Determine section based on classNumber
        let section = 'Unknown';
        const cNum = Number(classNumber);
        if (cNum >= 1 && cNum <= 3) section = 'Junior';
        else if (cNum >= 4 && cNum <= 7) section = 'Senior';
        else if (cNum >= 8 && cNum <= 10) section = 'Super-Senior';

        const existingReport = await ClassReport.findOne({ classNumber: cNum, month, year });

        // Block modifications if the report is already reviewed by the admin
        if (existingReport && existingReport.status === 'reviewed') {
            return NextResponse.json({ error: 'This report has already been reviewed by the admin and cannot be modified.' }, { status: 403 });
        }

        // Validate Tier 1 limit (maximum 10 per month) - only check if we are submitting new Tier 1 programs
        const incomingTier1Count = programs.filter(p => p.tier === 'Tier 1').length;
        if (incomingTier1Count > 0) {
            const otherReports = await ClassReport.find({ classNumber: cNum, month, year });
            const existingTier1Count = otherReports.reduce((sum, r) => {
                const count = (r.programs || []).filter(p => p.tier === 'Tier 1' && !p.rejected).length;
                return sum + count;
            }, 0);

            if (existingTier1Count + incomingTier1Count > 10) {
                return NextResponse.json({ error: `Tier 1 programs limit exceeded. You already have ${existingTier1Count} Tier 1 program(s) and cannot submit ${incomingTier1Count} more.` }, { status: 400 });
            }
        }

        // Calculate latest month Zehnuth Points
        const latestZehnuth = await calculateZehnuthPoints(cNum, month, year);

        if (existingReport) {
            existingReport.programs.push(...programs);
            if (submitterType === 'student' && existingReport.classTeacherApproved) {
                existingReport.classTeacherApproved = false;
            }
            existingReport.originalZehnuthPoints = latestZehnuth.original;
            existingReport.zehnuthPoints = latestZehnuth.calculated;
            await existingReport.save();
            return NextResponse.json({ message: 'Programs added to existing report successfully', report: existingReport }, { status: 200 });
        } else {
            const newReport = new ClassReport({
                teacherId: teacherId || undefined,
                studentId: studentId || undefined,
                submitterType: submitterType || 'teacher',
                month,
                year,
                classNumber: cNum,
                section,
                programs,
                originalZehnuthPoints: latestZehnuth.original,
                zehnuthPoints: latestZehnuth.calculated
            });

            await newReport.save();
            return NextResponse.json({ message: 'Report submitted successfully', report: newReport }, { status: 201 });
        }
    } catch (error) {
        console.error("Error submitting class report:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (type === 'leaderboard') {
            const month = searchParams.get('month');
            const query = {};
            if (month && month !== 'All') {
                query.month = month;
            }
            // Aggregate total marks by class
            const reports = await ClassReport.find(query).lean();
            
            const classMap = {};
            
            for (let report of reports) {
                // Dynamically compute zehnuthPoints for this report
                const monthIndex = MONTHS.indexOf(report.month);
                let zpCount = 0;
                if (monthIndex !== -1) {
                    const startDate = new Date(report.year, monthIndex, 1);
                    const endDate = new Date(report.year, monthIndex + 1, 1);

                    const studentsInClass = await Student.find({ CLASS: report.classNumber }).select('_id');
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
                    const rawZp = approvedPoints[0]?.total || 0;

                    const maxPointsAgg = await Points.aggregate([
                        { $match: { status: 'approved', createdAt: { $gte: startDate, $lt: endDate } } },
                        { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
                        { $unwind: '$student' },
                        { $group: { _id: '$student.CLASS', total: { $sum: '$points' } } },
                        { $sort: { total: -1 } },
                        { $limit: 1 }
                    ]);
                    const maxZp = maxPointsAgg[0]?.total || 0;

                    zpCount = maxZp > 0 ? parseFloat(((rawZp / maxZp) * 100).toFixed(2)) : 0;
                }
                
                const liveTotalMark = (report.programPoints || 0) + (report.vivaPoints || 0) + zpCount;

                const key = `Class ${report.classNumber}`;
                if (!classMap[key]) {
                    classMap[key] = {
                        className: key,
                        classNumber: report.classNumber,
                        section: report.section,
                        totalMark: 0,
                        reportCount: 0
                    };
                }
                classMap[key].totalMark += liveTotalMark;
                classMap[key].reportCount += 1;
            }

            const leaderboard = Object.values(classMap).sort((a, b) => b.totalMark - a.totalMark);
            return NextResponse.json(leaderboard);
        }

        const adminView = searchParams.get('adminView') === 'true';
        const omitDrafts = searchParams.get('omitDrafts') === 'true';
        const classNumber = searchParams.get('classNumber');
        const filter = {};
        if (classNumber) {
            filter.classNumber = Number(classNumber);
        }

        if (adminView) {
            filter.$or = [
                { submitterType: { $ne: 'student' } },
                { classTeacherApproved: true }
            ];
        }

        // Return all reports
        const reports = await ClassReport.find(filter)
            .populate('teacherId', 'name')
            .populate('studentId', 'name FULL NAME SHORT NAME role')
            .populate('markedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const finalReports = [];
        const maxZehnuthCache = {};

        // Compute live monthly score and points for every report
        for (let report of reports) {
            // Filter out drafted programs for teachers and admins
            if (omitDrafts || adminView) {
                report.programs = (report.programs || []).filter(p => !p.isDraft);
                if (report.programs.length === 0) continue; // Skip empty reports
            }
            
            finalReports.push(report);
            
            const monthIndex = MONTHS.indexOf(report.month);
            if (monthIndex !== -1) {
                const startDate = new Date(report.year, monthIndex, 1);
                const endDate = new Date(report.year, monthIndex + 1, 1);

                const studentsInClass = await Student.find({ CLASS: report.classNumber }).select('_id');
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
                
                const rawZehnuth = approvedPoints[0]?.total || 0;

                const cacheKey = `${report.month}-${report.year}`;
                let maxZehnuth = 0;
                if (maxZehnuthCache[cacheKey] !== undefined) {
                    maxZehnuth = maxZehnuthCache[cacheKey];
                } else {
                    const maxPointsAgg = await Points.aggregate([
                        { $match: { status: 'approved', createdAt: { $gte: startDate, $lt: endDate } } },
                        { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
                        { $unwind: '$student' },
                        { $group: { _id: '$student.CLASS', total: { $sum: '$points' } } },
                        { $sort: { total: -1 } },
                        { $limit: 1 }
                    ]);
                    maxZehnuth = maxPointsAgg[0]?.total || 0;
                    maxZehnuthCache[cacheKey] = maxZehnuth;
                }

                report.originalZehnuthPoints = rawZehnuth;
                report.zehnuthPoints = maxZehnuth > 0 ? parseFloat(((rawZehnuth / maxZehnuth) * 100).toFixed(2)) : 0;
            } else {
                report.originalZehnuthPoints = 0;
                report.zehnuthPoints = 0;
            }

            // Always calculate live total mark sum
            report.totalMark = (report.programPoints || 0) + (report.vivaPoints || 0) + report.zehnuthPoints;
        }

        return NextResponse.json(finalReports);
    } catch (error) {
        console.error("Error fetching class reports:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
