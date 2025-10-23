const jwt = require('jsonwebtoken')
const { secretKey } = require('../config/jwtConfig')

const generateStudentToken = (student) => {
    const payload = {
        id: student._id,
        adno: student.ADNO,
        name: student["SHORT NAME"],
        class: student.CLASS,
        role: 'student'
    }
    return jwt.sign(payload, secretKey, { expiresIn: '1h' })
}

const verifyStudentToken = (token) => {
    return jwt.verify(token, secretKey)
}

module.exports = { generateStudentToken, verifyStudentToken }
