import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ---------------- REGISTER ---------------- */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validate input
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // always default role = user (secure)
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "user"
    });

    return res.status(201).json({
      msg: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      msg: "Server error during registration",
      error: error.message
    });
  }
};


/* ---------------- LOGIN ---------------- */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate input
    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role || "user"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user"
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      msg: "Server error during login",
      error: error.message
    });
  }
};