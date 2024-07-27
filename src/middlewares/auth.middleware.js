import { User } from "../models/user.model";
import ApiError from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

const verifyJWT=asyncHandler(async(req,res)=>{
    try {
        //collect the token
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token)
        {
            throw new ApiError(401,"Unauthorized Request")
        }
        //decode the accesstoken
        const decodedToken=jwt.verify(accessToken,process.env.ACCESS_TOKEN_EXPIRY)
        //find the user
        const user=await User.findById(decodedToken?._id)
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