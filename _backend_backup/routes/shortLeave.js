const express = require('express');
const router = express.Router();
const {
    createLeave,
    getAllLeave,
    getSingleLeave,
    deleteLeave,
} = require('../controllers/shortLeaveControls');

// Get all leaves
router.get('/', getAllLeave);

// Get a single leave
router.get('/:id', getSingleLeave);

// Create a leave
router.post('/', createLeave);

// Delete leave
router.delete('/:id', deleteLeave);

module.exports = router;