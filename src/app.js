import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit"; // Added rate limiting
import helmet from "helmet"; // Added security headers
import cors from "cors"; // Added CORS handling

import errorHandler from "./middlewares/errorHandler.js";
import morganMiddleware from "./middlewares/morgan.js";

// Import Routes
import userRouter from "./routes/user.route.js";
import projectRouter from "./routes/project.route.js";
import taskRouter from "./routes/task.route.js";

// Load .env
dotenv.config();

const app = express();

// 1. Security HTTP headers
app.use(helmet());

// 2. Enable CORS - you can customize the options if needed
app.use(cors());

// 3. Rate limiting - limit each IP to 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all API routes
app.use("/api/", limiter);

// Static Files
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// Body Parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Cookie Parser
app.use(cookieParser());

// HTTP Request Logging (after body parsing & security middlewares)
app.use(morganMiddleware);

// API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/projects/:projectCode/tasks", taskRouter);

// Basic home route
app.get("/", (req, res) => {
  res.send("Hello, you are at home");
});

// Global Error Handler
app.use(errorHandler);

export default app;
