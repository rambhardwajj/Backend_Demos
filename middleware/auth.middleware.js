import jwt  from "jsonwebtoken"
export const isLoggedIn = async ( req, res, next ) =>{
    try {
        console.log(req.cookies)
        let token = req.cookies?.accessToken
        // console.log("token" , token)

        if(!token){
            console.log("No token")
            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            })
        }

        try{
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            console.log("decoded" , decoded)
            req.user = decoded
        }catch(error){
            console.log("aut middleware failiure", error)
            return res.status(400).json({success: false, message: "dedcoded mai error"})
        }
    } catch (error) {
        console.log("aut middleware failiure")
        return res.status(400).json({success: false, message: "middleware mai error"})
    }
  next()
}

