const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const mongoose = require('mongoose');

// Schemas
const AcademicYearSchema = new mongoose.Schema({
    year: String,
    isActive: Boolean,
    isCurrent: Boolean
}, { timestamps: true });

const TeacherSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: [String],
    classNum: Number,
    active: { type: Boolean, default: true }
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
    'FULL NAME': String,
    ADNO: Number,
    CLASS: Number,
    active: Boolean
}, { timestamps: true });

const AttendanceSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    classNumber: Number
}, { timestamps: true });

const ComplaintSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    actualStatus: String,
    message: String,
    status: String,
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' }
}, { timestamps: true });

const AcademicYear = mongoose.models.AcademicYear || mongoose.model('AcademicYear', AcademicYearSchema);
const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);

async function main() {
    const isDryRun = process.argv.includes('--dry-run');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI is not defined in .env or .env.local');
        process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database successfully.\n');

    try {
        if (isDryRun) {
            console.log('==============================================');
            console.log('       RUNNING IN DRY-RUN MODE (PREVIEW)      ');
            console.log('==============================================\n');
        }

        // 1. Get active academic year
        const activeYear = await AcademicYear.findOne({
            $or: [{ isActive: true }, { isCurrent: true }]
        });

        if (!activeYear) {
            console.warn('WARNING: No active academic year found. Processing complaints without year filter.');
        } else {
            console.log(`Active Academic Year: "${activeYear.year || activeYear._id}" (ID: ${activeYear._id})\n`);
        }

        // 2. Fetch all active teachers and map class teachers
        const teachers = await Teacher.find({ active: { $ne: false } });
        const classTeachersByClass = {};

        teachers.forEach(t => {
            if (t.classNum != null && !isNaN(t.classNum)) {
                classTeachersByClass[Number(t.classNum)] = t;
            }
        });

        console.log('Mapped Class Teachers:');
        Object.keys(classTeachersByClass)
            .sort((a, b) => Number(a) - Number(b))
            .forEach(cls => {
                console.log(`  Class ${cls}: Usthad ${classTeachersByClass[cls].name} (ID: ${classTeachersByClass[cls]._id})`);
            });
        console.log('');

        // 3. Query complaints in current session
        const complaintQuery = activeYear ? { academicYearId: activeYear._id } : {};
        const complaints = await Complaint.find(complaintQuery).sort({ createdAt: -1 });

        console.log(`Found ${complaints.length} total complaints in this academic year session.\n`);

        let countPresentUnchanged = 0;
        let countLeaveUpdated = 0;
        let countCepUpdated = 0;
        let countAlreadyCorrect = 0;
        let countSkipped = 0;

        for (const complaint of complaints) {
            const status = complaint.actualStatus;

            // Rule 1: "if present, no chnages"
            if (status === 'Present') {
                countPresentUnchanged++;
                console.log(`[UNCHANGED] Complaint ${complaint._id}: Reason is 'Present'. Kept existing teacherId.`);
                continue;
            }

            // Rule 2 & 3: "if leave, then class teacher (always for now)", "cep, class teacher"
            if (status === 'Leave' || status === 'CEP') {
                // Find student to determine class
                let student = await Student.findById(complaint.studentId);
                let studentClass = student?.CLASS;

                // Fallback: check attendance record
                if (studentClass == null && complaint.attendanceId) {
                    const att = await Attendance.findById(complaint.attendanceId);
                    studentClass = att?.classNumber;
                }

                if (studentClass == null) {
                    countSkipped++;
                    console.warn(`[SKIPPED] Complaint ${complaint._id}: Could not determine student class for student ${complaint.studentId}`);
                    continue;
                }

                const targetTeacher = classTeachersByClass[Number(studentClass)];
                if (!targetTeacher) {
                    countSkipped++;
                    console.warn(`[SKIPPED] Complaint ${complaint._id}: No class teacher configured for Class ${studentClass}`);
                    continue;
                }

                const prevTeacher = complaint.teacherId ? await Teacher.findById(complaint.teacherId) : null;
                const prevTeacherName = prevTeacher ? prevTeacher.name : (complaint.teacherId ? String(complaint.teacherId) : 'None');

                if (String(complaint.teacherId) === String(targetTeacher._id)) {
                    countAlreadyCorrect++;
                    console.log(`[ALREADY SET] Complaint ${complaint._id}: Already assigned to Class ${studentClass} teacher (Usthad ${targetTeacher.name})`);
                    continue;
                }

                if (status === 'Leave') countLeaveUpdated++;
                if (status === 'CEP') countCepUpdated++;

                console.log(`[UPDATE${isDryRun ? ' - PREVIEW' : ''}] Complaint ${complaint._id} (${status}):`);
                console.log(`  Student: ${student ? student['FULL NAME'] : 'Unknown'} (Class ${studentClass})`);
                console.log(`  Teacher: "${prevTeacherName}" -> Usthad ${targetTeacher.name} (Class ${studentClass} Class Teacher)`);

                if (!isDryRun) {
                    complaint.teacherId = targetTeacher._id;
                    await complaint.save();
                }
            } else {
                countSkipped++;
                console.log(`[SKIPPED] Complaint ${complaint._id}: Unhandled actualStatus '${status}'`);
            }
        }

        console.log('\n==============================================');
        console.log('                   SUMMARY                    ');
        console.log('==============================================');
        console.log(`Total complaints processed: ${complaints.length}`);
        console.log(`Present (No changes):        ${countPresentUnchanged}`);
        console.log(`Leave (Converted to CT):    ${countLeaveUpdated}`);
        console.log(`CEP (Converted to CT):      ${countCepUpdated}`);
        console.log(`Already class teacher:      ${countAlreadyCorrect}`);
        console.log(`Skipped / Warnings:         ${countSkipped}`);
        console.log('==============================================\n');

        if (isDryRun) {
            console.log('Dry run complete. No database changes were applied.');
            console.log('Run without --dry-run to apply these updates: node scripts/update-complaint-teachers.js\n');
        } else {
            console.log('All updates successfully written to the database.\n');
        }
    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected.');
    }
}

main();
