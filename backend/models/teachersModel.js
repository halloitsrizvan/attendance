const mongoose = require('mongoose');

const Schema = mongoose.Schema

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
    phone: {
        type: Number,
        required: false
    },
    joinedAt:{
        type: String,
        required:true,
        defalut:new Date()
    },
    active:{
        type:Boolean,
        required:true,
        default:true
    },
    tId:{
        type:String
    },
    role:{
        type:String,
        required:true,
        default:"teacher"
    },
    subjectsTaught:[
        {
            class:{
                type:Number
            },
            subject:{
                type:String
            }
        }
    ]

},{timestamps:true})

module.exports = mongoose.model('Teacher',teacherSchema);