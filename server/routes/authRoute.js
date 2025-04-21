import express from 'express';
import { Login, LogOut, SignUp } from '../controllers/authController.js';
import { isLogin } from '../middlewares/isLogin.js';

const authRoute = express.Router();

authRoute.post('login',Login);
authRoute.post('/signup',SignUp);
authRoute.post('/logout',isLogin,LogOut);

export default authRoute;