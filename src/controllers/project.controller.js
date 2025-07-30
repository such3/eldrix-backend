import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import User from "../models/User.model.js";

// CREATE PROJECT
export const createProject = asyncHandler(async (req, res, next) => {
  const { title, description = "No description yet", tags = [] } = req.body;

  if (!title?.trim()) {
    return next(new ApiError(400, "Title is required"));
  }

  const project = await Project.create({
    title,
    description,
    tags,
    owner: req.user._id,
  });

  // Add project reference to the owner's ownedProjects array and return updated user (optional)
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { ownedProjects: project._id } },
    { new: true }
  );

  if (!updatedUser) {
    // If user update failed, consider deleting the project or handle accordingly
    return next(new ApiError(500, "Failed to update user with new project"));
  }

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project created successfully"));
});

// EDIT PROJECT
export const updateProject = asyncHandler(async (req, res, next) => {
  const { projectCode } = req.params;
  const { title, description, tags } = req.body;

  const project = await Project.findOne({ projectCode });

  if (!project) {
    return next(new ApiError(404, "Project not found"));
  }

  if (!project.owner.equals(req.user._id)) {
    return next(new ApiError(403, "You are not allowed to edit this project"));
  }

  if (title) project.title = title;
  if (description) project.description = description;
  if (tags) project.tags = tags;

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

// DELETE PROJECT
export const deleteProject = asyncHandler(async (req, res, next) => {
  const { projectCode } = req.params;

  const project = await Project.findOne({ projectCode });

  if (!project) {
    return next(new ApiError(404, "Project not found"));
  }

  if (!project.owner.equals(req.user._id)) {
    return next(
      new ApiError(403, "You are not allowed to delete this project")
    );
  }

  // Delete all related tasks
  await Task.deleteMany({ project: project._id });

  // Remove project from owner's ownedProjects
  await User.findByIdAndUpdate(project.owner, {
    $pull: { ownedProjects: project._id },
  });

  // Remove project from all teammates' joinedProjects
  await User.updateMany(
    { _id: { $in: project.teammates } },
    { $pull: { joinedProjects: project._id } }
  );

  await project.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Project deleted successfully"));
});

export const getAllProjects = asyncHandler(async (req, res, next) => {
  console.log("getAllProjects entered");

  // Simplify to just get projects without populate
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { teammates: req.user._id }],
  })
    .populate("owner", "fullName email") // populate owner with selected fields
    .populate("teammates", "fullName email") // populate teammates with selected fields
    .lean();

  console.log("projects fetched", projects.length);

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Fetched user projects"));
});

export const getProjectByCode = asyncHandler(async (req, res, next) => {
  const { projectCode } = req.params;

  // Find project by projectCode and populate owner and teammates
  const project = await Project.findOne({ projectCode })
    .populate("owner", "fullName email")
    .populate("teammates", "fullName email");

  if (!project) {
    return next(new ApiError(404, "Project not found"));
  }

  // Find tasks that belong to this project, populate assignees
  const tasks = await Task.find({ project: project._id }).populate(
    "assignees",
    "fullName email"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { project, tasks },
        "Project details fetched successfully"
      )
    );
});
