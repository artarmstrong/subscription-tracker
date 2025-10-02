import { Router } from "express";
import { signIn, signOut, signUp } from "../controllers/auth.controller.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const authRouter = Router();

// Apply rate limiting to all auth routes
authRouter.use(authLimiter);

// Path: /api/v1/auth
authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-out', signOut);

export default authRouter;