import {asyncHandler} from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken=async(user_id)=>{
    try {
        const user=await User.findById(user_id)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
    
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Access and Refresh Tokens")
    }
}

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
    // if(!coverImageLocalFilePath)
    // {
    //     coverImageLocalFilePath=""
    // }
    //upload them to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalFilePath)
    const coverImage=await uploadOnCloudinary(coverImageLocalFilePath)
    console.log(avatar)
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
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            password,
        }
    )
    //check object in database
    //remove password,refresh token from user data
    const createdUser=await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) 
        {
            throw new ApiError(500,"Error from server side while registering user")
        }
        //send response
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        )
})

const loginUser=asyncHandler(async(req,res)=>{
    //get data from req
    console.log(req.body)
    const {userName,password,email}=req.body
    console.log(userName)
    //validate data username or email
    if(!(userName||email))
    {
        throw new ApiError(400,"username or password is required")
    }
    //find the user
    const user=await User.findOne({$or:[{userName,email}]})
    if(!user)
    {
        throw new ApiError(401,"User not registered,register to continue")
    }
    //check password
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid)
    {
        throw new ApiError(401,"Password Incorrect,Enter correct password")
    }
    //generate refresh and access tokens
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    //send cookies
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    const options=
    {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
        new ApiResponse(202,{user:loggedInUser,refreshToken,accessToken},"Successfully logged in")
    )
})

const logoutUser=asyncHandler(async(req,res)=>{
    //delete refresh token in both cookies and database 
    const user=User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:
            {
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const options={
        httponly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponse(200,{},"Successfully log out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    //get refresh token from body
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Invalid Autharization")
    }
    //decode it
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    //find the user
    const user=await User.findById(decodedToken?._id)
    if(!user)
    {
        throw new ApiError(401,"Invalid Refresh Token")
    }
    //check refreshtokens
    console.log(user)
    console.log(user?.refreshToken,"\n")
    console.log(incomingRefreshToken)
    if(user?.refreshToken!==incomingRefreshToken)
    {
        throw new ApiError(401,"Refresh Token is expired or used")
    }
    //generate refreshtoken and accesstoken
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    //send in cookie
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    const options=
    {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("refreshToken",newRefreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(200,{user:loggedInUser,accessToken,newRefreshToken},"Access Token refreshed successfully"))
})


export  {
    registerUser,
    generateAccessAndRefreshToken,
    loginUser,
    logoutUser,
    refreshAccessToken
}