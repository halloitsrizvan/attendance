const Attendance = require('../models/attendanceModel');
const mongoose = require('mongoose')

//get all attendance
const getAllAttendance=async(req,res)=>{
    const attendance= await Attendance.find({}).sort({createdAt:-1})

    res.status(200).json(attendance)
}

//get a single attendance
const getSingleAttendance=async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const attendance= await Attendance.findById(id)
    if(!attendance){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(attendance)
}


//create a attendance db
const createAttendance=async(req,res)=>{
    
    try{
        const attendance = await Attendance.create(req.body);
        res.status(200).json(attendance);
        console.log(attendance);
    }catch(err){
        res.status(400).json({error:err.message});
    }
}

//delete a attendance
const deleteAttendance =async(req,res)=>{
    const {id}= req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const attendance=await Attendance.findByIdAndDelete(id)

    if(!attendance){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(attendance)


}

//update attendance
const updateAttendance = async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }

    const attendance=await Attendance.findByIdAndUpdate({_id:id},{
        ...req.body
    })

    if(!attendance){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(attendance)
}

const updateManyDocs=async(req,res)=>{
    try {
        const updates = req.body.updates; // array of students
    
        if (!Array.isArray(updates)) {
          return res.status(400).json({ error: "Updates should be an array" });
        }
    
        const bulkOps = updates.map((student) => ({
          updateOne: {
            filter: { _id: student._id },
            update: { $set: { status: student.status } },
          },
        }));
    
        await Attendance.bulkWrite(bulkOps);
    
        res.status(200).json({ message: "Attendance updated successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update attendance" });
      }
}

module.exports = {
    createAttendance,
    getAllAttendance,
    getSingleAttendance,
    deleteAttendance,
    updateAttendance,
    updateManyDocs
}