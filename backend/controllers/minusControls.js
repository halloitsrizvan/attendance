const Minus = require('../models/minusModel');
const mongoose = require('mongoose')

//get all minus
const getAllMinus=async(req,res)=>{
    const minus= await Minus.find({}).sort({createdAt:-1})

    res.status(200).json(minus)
}

//get a single minus
const getSingleMinus=async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const minus= await Minus.findById(id)
    if(!minus){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(minus)
}


//create a minus db
const createMinus=async(req,res)=>{
   
    try{
        const minus = await Minus.create(req.body);
        res.status(200).json(minus);
        console.log(minus);
    }catch(err){
        res.status(400).json({error:err.message});
    }
}

//delete a minus
const deleteMinus =async(req,res)=>{
    const {id}= req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }
    const minus=await Minus.findByIdAndDelete(id)

    if(!minus){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(minus)


}


const updateMinus = async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:'such document not fount'})
    }

    const minus=await Minus.findByIdAndUpdate({_id:id},{
        ...req.body
    })

    if(!minus){
        return res.status(404).json({error:'such document not fount'})
    }
    res.status(200).json(minus)
}

module.exports = {
    createMinus,
    getAllMinus,
    getSingleMinus,
    deleteMinus,
    updateMinus
}