import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const studentsSchema = new Schema({
    ["FULL NAME"]: {
        type: String,
        required: true
    },
    ["SHORT NAME"]: {
        type: String,
        required: true
    },
    SL: {
        type: Number,
        required: true
    },
    ADNO: {
        type: Number,
        required: true
    },
    CLASS: {
        type: Number,
        required: true
    },
    Status: {
        type: String
    },
    Time: {
        type: String
    },
    Date: {
        type: String,
    },
    Password: {
        type: Number,
        required: true
    },
    onLeave: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

studentsSchema.index({ CLASS: 1 });
studentsSchema.index({ ADNO: 1 });

export default mongoose.models['Student'] || mongoose.model('Student', studentsSchema);
