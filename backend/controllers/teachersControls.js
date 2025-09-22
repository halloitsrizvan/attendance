const Teacher = require('../models/teachersModel')
const mongoose = require('mongoose')
const bcrypt =require('bcrypt')
const { generateKey } = require('../utils/jwtUtils')

//get all teachers
const getAllTeacher=async(req,res)=>{
    const teachers= await Teacher.find({}).sort({createdAt:-1})

    res.status(200).json(teachers)
}

//get a single teacher
const getSingleTeacher=async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const teachers= await Teacher.findById(id)
    if(!teachers){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(teachers)
}


//create a teacher db
const createTeacher=async(req,res)=>{
    const {password,email,name,phone,joinedAt,active,tId,role,subjectsTaught} = req.body

    const existingTeacher = await Teacher.findOne({ email: email });
    if (existingTeacher) {
        return res.status(400).json({ error: "Email already exists" });
      }
      const hashedPassword =await bcrypt.hash(password,10)

    try{
        const teacher = await Teacher.create({password:hashedPassword,email,name,phone,joinedAt,active,tId,role,subjectsTaught});
        const token = generateKey(teacher)
        res.status(200).json(({
            token,
            teacher: { id: teacher._id, name: teacher.name, email: teacher.email, role: teacher.role ,subjectsTaught:teacher.subjectsTaught}
          }));
        console.log(teacher);
    }catch(err){
        res.status(400).json({error:err.message});
    }
}
//login teacher
const loginTeacher=async(req,res)=>{
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
          }
        const teacher = await   Teacher.findOne({email:email})
        if (!teacher) {
            console.log('[LOGIN] user not found');
            return res.status(401).json({ error: "User not found" });
          }
          const isPasswordValid = await bcrypt.compare(password, teacher.password);
    
          if (!isPasswordValid) return res.status(401).json({ error: "Incorrect password" });
      
          const token = generateKey(teacher);
         
          res.status(200).json({
            token,
            teacher:{ id: teacher._id, name: teacher.name, email: teacher.email, role: teacher.role ,subjectsTaught:teacher.subjectsTaught}
          });  
    }catch(err){
        res.status(401).json({ error: err.message || 'Login failed' });
    }
}

//delete a teachers
const deleteTeacher =async(req,res)=>{
    const {id}= req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const teacher=await Teacher.findByIdAndDelete(id)

    if(!teacher){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(teacher)


}

//update
const updateTeacher = async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const {password,email,name,phone,joinedAt,active,tId,role,subjectsTaught} = req.body
    const hashedPassword =await bcrypt.hash(password,10)
    const teacher=await Teacher.findByIdAndUpdate({_id:id},{
        password:hashedPassword,email,name,phone,joinedAt,active,tId,role,subjectsTaught
    })

    if(!teacher){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(teacher)
}

module.exports = {
    createTeacher,
    getAllTeacher,
    getSingleTeacher,
    deleteTeacher,
    updateTeacher,
    loginTeacher,
    me: (req, res) => {
        // requires authToken middleware to set req.user
        if (!req.teacher) return res.status(401).json({ error: 'Unauthorized' })
        return res.status(200).json({ teacher: req.teacher })
    }
}