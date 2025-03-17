import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
// zod bhi use kr skte hain fo input validation


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
    isVerified:{
        type: Boolean,
        default: false 
    },
    verficationToken:{
        type:String
    },
    resetPasswordToken:{
        type : String
    },
    resetPasswordExpiry:{
        type: Date
    },
    refreshToken: {
        type : String
    }

},{timestamps: true})


// try with out 
userSchema.pre('save',  async function(next){
    if( this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10)
    }
    next()
})


userSchema.methods.genAccessToken = function (){
    const accessToken = jwt.sign(
        { id: this._id, 
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn:process.env.JWT_EXPIRY
        }    
    )
    return accessToken; 
}

userSchema.methods.genRefreshToken = function (){
    const refreshToken = jwt.sign(
        { id: this._id},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn: '24h'}
    )
    return refreshToken;
}



const User = await mongoose.model("User", userSchema)

export default User;