// utils/jwtToken.js
import jwt from 'jsonwebtoken';

/**
 * Signs a JWT for the given userId.
 * @throws {Error} if JWT_SECRET is missing or signing fails.
 */
export function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[ERROR] Missing JWT_SECRET');
    process.exit(1);
  }

  try {
    return jwt.sign(
      { userId },
      secret,
      { algorithm: 'HS256', expiresIn: '30d' }
    );
  } catch (err) {
    console.error('[ERROR] JWT sign failed:', err);
    throw new Error('Token generation error');
  }
}

/**
 * Sets the JWT as an HttpOnly cookie on the response.
 */
export function setAuthCookie(res, token) {
  res.cookie('jwt', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    path: '/'
  });
}

/**
 * High‐level helper: sign a token and set the cookie.
 * @returns {string} the raw JWT.
 */
export default function jwtToken(userId, res) {
  const token = signToken(userId);
  setAuthCookie(res, token);
  return token;
}
