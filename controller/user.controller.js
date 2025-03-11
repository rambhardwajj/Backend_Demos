import User from '../model/user.model.js'
import crypto from "crypto"
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

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
        return res.stats(400).json({message: 'please fill all the req field'})
    }

    try {
        const existingUser = await User.findOne({email})
        if( existingUser ) return res.stats(400).json({message: 'user already exists'})

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
            from:process.env.MAILTRAP_SENDERMAIL,
            to: user.email,
            subject: "Verify your email", 
            text: `Please click on the ${process.env.BASE_URI}/api/v1/users/verify/${token}`, 
          }

          console.log(mailOptions)
      
          await transporter.sendMail(mailOptions)

          res.status(200).json({
            status: true,
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

    res.status(200).json({
        status: true,
        message: "User verified succesfully"
    })
}

export {register, verifyUser}
