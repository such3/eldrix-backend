import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler.js";
import morganMiddleware from "./middlewares/morgan.js";

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

// Import Routes
import userRouter from "./routes/user.route.js";

app.use("/api/v1/users", userRouter);

// HTTP Request Logging
app.use(morganMiddleware);

// Routes
app.get("/", (req, res) => {
  res.send("Hello, you are at home");
});

// Error Handler
app.use(errorHandler);

export default app;
