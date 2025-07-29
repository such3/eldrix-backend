import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.model.js";
import mongoose from "mongoose";

// Middleware to verify the access token and authorize the user (API version)
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from headers, cookies, or query
    const token =
      req.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.query.accessToken;

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Authentication required. Please log in.",
      });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: "fail",
          message: "Token expired. Please log in again.",
        });
      }
      return res.status(401).json({
        status: "fail",
        message: "Invalid access token.",
      });
    }

    if (
      !decodedToken._id ||
      !mongoose.Types.ObjectId.isValid(decodedToken._id)
    ) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid user ID in token.",
      });
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken -__v"
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found. Invalid access token.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // For unexpected errors, forward to error handler
    next(error);
  }
});

// Middleware to check if user is already logged in (API version)
export const isAuthenticated = (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (accessToken) {
    // Instead of redirecting, respond with a 403 Forbidden or a custom message
    return res.status(403).json({
      status: "fail",
      message: "You are already logged in.",
    });
  }

  next();
};
