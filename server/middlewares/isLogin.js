import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

/**
 * Middleware to protect routes: ensures user is logged in
 */
export const isLogin = async (req, res, next) => {
  try {
    // 1. Retrieve token: from cookie or Authorization header
    let token = req.cookies?.jwt;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token missing' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId || decoded?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    // 3. Fetch user from DB (excluding password)
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 4. Attach user to request and proceed
    req.user = user;
    next();
  } catch (err) {
    console.error('[isLogin Error]', err);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};
