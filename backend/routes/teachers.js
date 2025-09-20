const express = require('express');
const router = express.Router();
const {getAllTeacher,getSingleTeacher,createTeacher,deleteTeacher,updateTeacher} = require('../controllers/teachersControls')


//get all Teacher
router.get('/',getAllTeacher)

//get a single Teacher
router.get('/:id',getSingleTeacher)

//add a Teacher
router.post('/signup',createTeacher)

//delete Teacher
router.delete('/:id',deleteTeacher)

//update Teacher
router.patch('/:id',updateTeacher)

module.exports = router;