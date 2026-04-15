// config/env.js
import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "AI_URL",
  "FRONTEND_URL"
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV variable: ${key}`);
    process.exit(1);
  }
});

export default process.env;