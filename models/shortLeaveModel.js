import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const shortLeaveSchema = new Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    fromTime: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    toTime: {
        type: String,
        required: true
    },
    date: { type: Date },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }
}, { timestamps: true });

export default mongoose.models['ClassExcusedPass'] || mongoose.model('ClassExcusedPass', shortLeaveSchema);
