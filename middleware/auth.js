import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);
    
    // Fix: Ensure _id is available
    req.user = {
      _id: decoded.userId || decoded._id || decoded.id,
      id: decoded.userId || decoded._id || decoded.id,
      role: decoded.role
    };
    
    console.log("👤 User set in req.user:", req.user);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    res.sendStatus(403);
  }
};