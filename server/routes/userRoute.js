import express from 'express';
import { isLogin } from '../middlewares/isLogin.js';
import { getAllUsers, getUserById, getUserByUsernameOrEmail } from '../controllers/userController.js';

const userRoute = express.Router();

userRoute.get('/',isLogin,getAllUsers);
userRoute.get('/search',getUserByUsernameOrEmail);
userRoute.get('/:id',getUserById)

export default userRoute;