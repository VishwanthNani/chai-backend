import {asyncHandler} from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"

const registerUser=asyncHandler(async(req,res)=>{
    //take inputs from frontend
    const {userName,email,fullName,password}=req.body
    //validation of inputs
    if([userName,email,fullName,password].some((field)=>field?.trim()===""))
    {
        throw new ApiError(400,"All fields are required")
    }
    //check if user already exists
    const existingUser=await User.findOne({$or:[{userName},{email}]})
    if(existingUser)
    {
        throw new ApiError(409,"User with email or username already exists")
    }
    //check for images, avatar
    const avatarLocalFilePath=req.files?.avatar[0].path;
    const coverImageLocalFilePath=req.files?.coverImage[0].path;
    if(!avatarLocalFilePath)
    {
        throw new ApiError(400,"avatar file is required")
    }
    if(!coverImageLocalFilePath)
    {
        coverImageLocalFilePath=""
    }
    //upload them to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalFilePath)
    const coverImage=await uploadOnCloudinary(coverImageLocalFilePath)
    if(!avatar)
    {
        throw new ApiError(400,"avatar file is required")
    }
    //create user object
    const user=await User.create(
        {
            userName,
            email,
            fullName,
            avatar,
            coverImage,
            password,
        }
    )
    //check object in database
    //remove password,refresh token from user data
    const createdUser=User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) 
    {
        throw new ApiError(500,"Error from server side while registering user")
    }
    //send response
    return res.status(201).json(
        ApiResponse(201,createdUser,"User Registration is successful")
    )
})


export default registerUser