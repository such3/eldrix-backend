import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Subtask title is required"],
      trim: true,
      minlength: [3, "Subtask title should be at least 3 characters long"], // Added length check for title
    },
    description: {
      type: String,
      trim: true,
      default: "No description provided", // Adding a default value
    },
    status: {
      type: String,
      enum: ["todo", "pending", "completed"],
      default: "todo",
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Parent task reference is required"],
    },
    subtaskCode: {
      type: String,
      unique: true,
      immutable: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to generate the subtaskCode automatically
subtaskSchema.pre("save", function (next) {
  if (!this.subtaskCode) {
    this.subtaskCode = `SUB-${nanoid()}`; // Ensure unique code for each subtask
  }
  next();
});

// Error Handling (Duplicate Key Example)
subtaskSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Duplicate value error in Subtask schema"));
  } else {
    next(error);
  }
});

const Subtask = mongoose.model("Subtask", subtaskSchema);
export default Subtask;
