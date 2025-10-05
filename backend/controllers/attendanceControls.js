const Attendance = require('../models/attendanceModel');
const mongoose = require('mongoose')

// get monthly report
const getMonthlyReport = async (req, res) => {
    try {
        const { month, year, class: classNumber, attendanceTime } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'month and year are required' });
        }

        const monthNum = parseInt(month, 10); // 1-12
        const yearNum = parseInt(year, 10);
        if (Number.isNaN(monthNum) || Number.isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ error: 'Invalid month/year' });
        }

        // attendanceDate is stored as string in format YYYY-MM-DD
        // Build regex for the month
        const monthStr = monthNum.toString().padStart(2, '0');
        const prefix = `${yearNum}-${monthStr}`; // e.g. 2025-09

        const matchFilter = { attendanceDate: { $regex: `^${prefix}-` } };
        if (classNumber !== undefined) {
            const parsedClass = parseInt(classNumber, 10);
            if (!Number.isNaN(parsedClass)) {
                matchFilter.class = parsedClass;
            }
        }
        if (attendanceTime) {
            matchFilter.attendanceTime = attendanceTime;
        }

        const pipeline = [
            { $match: matchFilter },
            {
                $group: {
                    _id: { ad: '$ad', nameOfStd: '$nameOfStd', class: '$class', SL: '$SL' },
                    // NEW: Use $push to get an array of { date, status } pairs
                    attendances: { $push: { date: '$attendanceDate', status: '$status' } },
                    // The counts below are for recorded days only, we'll calculate final totals on frontend
                    present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
                }
            },
            // Update the projection to include the new 'attendances' field
            { $project: { _id: 0, ad: '$_id.ad',  SL: '$_id.SL',nameOfStd: '$_id.nameOfStd', class: '$_id.class', present: 1, absent: 1, late: 1, attendances: 1 } },
            { $sort: { class: 1, nameOfStd: 1 } }
        ];

        const results = await Attendance.aggregate(pipeline);
        res.status(200).json({ month: monthNum, year: yearNum, results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to build monthly report' });
    }
}

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
    updateManyDocs,
    getMonthlyReport
}