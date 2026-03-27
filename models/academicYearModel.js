import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.models.AcademicYear || mongoose.model('AcademicYear', academicYearSchema);
