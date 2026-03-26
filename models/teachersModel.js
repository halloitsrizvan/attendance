import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: Number,
        required: false
    },
    joinedAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    active: {
        type: Boolean,
        default: true
    },
    tId: {
        type: String
    },
    role: {
        type: String,
        default: "teacher"
    },
    subjectsTaught: [
        {
            class: {
                type: Number
            },
            subject: {
                type: String
            }
        }
    ],
    classNum: {
        type: Number
    }
}, { timestamps: true });

export default mongoose.models['Teacher'] || mongoose.model('Teacher', teacherSchema);
