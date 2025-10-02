import { Router } from "express";
import { signIn, signOut, signUp } from "../controllers/auth.controller.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const authRouter = Router();

// Path: /api/v1/auth
authRouter.post('/sign-up', authLimiter, signUp);
authRouter.post('/sign-in', authLimiter, signIn);
authRouter.post('/sign-out', authLimiter, signOut);

export default authRouter;