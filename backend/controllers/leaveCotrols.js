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

// Update leave (status or dates/times)
const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Leave not found' });
    }
    
    try {
        const { 
            status, 
            leaveStartTeacher, 
            markReturnedTeacher,
            fromDate,
            fromTime,
            toDate,
            toTime
        } = req.body;
        
        const updateData = {};
        
        // Handle status updates
        if (status === 'returned') {
            updateData.status = 'returned';
            updateData.returnedAt = new Date();
        } else if (status) {
            updateData.status = status;
        }

        // Handle teacher assignments
        if (status === 'active' && leaveStartTeacher) {
            updateData.leaveStartTeacher = leaveStartTeacher;
        }

        if (status === 'returned' && markReturnedTeacher) {
            updateData.markReturnedTeacher = markReturnedTeacher;
        }

        if (leaveStartTeacher && status !== 'active') {
            updateData.leaveStartTeacher = leaveStartTeacher;
        }

        if (markReturnedTeacher && status !== 'returned') {
            updateData.markReturnedTeacher = markReturnedTeacher;
        }

        // Handle date/time updates
        if (fromDate) updateData.fromDate = fromDate;
        if (fromTime) updateData.fromTime = fromTime;
        if (toDate) updateData.toDate = toDate;
        if (toTime) updateData.toTime = toTime;

        // If dates are being updated, we might need to recalculate status
        if (fromDate || fromTime || toDate || toTime) {
            const leave = await Leave.findById(id);
            if (leave) {
                const now = new Date();
                const currentDate = now.toISOString().split('T')[0];
                const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
                
                const effectiveFromDate = fromDate || leave.fromDate;
                const effectiveFromTime = fromTime || leave.fromTime;
                const effectiveToDate = toDate || leave.toDate;
                const effectiveToTime = toTime || leave.toTime;

                // Check if leave should be active
                const isActive = (
                    (effectiveFromDate < currentDate) ||
                    (effectiveFromDate === currentDate && effectiveFromTime <= currentTime)
                ) && (
                    (effectiveToDate > currentDate) ||
                    (effectiveToDate === currentDate && effectiveToTime >= currentTime)
                );

                // Check if leave is late (past end time but not returned)
                const isLate = (
                    (effectiveToDate < currentDate) ||
                    (effectiveToDate === currentDate && effectiveToTime < currentTime)
                );

                if (isActive && leave.status !== 'returned') {
                    updateData.status = 'active';
                } else if (isLate && leave.status !== 'returned') {
                    updateData.status = 'late';
                } else if (!status && (effectiveFromDate > currentDate || 
                    (effectiveFromDate === currentDate && effectiveFromTime > currentTime))) {
                    // If dates are in future and no status provided, set to Scheduled
                    updateData.status = 'Scheduled';
                }
            }
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