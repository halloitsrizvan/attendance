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

        // attendanceDate is stored as Date type
        // Build date range for the month
        const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
        const endDate = new Date(yearNum, monthNum, 1); // First day of next month

        const matchFilter = { 
            attendanceDate: { 
                $gte: startDate,
                $lt: endDate
            } 
        };
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
                    // Convert Date to ISO string for consistent formatting
                    attendances: { 
                        $push: { 
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$attendanceDate' } }, 
                            status: '$status' 
                        } 
                    },
                
                    present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    
                }
            },
            // Update the projection to include the new 'attendances' field
            { $project: { _id: 0, ad: '$_id.ad',  SL: '$_id.SL',nameOfStd: '$_id.nameOfStd', class: '$_id.class', present: 1, absent: 1, attendances: 1 } },
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

// get detailed daily report
const getDetailedDailyReport = async (req, res) => {
    try {
        const { month, year, class: classNumber, attendanceTime } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'month and year are required' });
        }

        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        if (Number.isNaN(monthNum) || Number.isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ error: 'Invalid month/year' });
        }

        // Build date range for the month
        const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
        const endDate = new Date(yearNum, monthNum, 1); // First day of next month

        const matchFilter = { 
            attendanceDate: { 
                $gte: startDate,
                $lt: endDate
            } 
        };
        if (classNumber !== undefined) {
            const parsedClass = parseInt(classNumber, 10);
            if (!Number.isNaN(parsedClass)) {
                matchFilter.class = parsedClass;
            }
        }
        if (attendanceTime) {
            matchFilter.attendanceTime = attendanceTime;
        }

        // Get all attendance records for the month
        const attendanceRecords = await Attendance.find(matchFilter).sort({ 
            class: 1, 
            ad: 1, 
            attendanceDate: 1, 
            attendanceTime: 1,
            period: 1 
        });

        // Group by student
        const studentMap = new Map();
        const availableTimeSlots = new Set();
        
        attendanceRecords.forEach(record => {
            const key = `${record.ad}-${record.class}`;
            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    SL: record.SL,
                    ad: record.ad,
                    nameOfStd: record.nameOfStd,
                    class: record.class,
                    dailyAttendance: new Map()
                });
            }
            
            const student = studentMap.get(key);
            // Convert Date to YYYY-MM-DD string for consistent grouping
            const date = record.attendanceDate instanceof Date 
                ? record.attendanceDate.toISOString().split('T')[0]
                : record.attendanceDate;
            
            if (!student.dailyAttendance.has(date)) {
                student.dailyAttendance.set(date, {});
            }
            
            const dayAttendance = student.dailyAttendance.get(date);
            const timeKey = record.attendanceTime;
            
            if (timeKey === 'Period') {
                const periodNum = record.period || 1;
                if (!dayAttendance.Period) {
                    dayAttendance.Period = {};
                }
                dayAttendance.Period[periodNum] = record.status === 'Present' ? 'P' : 'A';
                availableTimeSlots.add('Period');
            } else {
                dayAttendance[timeKey] = record.status === 'Present' ? 'P' : 'A';
                availableTimeSlots.add(timeKey);
            }
        });

        // Convert to array format and calculate totals
        const results = Array.from(studentMap.values()).map(student => {
            const dailyAttendanceArray = Array.from(student.dailyAttendance.entries()).map(([date, attendance]) => ({
                date,
                ...attendance
            }));

            // Calculate total present and absent across all days and times
            let totalPresent = 0;
            let totalAbsent = 0;
            
            dailyAttendanceArray.forEach(day => {
                Object.values(day).forEach(value => {
                    if (value === 'P') totalPresent++;
                    else if (value === 'A') totalAbsent++;
                    else if (typeof value === 'object' && value !== null) {
                        // Handle Period object
                        Object.values(value).forEach(periodValue => {
                            if (periodValue === 'P') totalPresent++;
                            else if (periodValue === 'A') totalAbsent++;
                        });
                    }
                });
            });

            return {
                ...student,
                dailyAttendance: dailyAttendanceArray,
                present: totalPresent,
                absent: totalAbsent
            };
        });

        res.status(200).json({ 
            month: monthNum, 
            year: yearNum, 
            results,
            availableTimeSlots: Array.from(availableTimeSlots).sort()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to build detailed daily report' });
    }
}

module.exports = {
    createAttendance,
    getAllAttendance,
    getSingleAttendance,
    deleteAttendance,
    updateAttendance,
    updateManyDocs,
    getMonthlyReport,
    getDetailedDailyReport
}