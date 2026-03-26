const express = require('express');
const router = express.Router();
const {createClass,getAllClass,getSingleClass, deleteClass, updateClass,updateClassByClassNumber} = require('../controllers/classControls')



//get all classes
router.get('/',getAllClass)

//get a single class
router.get('/:id',getSingleClass)

//add a class
router.post('/',createClass)

//delete class
router.delete('/:id',deleteClass)

//update class
router.patch('/:id',updateClass)

//updateClassByClassNumber
router.patch('/by-number/:classNumber',updateClassByClassNumber)
module.exports = router;