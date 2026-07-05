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
    disease: {
        type: String,
        default: null
    },
    program: {
        type: String,
        default: null
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false
    },
    ApproveCEP: {
        type: Boolean
    },
    groupId: {
        type: String,
        default: null
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }
}, { timestamps: true });

if (mongoose.models['ClassExcusedPass']) {
  delete mongoose.models['ClassExcusedPass'];
}

export default mongoose.model('ClassExcusedPass', shortLeaveSchema);
