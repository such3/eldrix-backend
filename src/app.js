import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler.js";
import morganMiddleware from "./middlewares/morgan.js";
// Import Routes
import userRouter from "./routes/user.route.js";
import projectRouter from "./routes/project.route.js";
import taskRouter from "./routes/task.route.js";
// Load .env
dotenv.config();

const app = express();

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

app.use("/api/v1/users", userRouter);

app.use("/api/v1/projects", projectRouter);

// Mount task routes under projectCode param
app.use("/api/v1/projects/:projectCode/tasks", taskRouter);

// HTTP Request Logging
app.use(morganMiddleware);

// Routes
app.get("/", (req, res) => {
  res.send("Hello, you are at home");
});

// Error Handler
app.use(errorHandler);

export default app;
