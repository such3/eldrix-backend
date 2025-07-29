import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Project from "../models/Project.model.js";
import path from "path";
import fs from "fs/promises"; // Use fs/promises for better async file handling
import fetch from "node-fetch"; // Add this import at the top of your file

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error); // <--- Add this line
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  // If user is already logged in, return JSON response
  if (req.cookies.accessToken) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User is already logged in"));
  }

  const { fullName, email, password } = req.body;

  // Check if all fields are filled
  if ([fullName, email, password].some((field) => !field?.trim())) {
    return next(
      new ApiError(400, "All fields are required", [
        { field: "fullName", message: "Full name is required" },
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" },
      ])
    );
  }

  // Check if user with the same email already exists
  const existedUser = await User.findOne({ email });

  if (existedUser) {
    return next(
      new ApiError(409, "User with this email already exists", [
        { field: "email", message: "Email is already registered" },
      ])
    );
  }

  // Generate default avatar URL using first letter of fullName
  const firstLetter = fullName.trim().charAt(0).toUpperCase();

  // Example using DiceBear Avatars API for initials:
  const defaultAvatarUrl = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(
    firstLetter
  )}.svg`;

  try {
    const user = await User.create({
      fullName,
      email,
      password,
      avatar: defaultAvatarUrl,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      return next(
        new ApiError(500, "User registration failed. Please try again.")
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("Error during user creation:", error);
    return next(
      new ApiError(
        500,
        "An unexpected error occurred while registering the user"
      )
    );
  }
});

const loginUser = asyncHandler(async (req, res, next) => {
  // If user is already logged in
  if (req.cookies.accessToken) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User is already logged in"));
  }

  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(
      new ApiError(400, "Email and password are required", [
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" },
      ])
    );
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new ApiError(401, "Invalid credentials"));
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Set secure cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: false, // Set to false if you're testing on localhost without HTTPS
    sameSite: "Strict",
  };

  // Set cookies
  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, { userId: user._id }, "Login successful"));
});

const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: "" }, // clearer than $set: undefined
  });

  const cookieOptions = { httpOnly: true, secure: false, sameSite: "Strict" };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "projects", // Adjust this if your schema has a different path
      select: "title projectCode teammates owner",
    })
    .select("-password -refreshToken");

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

// Helper to generate default avatar URL from name
const generateDefaultAvatar = (name) => {
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initial}&backgroundColor=ffdfbf`;
};

const updateAccountDetails = asyncHandler(async (req, res, next) => {
  const { fullName } = req.body;

  if (!fullName?.trim()) {
    return next(
      new ApiError(400, "Full Name is required", [
        { field: "fullName", message: "Full name is required" },
      ])
    );
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  let avatarUrl = user.avatar || null; // Fallback to existing avatar if available

  // === 🖼️ Handle avatar file upload ===
  if (req.file) {
    // Delete previous avatar if it was a local file
    if (user.avatar && user.avatar.startsWith("/uploads")) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      try {
        await fs.unlink(oldAvatarPath);
        console.log("Deleted old avatar:", oldAvatarPath);
      } catch (err) {
        console.warn("Failed to delete old avatar:", oldAvatarPath);
      }
    }

    // Save new avatar path to database
    const filePath = path.join("uploads", "avatars", req.file.filename);
    avatarUrl = `/${filePath.replace(/\\/g, "/")}`; // Ensure proper path format
  }

  // === 🎨 Set default avatar if user didn't have any ===
  if (!avatarUrl) {
    avatarUrl = generateDefaultAvatar(fullName); // This will generate an avatar based on the fullName
  }

  // Update user with new full name and avatar
  const updateData = {
    fullName,
    avatar: avatarUrl,
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(
      new ApiError(400, "Old password and new password are required")
    );
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordValid) {
    return next(new ApiError(400, "Old password is incorrect"));
  }

  user.password = newPassword; // The password will be hashed via pre-save middleware
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password updated successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return next(new ApiError(401, "Unauthorized request"));
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      return next(new ApiError(401, "Invalid or expired refresh token"));
    }

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    await user.save();

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    };

    res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Token refreshed successfully"));
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired refresh token"));
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  refreshAccessToken,
};
