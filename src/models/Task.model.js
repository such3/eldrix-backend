import mongoose from "mongoose";

// Subdocument Schema for Comments
const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // no separate _id for sub-documents
);

// Main Task Schema
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Task title is required"] },
    description: { type: String },
    status: {
      type: String,
      enum: ["todo", "pending", "completed"],
      default: "todo",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtask" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Error Handling (e.g., duplicate key error)
taskSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Duplicate value error in Task schema"));
  } else {
    next(error);
  }
});

const Task = mongoose.model("Task", taskSchema);
export default Task;
