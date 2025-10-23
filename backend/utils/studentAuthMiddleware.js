const jwt = require('jsonwebtoken')
const { secretKey } = require('../config/jwtConfig')
const Student = require('../models/studentsModel')

const authStudentToken = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization")
        if (!authHeader) {
            return res.status(401).json({ msg: "Unauthorized: Missing token" })
        }
        
        const [bearer, token] = authHeader.split(" ")
        if (bearer !== "Bearer" || !token) {
            return res.status(401).json({ msg: "Unauthorized: Invalid token format" })
        }
        
        const decoded = jwt.verify(token, secretKey)
        
        // Check if the token is for a student
        if (decoded.role !== 'student') {
            return res.status(403).json({ msg: "Forbidden: Invalid token for student access" })
        }
        
        // Fetch fresh student data from database
        const student = await Student.findById(decoded.id)
        if (!student) {
            return res.status(401).json({ msg: "Unauthorized: Student not found" })
        }
        
        req.student = student
        req.students = student // For backward compatibility
        next()
    } catch (err) {
        console.log('[AUTH] Student token error:', err.message)
        return res.status(403).json({ msg: "Forbidden: Invalid token" })
    }
}

module.exports = { authStudentToken }
