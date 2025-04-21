import User from "../models/userModel.js";

/**
 * Get all users except the current authenticated user
 */
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const users = await User.find(
      { _id: { $ne: currentUserId } },
      'profilepic email username'
    );

    return res.status(200).json({ success: true, users });
  } catch (err) {
    console.error('[getAllUsers Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Search for a user by username or email (query string parameter)
 */
export const getUserByUsernameOrEmail = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter 'query' is required" });
    }

    const user = await User.findOne(
      { $or: [{ username: query }, { email: query }] },
      'fullname email username profilepic'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[getUserByUsernameOrEmail Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get user profile by MongoDB ObjectId (URL parameter)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await User.findById(id, 'fullname email username gender profilepic');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[getUserById Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
