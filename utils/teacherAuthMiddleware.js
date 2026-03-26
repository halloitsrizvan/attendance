import jwt from 'jsonwebtoken';
import { secretKey } from '../config/jwtConfig';
import Teacher from '../models/teachersModel';

export const getTeacherFromRequest = async (req) => {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Unauthorized: Missing token");
        }
        
        const [bearer, token] = authHeader.split(" ");
        if (bearer !== "Bearer" || !token) {
            throw new Error("Unauthorized: Invalid token format");
        }
        
        const decoded = jwt.verify(token, secretKey);
        
        if (decoded.role !== 'teacher') {
            throw new Error("Forbidden: Invalid token for teacher access");
        }
        
        const teacher = await Teacher.findById(decoded.id);
        if (!teacher) {
            throw new Error("Unauthorized: Teacher not found");
        }
        
        return teacher;
    } catch (err) {
        console.log('[AUTH] Teacher token error:', err.message);
        throw err;
    }
};

// Legacy support for handleNextRequest if needed
export const authTeacherToken = async (req, res, next) => {
    try {
        const teacher = await getTeacherFromRequest({ headers: { get: (n) => req.header(n) } });
        req.teacher = teacher;
        req.user = teacher;
        next();
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};
