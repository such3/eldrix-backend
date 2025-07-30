import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Task from "../models/Task.model.js";
import Subtask from "../models/Subtask.model.js";
import User from "../models/User.model.js";

// CREATE SUBTASK
export const createSubtask = asyncHandler(async (req, res, next) => {
  const { title, description, status, assignees, task } = req.body;

  if (!title?.trim()) {
    return next(new ApiError(400, "Subtask title is required"));
  }

  // Find the parent task
  const parentTask = await Task.findOne({ taskCode: task });
  if (!parentTask) {
    return next(new ApiError(404, "Parent task not found"));
  }

  // Create the subtask
  const subtask = await Subtask.create({
    title,
    description,
    status,
    assignees,
    task: parentTask._id, // link the subtask to the parent task
  });

  // Add subtask reference to the parent task
  parentTask.subtasks.push(subtask._id);
  await parentTask.save();

  return res
    .status(201)
    .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

// UPDATE SUBTASK
export const updateSubtask = asyncHandler(async (req, res, next) => {
  const { subtaskCode } = req.params;
  const { title, description, status, assignees } = req.body;

  // Find the subtask by subtaskCode
  const subtask = await Subtask.findOne({ subtaskCode });

  if (!subtask) {
    return next(new ApiError(404, "Subtask not found"));
  }

  // Update fields of the subtask
  if (title) subtask.title = title;
  if (description) subtask.description = description;
  if (status) subtask.status = status;
  if (assignees) subtask.assignees = assignees;

  await subtask.save();

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

// DELETE SUBTASK
export const deleteSubtask = asyncHandler(async (req, res, next) => {
  const { subtaskCode } = req.params;

  // Find the subtask by subtaskCode
  const subtask = await Subtask.findOne({ subtaskCode });

  if (!subtask) {
    return next(new ApiError(404, "Subtask not found"));
  }

  // Find the parent task and remove the subtask reference
  const parentTask = await Task.findById(subtask.task);
  parentTask.subtasks.pull(subtask._id);
  await parentTask.save();

  // Delete the subtask
  await subtask.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Subtask deleted successfully"));
});

// GET ALL SUBTASKS
export const getAllSubtasks = asyncHandler(async (req, res) => {
  // Fetch all subtasks (optional filtering can be added)
  const subtasks = await Subtask.find({})
    .populate("assignees", "fullName email")
    .populate("task", "title project");

  return res
    .status(200)
    .json(new ApiResponse(200, subtasks, "Fetched all subtasks"));
});

// GET INDIVIDUAL SUBTASK
export const getSubtaskByCode = asyncHandler(async (req, res, next) => {
  const { subtaskCode } = req.params;

  // Find the subtask by subtaskCode and populate task and assignees
  const subtask = await Subtask.findOne({ subtaskCode })
    .populate("assignees", "fullName email")
    .populate("task", "title project");

  if (!subtask) {
    return next(new ApiError(404, "Subtask not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Fetched individual subtask"));
});
