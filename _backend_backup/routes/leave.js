const express = require('express');
const router = express.Router();
const {
    createLeave,
    getAllLeave,
    getSingleLeave,
    updateLeaveStatus,
    deleteLeave,
    autoUpdateLeaveStatuses,
    getLeavesByStatus
} = require('../controllers/leaveCotrols');

// Get all leaves
router.get('/', getAllLeave);

// Get leaves by status
router.get('/status/:status', getLeavesByStatus);
 
// Get a single leave
router.get('/:id', getSingleLeave);

// Create a leave
router.post('/', createLeave);

// Update leave status
router.put('/:id', updateLeaveStatus);

// Auto-update leave statuses
router.patch('/auto-update', autoUpdateLeaveStatuses);

// Delete leave
router.delete('/:id', deleteLeave);

module.exports = router;