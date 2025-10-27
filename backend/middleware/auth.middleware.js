import jwt from 'jsonwebtoken';
import { User } from '../modal/user.modal.js';
export const protectRoute = async (req,res,next) => {
    try {
        const accessToken = req.cookies['access-token'];
        
        if(!accessToken){
            return res.status(400).json({message:"unauthorized"})
        }
        try {
            const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
            const user = await User.findById(decoded.userId).select("-password");
            
        if(!user){
            return res.status(401).json({message:"user not found"})
        }
        req.user = user;
        next()
        } catch (error) {
          if (error.name === "TokenExpiredError") {
            return res.status(400).json({message:"Unauthorized Token - Access Token expired"})
          } 
          throw error 
        }
    } catch (error) {
        console.log("Error in protectRoute middleware", error.message);
        return res.status(400).json({message:"Unauthorized Token No token provided"});
    }
}

export const adminRoute = async (req,res,next) => {
    if(req.user && req.user.role === "admin"){
        return next()
    }
    else
        return res.status(400).json({message:"Unauthorized - Admin only"})
}