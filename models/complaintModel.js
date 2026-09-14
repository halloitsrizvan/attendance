import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
        required: false
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    actualStatus: {
        type: String,
        enum: ['Present', 'Leave', 'CEP', 'Other'],
        required: true
    },
    isMedical: {
        type: Boolean,
        default: false
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved', 'Rejected'],
        default: 'Pending'
    },
    adminRemark: {
        type: String
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }
}, { timestamps: true });

if (mongoose.models['Complaint']) {
  delete mongoose.models['Complaint'];
}

export default mongoose.model('Complaint', complaintSchema);
