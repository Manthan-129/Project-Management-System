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
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (jwtError) {
            const msg = jwtError.name === 'TokenExpiredError'
                ? 'Token has expired'
                : 'Invalid token';
            return res.status(401).json({success: false, message: msg});
        }
        req.userId= decoded.id;
        // Only fetch the one field we need — not the entire user document
        const user = await User.findById(req.userId).select('isActive').lean();
        if(!user){
            return res.status(401).json({success: false, message: "User not found"});
        }
        if(!user.isActive){
            return res.status(403).json({success: false, message: "Account is deactivated. Please reactivate/login to continue."});
        }
        return next();
    }catch(error){
        return res.status(500).json({success: false, message: "Error in the Auth Middleware"})
    }
}
module.exports= {authMiddleware};