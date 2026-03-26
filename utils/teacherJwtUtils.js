const jwt = require('jsonwebtoken')
const { secretKey } = require('../config/jwtConfig')

const generateTeacherToken = (teacher) => {
    const payload = {
        id: teacher._id,
        email: teacher.email,
        name: teacher.name,
        role: teacher.role || 'teacher',
        subjectsTaught: teacher.subjectsTaught
    }
    return jwt.sign(payload, secretKey, { expiresIn: '1h' })
}

const verifyTeacherToken = (token) => {
    return jwt.verify(token, secretKey)
}

module.exports = { generateTeacherToken, verifyTeacherToken }
