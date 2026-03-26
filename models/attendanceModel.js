import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    nameOfStd: {
        type: String,
        required: true
    },
    ad: {
        type: Number,
        required: true
    },
    class: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
    },
    SL: {
        type: Number,
        required: true
    },
    attendanceTime: {
        type: String,
        required: true
    },
    attendanceDate: {
        type: Date,
        required: true
    },
    teacher: {
        type: String,
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
    }
}, { timestamps: true });

attendanceSchema.index({ attendanceDate: 1, class: 1, attendanceTime: 1 });
attendanceSchema.index({ ad: 1, class: 1 });

export default mongoose.models['Attendance'] || mongoose.model('Attendance', attendanceSchema);
