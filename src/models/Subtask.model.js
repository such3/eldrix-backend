import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Subtask title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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

subtaskSchema.pre("save", function (next) {
  if (!this.subtaskCode) {
    this.subtaskCode = `SUB-${nanoid()}`; // <-- call nanoid() as a function
  }
  next();
});

// Error Handling (Duplicate Key Example)
subtaskSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Duplicate value in Subtask schema"));
  } else {
    next(error);
  }
});

const Subtask = mongoose.model("Subtask", subtaskSchema);
export default Subtask;
