import User from '../model/user.model.js'
import crypto from "crypto"
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"

dotenv.config()

async function generateAccessAndRefreshToken( userId ){
    try {
        // more secure 
        const user = await User.findById(userId) // extra db call
        const accessToken = user.genAccessToken()
        const refreshToken = user.genRefreshToken();

        user.refreshToken = refreshToken 
        await user.save()
        // console.log("tokens", refreshToken, accessToken )
        return {refreshToken, accessToken, user};
    } catch (error) {
        res.status(400).json({message: "refresh token error"})
    }
    
}

const register = async(req , res)=>{
    // get data
    // validation
    // if exists - give error 
    // if not register in db
    // verificatin token pass in email 
    // send token as email to user
    // send success message

    const {name, email, password} = req.body
    if( !name || !email || !password ){
        return res.status(400).json({message: 'please fill all the req field'})
    }

    try {
        const existingUser = await User.findOne({email})
        if( existingUser ) return res.status(400).json({message: 'user already exists'})

        const user = await User.create({name, email,password}) // 

        if( !user) {
            return res.status(400).json({
                message:'Error User not created'
            })
        }

        const token = crypto.randomBytes(32).toString('hex')
        console.log("token : ", token)

        user.verficationToken = token

        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, 
            auth: {
              user: process.env.MAILTRAP_USERNAME,
              pass: process.env.MAILTRAP_PASSWORD,
            },
          });
      
          const mailOptions = {
            from: process.env.MAILTRAP_SENDERMAIL,
            to: user.email,
            subject: "Verify Your Email",
            html: `
              <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto; background-color: #f9f9f9;">
                <h2 style="color: #333;">Verify Your Email</h2>
                <p style="color: #555;">Please click the button below to verify your email and access your account.</p>
                <a href="http://localhost:5173/verify/${token}" 
                   style="display: inline-block; padding: 12px 24px; color: white; background-color: #28a745; 
                          text-decoration: none; font-size: 16px; border-radius: 5px; margin-top: 10px;">
                  Go to Login
              </div>
            `
          }; 
{/* <a href="${process.env.BASE_URI}/api/v1/users/verify-user/${token}"  */}
          console.log(mailOptions)
      
          await transporter.sendMail(mailOptions)

          return res.status(200).json({
            success: true,
            message: "User created succesfully"
          })
    } catch (error) {
        console.log(error)
        return res.status(400).json({message: 'error', error})
    }
}

const verifyUser = async(req,res)=>{
    // get token via url 
    // validation 
    // find user based on token
    // if found => isVerified ko true krdenge
    // remove verification token 
    // save 
    // success message 

    const {token} = req.params;
    if(!token){
        return res.status(400).json({
            message: 'Token not found '
        })
    }
    const user = await User.findOne({verficationToken:token})
    console.log(token)
    if( !user ){
        console.log(user)
        return res.status(400).json({
            message: 'Invalid token'
        })
    }
    
    user.isVerified = true;
    user.verificationToken = undefined
    await user.save()

    return res.status(200).json({
        status: true,
        message: "User verified succesfully"
    })
}

const login = async(req, res) =>{
    // get data
    // validations 
    // get user data

    // password match
    // generate token 
    // store the token in cookie 
    // success message
    
    const {email,password} = req.body
    if( !email ||  !password){
        success : false
        return res.status(400).json({message: "email and password are required"})
    }

    try {
        const user = await User.findOne({email});
        if( !user) return res.status(400).json({message: "Invalid email or password", success: false})
        const isMatched = await bcrypt.compare( password, user.password)
        if( !user.isVerified ){
            return res.status(400).json({message: "user not verified"})
        }
        if( !isMatched ){
            return res.status(400).json({message: "invalid cred", isMatched})
        }

        console.log(user)
        const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)
        console.log('login tokens', refreshToken, accessToken)
        const cookieOptions = {
            httpOnly : true,
            secure: true,
            maxAge: 24 * 60* 60* 1000
        }

        res
        .cookie('refreshToken', refreshToken, cookieOptions)
        .cookie('accessToken', accessToken, cookieOptions)
        .status(200)
        .json({
            success: true,
            message: "user login success"
        })

    } catch (error) {
        console.log(error)
        return res.status(400).json({message: 'login failed ', error: error.message})
    }
}

const logout = async(req, res)=>{
    const user = req.user
    if( !user ){
        return res.status(400).json({success:false, message: 'User not exists '})
    }
    
    const userId = user.id

    const userInDB = await User.findById(userId);

    if( !userInDB){
        return res.status(400).json({message: "userInDB undef hai"})
    }

    userInDB.refreshToken = undefined;
    await userInDB.save()

    // delete cookie
    try {
        if(!req.cookies?.refreshToken ||  !req.cookies?.accessToken){
            return res.status(400).json({success:false, message: 'User not logged in'})
        }
        res.clearCookie('accessToken').clearCookie('refreshToken').status(200).json({
            success: true,
            message: "User logged out successfully"
        })
    } catch (error) {
        res.status(400).json({message: "failed"})
        console.log(error)
    }

}

const getNewRefreshToken = async(req, res)=>{
    try {
        const refToken = req.cookies.refreshToken;
        if( !refToken){
            return res.status(401).json({success: false, message: "refresh token missing bro"})
        }

        const decoded = jwt.verify(refToken, process.env.JWT_REFRESH_SECRET)
        const userId = decoded.id;        
        const user = await User.findById(userId)

        if(!user){
            return res.status(400).json({
                success: false, message: 'user not found'
            })
        }
        
        const { refreshToken, accessToken} = generateAccessAndRefreshToken(userId)

        const cookieOptions = {
            httpOnly: true, secure: true, maxAge: 24*60*60*1000
        }

        res.cookie("refreshToken", refreshToken, cookieOptions )
        res.cookie("accessToken", accessToken, cookieOptions)

        res.status(200).json({
            success: true, 
            accessToken, 
            message: "new access token generated"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Failed to refresh token", error: error.message });
    }
}

const refreshAccessToken = async(req, res)=>{
    // user ki details nikalenge decoded se ( middleware )
    // user ki cookie  access token 
    const currToken = req.cookies.refreshToken
    try {
        const decoded = jwt.verify(currToken, process.env.JWT_REFRESH_SECRET)
        const userId = decoded.id

        const user = await User.findById(userId)

        if( user.refreshToken !== currToken){
            console.log("Comparing ", user.refreshAccessToken, currToken)
            return res.status(400).json({message: "session expired"})
        }
        
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        user.refreshAccessToken  = refreshToken;
        await user.save();

        const cookieOptions = {
            httpOnly: true, secure: true, maxAge: 24*60*60*1000
        }

        res.cookie("refreshToken", refreshToken, cookieOptions )
        res.cookie("accessToken", accessToken, cookieOptions)

        res.status(200).json({
            success: true, 
            accessToken, 
            message: "new refresh token generated"
        })

    } catch (error) {
        return res.status(500).json({message: "error in refreshAccessToken"})
    }
}

const forgotPassword = async(req, res) =>{
    // forgot -> reset -> change pass
    // forgotPassword
   
   const {email } = req.body
   if( !email ) {
        return res.status(400).json({ message: "email is requred"})
   }

   try {
        const user = await User.findOne({email})
        if( !user ) {
            return res.status(400).json({message: "User not found"})
        }

        const token = crypto.randomBytes(32).toString('hex')

        user.resetPasswordToken = token;
        user.resetPasswordExpiry = Date.now() + 10*60*1000 
        
        await user.save()

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, 
            auth: {
              user: process.env.MAILTRAP_USERNAME,
              pass: process.env.MAILTRAP_PASSWORD,
            },
          });
      
          const mailOptions = {
            from:process.env.MAILTRAP_SENDERMAIL,
            to: user.email,
            subject: "Password reset link", 
            text: `Please click on the ${process.env.BASE_URI}/api/v1/users/reset-password/${token}`, 
          }

          console.log(mailOptions)
      
          await transporter.sendMail(mailOptions)

          res.status(200).json({message: "Password reset link sent"})

   } catch (error) {
        console.log(error);
        res.status(500).json({message: " Something went wrong in forgot password BE code "})
   }

}

const resetPassword = async(req,res) =>{
    // token 
    // use se pass lenge 
    // use db mai pass ko overide  User.find(resr : token , $gt: abhi ka date hai)
    const { token } = req.params;
    const { password } = req.body;

    if(!password || !token ) {
        // token ka recheck in docs
        return res.status(400).json({message: "password is required"})
    }
    try {
        // confirm from  docs $gt wala
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiry: {$gt: Date.now()} })
        if( !user){
            return res.status(400).json({message: "user does not exists"})
        }
        user.isVerified = true;
        user.password = password;
        user.resetPasswordToken = undefined
        user.resetPasswordExpiry = undefined
        await user.save();
        res.status(200).json({message: " reset successfull"})
    } catch (error) {
        console.log( error)
        res.status(500).json({message: ' error in resetPassword'})
    }
}

const changePassword = async(req, res) =>{
    // old and new lenge
    // user nikal ke user lo naya pass daaldenge or kya
    // aur kuch krna hai kya Saurav??
    // 
    const {oldPass, newPass} = req.body;
    if( !oldPass || !newPass) return res.json({message: "dono old and new chaiye "})
    try {
        // pehele oldPass ko hash kro aur fir doondho 
        const {token} = req.cookies
        const {id} = jwt.verify(token, process.env.JWT_SECRET )
        
        const user = await User.findById(id)
        if( !user) return res.status(400).json({message: "User is not logged in"})
        
        const isMatched = await bcrypt.compare( oldPass, user.password)

        if( !isMatched){
            return res.status(400).json({message: "password is not matching "})
        }
        
        user.password = newPass;

        await user.save();
        res.status(200).json({message: "The password has been changed "})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Error in changePassword "})
    }
}

const getUserProfile = async(req,res) =>{
    try {
        const user = await User.findById(req.user.id).select('-password')
        if( !user){
            return res.status(400).json({
                success:false,
                message: "User djoe found"
            })
        }
        console.log(user)
        return res.status(200).json({
            success: true,
            user,
            message:"user dedo"
        })
    } catch (error) {
        console.log(error, "in get me wala")
        return res.status(400).json({
            success:false,
            message: "error in getUser "
        })
    }
}

export {register, verifyUser, login, logout, forgotPassword, resetPassword, changePassword, getUserProfile, getNewRefreshToken, refreshAccessToken}
