import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const programSchema = new Schema({
    category: {
        type: String,
        required: true,
        enum: ['Curriculum', 'Co-Curriculum', 'Extra-Curriculum']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    mark: {
        type: Number,
        default: 0
    },
    poster: {
        type: String
    },
    gallery: [{
        type: String
    }],
    date: {
        type: String
    }
});

const classReportSchema = new Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    classNumber: {
        type: Number,
        required: true
    },
    section: {
        type: String,
        required: true,
        enum: ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior']
    },
    programs: [programSchema],
    totalMark: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: 'pending' // For when admin reviews it later
    }
}, { timestamps: true });

if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.ClassReport;
}

export default mongoose.models.ClassReport || mongoose.model('ClassReport', classReportSchema);
