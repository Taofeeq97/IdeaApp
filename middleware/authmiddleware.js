import { jwtVerify } from "jose";
import dotenv from 'dotenv';
dotenv.config();
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token not supplied' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Create secret from environment variable
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        
        // Verify token
        const { payload } = await jwtVerify(token, secret);
        
        // Find user
        const user = await User.findById(payload.userId).select('_id name email');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        
        if (err.code === 'ERR_JWT_EXPIRED') {
            return res.status(401).json({ message: 'Token expired' });
        }
        
        if (err.code === 'ERR_JWS_INVALID') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        return res.status(401).json({ message: 'Not authorized' });
    }
}