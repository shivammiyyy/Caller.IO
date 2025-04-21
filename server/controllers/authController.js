import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwtToken from "../utils/jwtToken.js";

// Sign Up Controller
export const SignUp = async (req, res) => {
  try {
    const { fullname, username, email, password, gender, profilepic } = req.body;

    // Validate input
    if (!fullname || !username || !email || !password || !gender) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check for existing user by email or username
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username or email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine default avatar
    const defaultAvatar = `https://avatar.iran.liara.run/public/${gender === 'male' ? 'boy' : 'girl'}?username=${username}`;
    const avatarUrl = profilepic || defaultAvatar;

    // Create user
    const newUser = new User({ fullname, username, email, password: hashedPassword, gender, profilepic: avatarUrl });
    await newUser.save();

    // Generate JWT token
    const token = jwtToken(newUser._id);

    // Set cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Respond with user info
    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        profilepic: newUser.profilepic,
      },
    });
  } catch (err) {
    console.error('[SignUp Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Login Controller
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwtToken(user._id);

    // Set cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Respond with user info
    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        profilepic: user.profilepic,
      },
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Logout Controller
export const LogOut = (req, res) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return res.status(200).json({ success: true, message: "User logged out successfully" });
  } catch (err) {
    console.error('[LogOut Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
