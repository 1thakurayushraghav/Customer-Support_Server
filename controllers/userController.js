import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

// GET USERS (with enhanced search, filters, pagination, sorting)
export const getUsers = async (req, res) => {
  try {
    const { 
      search = "", 
      role, 
      status,
      page = 1, 
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by role
    if (role && role !== "all") {
      query.role = role;
    }

    // Filter by status (isActive)
    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute queries
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Get stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactive: { $sum: { $cond: ["$isActive", 0, 1] } },
          admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
          users: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      data: users,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      stats: stats[0] || { total: 0, active: 0, inactive: 0, admins: 0, users: 0 }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// GET SINGLE USER DETAILS with conversation count
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const conversationsCount = await Conversation.countDocuments({
      userId: req.params.id
    });

    res.json({
      user,
      conversationsCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

// UPDATE USER (role / status)
export const updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Also delete user's conversations
    await Conversation.deleteMany({ userId: req.params.id });

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// BULK DELETE USERS
export const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: "Invalid user IDs" });
    }

    await User.deleteMany({ _id: { $in: userIds } });
    await Conversation.deleteMany({ userId: { $in: userIds } });

    res.json({ message: `${userIds.length} users deleted successfully` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete users" });
  }
};