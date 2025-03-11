import { Router } from "express";
import { register, verifyUser } from "../controller/user.controller.js";

const router = Router();

router.post('/register', register)
router.get('/verify-user/:token', verifyUser)

export default router