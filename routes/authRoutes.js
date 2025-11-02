import express from 'express'
import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'
import { jwtVerify } from 'jose'
import JWT_SECRET from '../utils/getJwtSecret.js'

const router = express.Router()

const createJWTSecret = () => {
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

router.post('/register', async (req, res, next) => {
    try {
        const {name, email, password} = req.body || {};
        if (!name || !email || !password) {
            res.status(400)
            throw new Error("All Fields are required")
        }

        const existingUser = await User.findOne({email})
        if (existingUser) {
            res.status(400)
            throw new Error ("User with the email already exist")
        }
        const user = await User.create({name, email, password})
        const payload = {
            userId: user._id.toString()
        }

        const accessToken = await generateToken(payload, '7d')
        const refreshToken = await generateToken(payload, '30d')
        res.cookie('refreshToken', refreshToken, {
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none': 'lax',
            maxAge: 30* 24*60*60*1000,
            domain: 'localhost'
        })
        res.status(201).json({
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            },
            message: "User Created successfully"
        })

    } catch (err) {
        console.log('Registration error:', err.message)
        next(err)
    }
})


router.post('/login', async(req, res, next) => {
   try {
     const {email, password} = req.body || {};
    if (!email || !password) {
        res.status(400)
        throw new Error("Both Email and password are required")
    }
    const user = await User.findOne({email})
    if (!user) {
        res.status(401).json({
            message: "Invalid login credentials"
        })
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        res.status(401).json({
            message: "Invalid login credentials"
        })
    }

    const payload = {
        userId: user._id.toString()
    }
    const accessToken = await generateToken(payload, '7d')
    const refreshToken = await generateToken(payload, '30d')
    res.cookie('refreshToken', refreshToken, {
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none': 'lax',
            maxAge: 30* 24*60*60*1000,
            domain: 'localhost'
        })
    res.status(200).json({
        accessToken,
        user: {
            id: user._id,
            email: user.email,
            name: user.name
        },
        message: "Login Successfull"
    })
    
   } catch (err) {
    next(err)
   }
})

router.post('/refresh', async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not provided"
            });
        }

        console.log('refresh token', refreshToken);

        // Create the secret here
        const secret = createJWTSecret();
        const { payload } = await jwtVerify(refreshToken, secret);
        
        console.log('payload', payload);
        
        if (!payload || !payload.userId) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const newAccessToken = await generateToken({ userId: user._id.toString() }, '1m');
        
        res.status(200).json({
            accessToken: newAccessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });

    } catch (err) {
        console.error('Refresh token error:', err);
        return res.status(401).json({
            message: "Invalid refresh token"
        });
    }
});

router.post('/logout', async (req, res, next) => {
    res.clearCookie('refreshToken', {
        httpOnly:true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    })

    res.status(200).json({
        message: "Logged out successfully"
    })
})
export default router