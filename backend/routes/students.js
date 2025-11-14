const express = require('express');
const router = express.Router();
const {createStudents,
    getAllStudents,
    getSingleStudents,
    deleteStudents,
    updateStudents,
    filterByClass,
    updateManyStudents,loginStudent,me,updateStudentOnLeave} = require('../controllers/studentsControls')
    const { authStudentToken } = require('../utils/studentAuthMiddleware')

//get all Students
router.get('/',getAllStudents)

//filter by class
router.get('/:classId',filterByClass)

//get a single Student
router.get('/:id',getSingleStudents)

//add a Students
router.post('/signup',createStudents)
router.post('/login',loginStudent)
//delete Students
router.get('/me/profile', authStudentToken, me)
router.delete('/:id',deleteStudents)

//update Students
router.patch('/:id',updateStudents)
router.patch('/on-leave/:ad',updateStudentOnLeave) 
router.patch('/bulk-update/students',updateManyStudents)

module.exports = router;