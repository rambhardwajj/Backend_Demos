import express from "express";
import dotenv  from "dotenv";
import connectDB from "./utils/db.js";
import router from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import cors from "cors"

connectDB()
dotenv.config()
const app = express()
const PORT = process.env.PORT || 8080



app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.get('/users', (req, res) => {
    res.send('Server is up and running')
})
app.use('/api/v1/users', router)

app.listen( PORT, () => {
    console.log('listening on port', PORT)
})