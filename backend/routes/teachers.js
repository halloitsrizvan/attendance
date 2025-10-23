const express = require('express');
const router = express.Router();
const {getAllTeacher,getSingleTeacher,createTeacher,deleteTeacher,updateTeacher,loginTeacher,me} = require('../controllers/teachersControls')
const { authTeacherToken } = require('../utils/teacherAuthMiddleware')

//get all Teacher
router.get('/',getAllTeacher)

router.post('/signup',createTeacher)
//login
router.post('/login',loginTeacher)


//get a single Teacher
router.get('/:id',getSingleTeacher)

router.get('/me/profile', authTeacherToken, me)


//delete Teacher
router.delete('/:id',deleteTeacher)

//update Teacher
router.patch('/:id',updateTeacher)

module.exports = router;