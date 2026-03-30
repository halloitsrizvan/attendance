import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const minusSchema = new Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    minusNum:{type: Number},
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }
}, { timestamps: true });

export default mongoose.models['Minus'] || mongoose.model('Minus', minusSchema);
