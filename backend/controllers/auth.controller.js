import  {genTokenAndSetCookie} from "../genToken/genTokenAndCookie.js";
import {User} from "../modal/user.modal.js";
import { redis } from "../db/redis.js";
import jwt from 'jsonwebtoken';

const refreshTokenStore = async (userId,refreshToken) => {
    await redis.set(`refreshToken:${userId}`,refreshToken,"EX",7*24*60*60)
}
const setCookie = (res,accessToken,refreshToken)=>{
res.cookie("access-token", accessToken, {
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:"strict",
    maxAge: 15*60*1000
})
res.cookie("refresh-token", refreshToken, {
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:"strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 
})
}
export const signupController = async(req,res)=>{
    const {name,email,password} = req.body;
    try {
        if(!name || !email || !password){
           return res.status(400).json({success:false, message:"All fields required"})
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if(!emailRegex){
           return res.status(400).json({success:false, message:"Invalid email format"})
        }
        const existingUser = await User.findOne({name:name});
        if(existingUser){
           return res.status(400).json({success:false, message:"user exists"})
        }
        const existingEmail = await User.findOne({email:email});
        if(existingEmail){
           return res.status(400).json({success:false, message:"email already taken"})
        }
        const user = await User.create({ name, email, password})

        const {accessToken, refreshToken}=genTokenAndSetCookie(user._id)
        await refreshTokenStore(user._id, refreshToken)
        setCookie(res, accessToken, refreshToken)
        res.status(200).json({user:{
            _id:user._id,
            name:user.name,
            email:user.email,
            role:user.role,
        }, message: "user created succesful"})
    } catch (error) {
        res.status(500).json({message:error.message})
    }

}
export const loginController = async(req,res)=>{
    try {
        const { email, password} = req.body;
        const user = await User.findOne({email});
        if(user && (await user.comparePassword(password))){
            const {accessToken, refreshToken}=genTokenAndSetCookie(user._id)
            await refreshTokenStore(user._id, refreshToken)
            setCookie(res, accessToken, refreshToken)
            res.status(200).json({user:{
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
            }, message: "login successful"})
        }
        else{
            res.status(401).json({message:"invalid credentials"})
        }
    } catch (error) {
        console.log("error in login functionality", error.message);
        res.status(500).json({message:"server error", error:error.message})
    }
}
export const logoutController = async(req,res)=>{
    try {
        const refreshToken = req.cookies['refresh-token'];
        if(refreshToken){
            const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)
            await redis.del(`refreshToken:${decoded.userId}`)
    }
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
    res.status(200).json({success:true, message:"logout successful"})
    } catch (error) {
      res.status(500).json({message:"server error", error:error.message})  
    }
}

export const refreshTokenController = async (req, res) => {
    
    try {
        const refreshToken = req.cookies['refresh-token'];
        
        if(!refreshToken){
            return res.status(401).json({message:"no refresh token provided"})
        }
        console.log("Received refresh token:", refreshToken);
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);
        
        if(storedToken !== refreshToken){
            return res.status(403).json({message:"invalid refresh token"})
        }
        console.log("test2");
        const {accessToken, refreshToken:newRefreshToken} = genTokenAndSetCookie(decoded.userId);
        await refreshTokenStore(decoded.userId, newRefreshToken);
        setCookie(res, accessToken, newRefreshToken);
        res.status(200).json({accessToken, message:"token refreshed"});
        console.log("test3");
        
    } catch (error) {
        console.log("error in refresh token functionality", error.message);
        res.status(500).json({message:"server error", error:error.message});
    }
}

export const getProfileController = async (req, res) => {
    try {
        res.json({user:req.user});
    } catch (error) {
        console.log("error in get profile functionality", error.message);
        res.status(500).json({message:"server error", error:error.message});
    }
}