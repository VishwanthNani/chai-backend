import mongoose from "mongoose"

const videoSchema=new mongoose.Schema({
    videoFile:{
        type:String,    //cloudinary url
        required:true
    },
    thumbnail:{
        type:String,    //cloudinary url
        required:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,       
        required:true
    },
    duration:{
        type:String,       //cloudinary url
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:boolean,
        default:true
    }
},{timestamps:true})



export const Video=mongoose.model("Video",videoSchema)