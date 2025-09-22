const express = require('express');
const router = express.Router();
const {createAttendance,deleteAttendance,getAllAttendance,getSingleAttendance,updateAttendance, updateManyDocs, getMonthlyReport} = require('../controllers/attendanceControls')



//get all attendance
router.get('/',getAllAttendance)

// monthly report
router.get('/report/monthly', getMonthlyReport)

//get a single attendance
router.get('/:id',getSingleAttendance)

//add a attendance
router.post('/',createAttendance)

//delete attendance
router.delete('/:id',deleteAttendance)

//update attendance
router.patch('/:id',updateAttendance)

//update many docs
router.patch('/',updateManyDocs)
module.exports = router;