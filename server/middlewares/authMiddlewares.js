const express= require('express');
const jwt= require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware= async (req, res, next)=>{
    try{
        const authHeader= req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: "Authorization failed", success: false});
        }

        const token= authHeader.split(' ')[1];
        if(!token){
            return res.status(401).json({success: false, message: "Token missing"})
        }

        // Verify Token
        const decoded= jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.userId= decoded.id;

        const userId= req.userId;
        const user = await User.findById(userId);

        if(!user){
            return res.status(401).json({success: false, message: "User not found"});
        }

        if(!user.isActive){
            return res.status(403).json({success: false, message: "Account is deactivated. Please reactivate/login to continue."});
        }

        return next();
    }catch(error){
        return res.status(500).json({success: false, message: "Error int he Auth Middlewares"})
    }
}

module.exports= {authMiddleware};