const jwt = require('jsonwebtoken')
const { secretKey } = require('../config/jwtConfig')

const generateKey =(user)=>{
    const payload={
        id:user._id,
        adno:user.ADNO,
        name:user["SHORT NAME"],
        class:user.CLASS,
        role:'student'
    }
    return jwt.sign(payload,secretKey,{expiresIn:'1h'})
}

module.exports ={generateKey}