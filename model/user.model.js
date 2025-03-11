import mongoose, { Schema } from "mongoose";
// zod bhi use kr 

const userSchema = Schema({
    name:{
        type: String, 
        required: true,
        trim:true
    },
    password:{
        type: String,
        required: true
    },
    email:{
        type: String, 
        required: true
    },
    role:{
        type: String,
        enum: ['admin', 'user']
    },
    verficationToken:{
        type:String
    },
    resetPasswordToke:{
        type : String
    },
    resetPasswordExpirt:{
        type: String
    }
},{timestamps: true})

const User = await mongoose.model("User", userSchema)

export default User;