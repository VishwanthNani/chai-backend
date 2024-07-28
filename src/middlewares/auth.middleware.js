import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const verifyJWT=asyncHandler(async(req,_,next)=>{
    try {
        //collect the token
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token)
        {
            throw new ApiError(401,"Unauthorized Request")
        }
        //decode the accesstoken
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        //find the user
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user)
        {
            throw new ApiError(401,"Invalid Access Token")
        }
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})

export default verifyJWT