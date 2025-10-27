import express from 'express';
import { loginController, signupController, logoutController, refreshTokenController, getProfileController } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const Router = express.Router();

Router.post('/login',loginController);
Router.post('/signup',signupController);
Router.post('/logout',logoutController);
Router.post('/refresh-token',refreshTokenController);
Router.get('/user', protectRoute, getProfileController);

export default Router;