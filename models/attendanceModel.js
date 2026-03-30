import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const attendanceSchema = new Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    status: {
        type: String,
        required: true,
    },
    attendanceTime: {
        type: String,
        required: true
    },
    attendanceDate: {
        type: Date,
        required: true
    },
    period: {
        type: Number
    },
    more: {
        type: String
    },
    custom: {
        type: String
    },
    onLeave: {
        type: Boolean,
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    classNumber: {
        type: Number,
        required: true
    }
}, { timestamps: true });

attendanceSchema.index({ attendanceDate: 1, attendanceTime: 1 });
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ classNumber: 1 });

export default mongoose.models['Attendance'] || mongoose.model('Attendance', attendanceSchema);
