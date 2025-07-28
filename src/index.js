import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import logger from "./middlewares/logger.js"; // Assuming you're exporting winston logger here

dotenv.config(); // Ensure environment variables are loaded early

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  logger.error("❌ MONGODB_URI not defined in environment");
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("❌ Failed to connect to MongoDB", error);
    process.exit(1);
  });
