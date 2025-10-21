import { Router } from "express";

import authorize from '../middlewares/auth.middleware.js';
import { getUser, getUsers, createUser, deleteUser } from "../controllers/user.controller.js";
import { userLimiter } from "../middlewares/rateLimit.middleware.js";

const userRouter = Router();

// Apply rate limiting to all user routes
userRouter.use(userLimiter);

userRouter.get('/', authorize, getUsers);
userRouter.get('/:id', authorize, getUser);
userRouter.post('/', authorize, createUser);
userRouter.put('/:id', (req, res) => res.send({ title: 'UPDATE user'}));
userRouter.delete('/:id', authorize, deleteUser);

export default userRouter;