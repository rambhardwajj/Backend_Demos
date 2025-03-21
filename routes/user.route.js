import { Router } from "express";
import { register, verifyUser, login, logout, forgotPassword, resetPassword, changePassword, getUserProfile, getNewRefreshToken, refreshAccessToken } from "../controller/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = Router();

router.post('/register', register)
router.get('/verify-user/:token', verifyUser)
router.post('/login', login)
router.get('/logout', isLoggedIn, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/change-password', isLoggedIn,  changePassword)
router.get('/profile', isLoggedIn, getUserProfile)
router.post('/getrefresh-token', isLoggedIn ,getNewRefreshToken )
router.post('/refresh-token', refreshAccessToken)

export default router