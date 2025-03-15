import { Router } from "express";
import { register, verifyUser, login, logout, forgotPassword, resetPassword, changePassword, getUserProfile } from "../controller/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = Router();

router.post('/register', register)
router.get('/verify-user/:token', verifyUser)
router.post('/login', login)
router.get('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/change-password', changePassword)
router.get('/profile', isLoggedIn, getUserProfile)

export default router
