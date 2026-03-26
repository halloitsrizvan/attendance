const Class = require('../models/classes');
const mongoose = require('mongoose')

//get all class
const getAllClass=async(req,res)=>{
    const classes= await Class.find({}).sort({createdAt:-1})

    res.status(200).json(classes)
}

//get a single class
const getSingleClass=async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const classs= await Class.findById(id)
    if(!classs){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(classs)
}


//create a class db
const createClass=async(req,res)=>{
   
    try{
        const classs = await Class.create(req.body);
        res.status(200).json(classs);
        console.log(classs);
    }catch(err){
        res.status(400).json({error:err.message});
    }
}

//delete a class
const deleteClass =async(req,res)=>{
    const {id}= req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const classes=await Class.findByIdAndDelete(id)

    if(!classes){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(classes)


}

//update
const updateClassByClassNumber = async (req, res) => {
    const { classNumber } = req.params; // pass class number in URL
    
    try {
      const classDoc = await Class.findOneAndUpdate(
        { class: Number(classNumber) },
        { ...req.body },
        { new: true } // return updated document
      );
      if (!classDoc) return res.status(404).json({ error: 'Document not found' });
      res.status(200).json(classDoc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

const updateClass = async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }

    const classes=await Class.findByIdAndUpdate({_id:id},{
        ...req.body
    })

    if(!classes){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(classes)
}
module.exports = {
    createClass,
    getAllClass,
    getSingleClass,
    deleteClass,
    updateClass,
    updateClassByClassNumber
}