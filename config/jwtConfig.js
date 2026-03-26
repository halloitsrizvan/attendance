// Use environment variable or stable fallback key to preserve sessions after server restart
const secretKey = process.env.JWT_SECRET || 'attendance_system_v1_secure_key_2024';

module.exports = { secretKey }
