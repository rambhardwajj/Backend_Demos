import mongoose from "mongoose";
import dotenv from "dotenv"
import {DB_URL} from '../constant.js'
dotenv.config()

const connectDB = async () => {
    try {
        console.log(`${DB_URL}`)
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_URL}`)
    } catch (error) {
        console.log('DB not connected', error.message)
    }
}


export default connectDB 