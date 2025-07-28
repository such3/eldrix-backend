import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required !"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required !"],
      unique: [true, "Email already exists ! Try Logging in .."],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required !"],
    },
  },
  { timestamps: true }
);
