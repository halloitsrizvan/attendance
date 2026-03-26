const jwt = require('jsonwebtoken')
const { secretKey } = require('../config/jwtConfig')
const Teacher = require('../models/teachersModel')

const authTeacherToken = async (req, res, next) => {
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
        
        // Check if the token is for a teacher
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ msg: "Forbidden: Invalid token for teacher access" })
        }
        
        // Fetch fresh teacher data from database
        const teacher = await Teacher.findById(decoded.id)
        if (!teacher) {
            return res.status(401).json({ msg: "Unauthorized: Teacher not found" })
        }
        
        req.teacher = teacher
        req.user = teacher // For backward compatibility
        next()
    } catch (err) {
        console.log('[AUTH] Teacher token error:', err.message)
        return res.status(403).json({ msg: "Forbidden: Invalid token" })
    }
}

module.exports = { authTeacherToken }
