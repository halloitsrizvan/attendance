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

export async function POST(req) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { teacherId, month, year, classNumber, programs } = body;

        if (!teacherId || !month || !year || !classNumber || !programs) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Determine section based on classNumber
        let section = 'Unknown';
        const cNum = Number(classNumber);
        if (cNum >= 1 && cNum <= 3) section = 'Junior';
        else if (cNum >= 4 && cNum <= 7) section = 'Senior';
        else if (cNum >= 8 && cNum <= 10) section = 'Super-Senior';

        const existingReport = await ClassReport.findOne({ classNumber: cNum, month, year });

        if (existingReport) {
            existingReport.programs.push(...programs);
            await existingReport.save();
            return NextResponse.json({ message: 'Programs added to existing report successfully', report: existingReport }, { status: 200 });
        } else {
            const newReport = new ClassReport({
                teacherId,
                month,
                year,
                classNumber: cNum,
                section,
                programs
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
            
            reports.forEach(report => {
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
                classMap[key].totalMark += (report.totalMark || 0);
                classMap[key].reportCount += 1;
            });

            const leaderboard = Object.values(classMap).sort((a, b) => b.totalMark - a.totalMark);
            return NextResponse.json(leaderboard);
        }

        // Return all reports
        const reports = await ClassReport.find({})
            .populate('teacherId', 'name')
            .populate('markedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Compute zehnuthPoints for pending reports
        for (let report of reports) {
            if (report.status === 'pending') {
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
                    
                    report.zehnuthPoints = approvedPoints[0]?.total || 0;
                } else {
                    report.zehnuthPoints = 0;
                }
            }
        }

        return NextResponse.json(reports);
    } catch (error) {
        console.error("Error fetching class reports:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
