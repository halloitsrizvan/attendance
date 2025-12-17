const Student = require('../models/studentsModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { generateStudentToken } = require('../utils/studentJwtUtils')
//get all students
const getAllStudents = async (req, res) => {
    const students = await Student.find({}).sort({ createdAt: -1 })

    res.status(200).json(students)
}

//filter by class
const filterByClass = async (req, res) => {
    const { classId } = req.params

    const students = await Student.find({ CLASS: classId })

    if (!students) {
        return res.status(404).json({ error: 'such document not fount' })
    }
    res.status(200).json(students)
}


//get a single students
const getSingleStudents = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'such document not fount' })
    }
    const students = await Student.findById(id)
    if (!students) {
        return res.status(404).json({ error: 'such document not fount' })
    }
    res.status(200).json(students)
}


//create a students db
const createStudents = async (req, res) => {
    const { "FULL NAME": fullName, "SHORT NAME": shortName, SL, ADNO, CLASS, Status, Time, Date, Password } = req.body
    const existingStudent = await Student.findOne({ ADNO: ADNO });
    if (existingStudent) {
        return res.status(400).json({ error: "Student already exists" });
    }

    // Convert password to number if it's a string
    const numericPassword = typeof Password === 'string' ? parseInt(Password) : Password;

    if (isNaN(numericPassword)) {
        return res.status(400).json({ error: "Password must be a valid number" });
    }

    try {
        const students = await Student.create({
            "FULL NAME": fullName,
            "SHORT NAME": shortName,
            SL, ADNO, CLASS, Status, Time, Date,
            Password: numericPassword
        });
        const token = generateStudentToken(students)
        res.status(200).json(({
            token,
            students: { id: students._id, name: students["SHORT NAME"], ad: students.ADNO, sl: students.SL }
        }));
        console.log(students);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const loginStudent = async (req, res) => {
    try {
        console.log('[LOGIN] Request body:', req.body);
        const { ADNO, Password } = req.body
        if (!ADNO || !Password) {
            console.log('[LOGIN] Missing credentials');
            return res.status(400).json({ error: 'AD and Password are required' })
        }

        // Convert password to number for comparison
        const numericPassword = typeof Password === 'string' ? parseInt(Password) : Password;
        if (isNaN(numericPassword)) {
            console.log('[LOGIN] Invalid password format');
            return res.status(400).json({ error: "Password must be a valid number" });
        }

        console.log('[LOGIN] Looking for student with ADNO:', ADNO);
        const students = await Student.findOne({ ADNO: ADNO })
        if (!students) {
            console.log('[LOGIN] Student not found for ADNO:', ADNO);
            return res.status(401).json({ error: "Student not found" });
        }
        console.log('[LOGIN] Student found:', students["SHORT NAME"]);
        console.log('[LOGIN] Comparing password...');
        console.log('[LOGIN] Input password:', numericPassword, 'Stored password:', students.Password);

        // Direct numeric comparison instead of bcrypt
        const isPasswordValid = numericPassword === students.Password;
        if (!isPasswordValid) {
            console.log('[LOGIN] Invalid password');
            return res.status(401).json({ error: "Incorrect password" });
        }

        console.log('[LOGIN] Password valid, generating token...');
        const token = generateStudentToken(students);
        console.log('[LOGIN] Token generated successfully');
        res.status(200).json({
            token,
            student: { id: students._id, name: students["SHORT NAME"], ad: students.ADNO, sl: students.SL }
        });
    } catch (err) {
        console.log('[LOGIN] Error:', err.message);
        res.status(401).json({ error: err.message || 'Login failed' });
    }
}

//delete a students
const deleteStudents = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'such document not fount' })
    }
    const students = await Student.findByIdAndDelete(id)

    if (!students) {
        return res.status(404).json({ error: 'such document not fount' })
    }
    res.status(200).json(students)


}

//update
const updateStudents = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'such document not fount' })
    }

    try {
        let updateData = { ...req.body };

        // If password is being updated, convert to number
        if (updateData.Password) {
            const numericPassword = typeof updateData.Password === 'string' ? parseInt(updateData.Password) : updateData.Password;
            if (isNaN(numericPassword)) {
                return res.status(400).json({ error: "Password must be a valid number" });
            }
            updateData.Password = numericPassword;
        }



        const students = await Student.findByIdAndUpdate({ _id: id }, updateData, { new: true });

        if (!students) {
            return res.status(404).json({ error: 'such document not fount' })
        }
        res.status(200).json(students)
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const updateStudentOnLeave = async (req, res) => {
    try {
        const { ad } = req.params
        const { onLeave } = req.body;
        const students = await Student.findOne({ ADNO: Number(ad) })
        if (!students) {
            return res.status(404).json({ error: 'student not found' })
        }
        if (onLeave === true) {
            students.onLeave = true
        } else {
            students.onLeave = false
        }
        await students.save()
        res.status(200).json(students)
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// update many students attendance
const updateManyStudents = async (req, res) => {
    try {
        const { updates } = req.body;
        // updates should be an array of { ADNO, Status, Date, Time }

        const bulkOps = updates.map((u) => ({
            updateOne: {
                filter: { ADNO: u.ADNO },
                update: {
                    $set: {
                        Status: u.Status,
                        Time: u.Time,
                        Date: u.Date

                    }
                }
            }
        }));

        await Student.bulkWrite(bulkOps);

        res.status(200).json({ message: "Students updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};



const updateStudentByAd = async (req, res) => {
    const { ad } = req.params
    try {
        const student = await Student.findOneAndUpdate(
            { ADNO: Number(ad) },
            { $set: req.body },
            { new: true }
        );
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    createStudents,
    getAllStudents,
    getSingleStudents,
    deleteStudents,
    updateStudents,
    filterByClass,
    updateManyStudents,
    loginStudent,
    updateStudentOnLeave,
    updateStudentByAd,
    me: (req, res) => {
        if (!req.students) return res.status(401).json({ error: 'Unauthorized' })
        return res.status(200).json({ students: req.students })
    }
}