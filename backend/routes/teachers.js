const express = require('express');
const router = express.Router();
const {getAllTeacher,getSingleTeacher,createTeacher,deleteTeacher,updateTeacher,loginTeacher,me} = require('../controllers/teachersControls')
const { authToken } = require('../utils/authMiddleware')

//get all Teacher
router.get('/',getAllTeacher)

router.post('/signup',createTeacher)
//login
router.post('/login',loginTeacher)


//get a single Teacher
router.get('/:id',getSingleTeacher)

router.get('/me/profile', authToken, me)


//delete Teacher
router.delete('/:id',deleteTeacher)

//update Teacher
router.patch('/:id',updateTeacher)

module.exports = router;