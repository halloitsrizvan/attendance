import jwt from 'jsonwebtoken';
import { secretKey } from '../config/jwtConfig';
import Student from '../models/studentsModel';
import { NextResponse } from 'next/server';

export const getStudentFromRequest = async (req) => {
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
        
        if (decoded.role !== 'student') {
            throw new Error("Forbidden: Invalid token for student access");
        }
        
        const student = await Student.findById(decoded.id);
        if (!student) {
            throw new Error("Unauthorized: Student not found");
        }
        
        return student;
    } catch (err) {
        console.log('[AUTH] Student token error:', err.message);
        throw err;
    }
};

// Legacy support for handleNextRequest if needed
export const authStudentToken = async (req, res, next) => {
    try {
        const student = await getStudentFromRequest({ headers: { get: (n) => req.header(n) } });
        req.student = student;
        req.students = student;
        next();
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};
