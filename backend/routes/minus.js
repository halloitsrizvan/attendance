const express = require('express');
const router = express.Router();
const { createMinus,
    getAllMinus,
    getSingleMinus,
    deleteMinus,
    updateMinus} = require('../controllers/minusControls')



//get all minus
router.get('/',getAllMinus)

//get a single minus
router.get('/:id',getSingleMinus)

//add a minus
router.post('/',createMinus)

//delete minus
router.delete('/:id',deleteMinus)

//update minus
router.patch('/:id',updateMinus)

module.exports = router;