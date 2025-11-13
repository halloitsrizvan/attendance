const Leave = require('../models/leaveModel');
const mongoose = require('mongoose');

// Get all leaves
const getAllLeave = async (req, res) => {
    try {
        const leaves = await Leave.find({}).sort({ createdAt: -1 });
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
        const leave = await Leave.findById(id);
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
        const leave = await Leave.create(req.body);
        res.status(201).json(leave);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Update leave status (mark as returned)
const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Leave not found' });
    }
    
    try {
        const { status } = req.body;
        
        const updateData = {};
        
        if (status === 'returned') {
            updateData.status = 'returned';
            updateData.returnedAt = new Date();
        } else if (status) {
            updateData.status = status;
        }
        
        const leave = await Leave.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!leave) {
            return res.status(404).json({ error: 'Leave not found' });
        }
        
        res.status(200).json(leave);
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
        const leave = await Leave.findByIdAndDelete(id);
        
        if (!leave) {
            return res.status(404).json({ error: 'Leave not found' });
        }
        
        res.status(200).json({ message: 'Leave deleted successfully', leave });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Auto-update leave statuses based on current time
const autoUpdateLeaveStatuses = async (req, res) => {
    try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // Update leaves that should be active
        await Leave.updateMany(
            {
                status: { $in: ['Scheduled', 'active'] },
                $or: [
                    {
                        fromDate: { $lt: currentDate }
                    },
                    {
                        fromDate: currentDate,
                        fromTime: { $lte: currentTime }
                    }
                ],
                $or: [
                    {
                        toDate: { $gt: currentDate }
                    },
                    {
                        toDate: currentDate,
                        toTime: { $gte: currentTime }
                    }
                ]
            },
            { status: 'active' }
        );
        
        // Update leaves that are late (past end time but not returned)
        await Leave.updateMany(
            {
                status: { $in: ['Scheduled', 'active'] },
                $or: [
                    {
                        toDate: { $lt: currentDate }
                    },
                    {
                        toDate: currentDate,
                        toTime: { $lt: currentTime }
                    }
                ]
            },
            { status: 'late' }
        );
        
        res.status(200).json({ message: 'Leave statuses updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get leaves by status
const getLeavesByStatus = async (req, res) => {
    const { status } = req.params;
    
    try {
        const validStatuses = ['Scheduled', 'active', 'late', 'returned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const leaves = await Leave.find({ status }).sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    createLeave,
    getAllLeave,
    getSingleLeave,
    updateLeaveStatus,
    deleteLeave,
    autoUpdateLeaveStatuses,
    getLeavesByStatus
};