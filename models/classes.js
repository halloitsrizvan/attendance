import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const classSchema = new Schema({
    class: {
        type: Number,
        required: true
    },
    students_count: {
        type: Number,
        required: true
    },
    teacher: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    totalStudents: Number,
    presentStudents: Number,
    absentStudents: Number,
    percentage: String
}, { timestamps: true });

export default mongoose.models['Classes'] || mongoose.model('Classes', classSchema);
