import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
    },
    teammates: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: {
      type: [String],
      default: [],
    },
    projectCode: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

projectSchema.pre("save", function (next) {
  if (!this.projectCode) {
    this.projectCode = `PROJ-${nanoid()}`;
  }
  next();
});

// Duplicate Key Error Handling
projectSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Duplicate value found in Project schema"));
  } else {
    next(error);
  }
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
