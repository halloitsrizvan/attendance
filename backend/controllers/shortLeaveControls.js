const ShortLeave = require('../models/shortLeaveModel');
const mongoose = require('mongoose');

// Get all leaves
const getAllLeave = async (req, res) => {
    try {
        const leaves = await ShortLeave.find({}).sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get a single leave
const getSingleLeave = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Leave not found' });
    }
    
    try {
        const leave = await ShortLeave.findById(id);
        if (!leave) {
            return res.status(404).json({ error: 'Leave not found' });
        }
        res.status(200).json(leave);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Create a leave
const createLeave = async (req, res) => {
    try {
        const leave = await ShortLeave.create(req.body);
        res.status(201).json(leave);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


// Delete a leave
const deleteLeave = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Leave not found' });
    }
    
    try {
        const leave = await ShortLeave.findByIdAndDelete(id);
        
        if (!leave) {
            return res.status(404).json({ error: 'Leave not found' });
        }
        
        res.status(200).json({ message: 'Leave deleted successfully', leave });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



module.exports = {
    createLeave,
    getAllLeave,
    getSingleLeave,
    deleteLeave
};