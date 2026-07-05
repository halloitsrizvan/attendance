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
    },
    active: {
        type: Boolean,
        default: true
    },
    role: {
        type: [String],
        enum: ['student', 'class', 'lisan', 'StudentAdmin', 'DSC', 'Welfare', 'Sakshi', 'Sibaq', 'Cleaning', 'OGEA', 'Office'],
        default: ['student']
    }
}, { timestamps: true });

studentsSchema.index({ CLASS: 1 });
studentsSchema.index({ ADNO: 1 });

// Ensure role is always an array of strings
studentsSchema.post('init', function(doc) {
    if (doc && typeof doc.role === 'string') {
        doc.role = [doc.role];
    }
});

studentsSchema.pre('save', function(next) {
    if (typeof this.role === 'string') {
        this.role = [this.role];
    }
    next();
});

if (mongoose.models['Student']) {
  delete mongoose.models['Student'];
}

export default mongoose.model('Student', studentsSchema);
