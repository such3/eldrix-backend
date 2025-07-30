import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import Subtask from "../models/Subtask.model.js";
import User from "../models/User.model.js";

// Helper to find project by projectCode param and return its _id
const findProjectByCode = async (projectCode) => {
  const project = await Project.findOne({ projectCode });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

// CREATE TASK under a project (using projectCode)
export const createTask = asyncHandler(async (req, res, next) => {
  const { projectCode } = req.params;
  const { title, description, status, dueDate, priority, assignees } = req.body;

  if (!title?.trim()) {
    return next(new ApiError(400, "Task title is required"));
  }

  const project = await findProjectByCode(projectCode);

  const task = await Task.create({
    title,
    description,
    status,
    dueDate,
    priority,
    assignees,
    project: project._id,
  });

  project.tasks.push(task._id);
  await project.save();

  res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

// UPDATE TASK by taskCode, scoped to projectCode
export const updateTask = asyncHandler(async (req, res, next) => {
  const { projectCode, taskCode } = req.params;
  const updates = req.body;

  const project = await findProjectByCode(projectCode);

  const task = await Task.findOne({ taskCode, project: project._id });
  if (!task) {
    return next(new ApiError(404, "Task not found in this project"));
  }

  Object.assign(task, updates);
  await task.save();

  res.status(200).json(new ApiResponse(200, task, "Task updated successfully"));
});

// DELETE TASK by taskCode scoped to projectCode
export const deleteTask = asyncHandler(async (req, res, next) => {
  const { projectCode, taskCode } = req.params;

  const project = await findProjectByCode(projectCode);

  const task = await Task.findOne({ taskCode, project: project._id });
  if (!task) {
    return next(new ApiError(404, "Task not found in this project"));
  }

  // Remove from project's tasks list
  await Project.findByIdAndUpdate(project._id, { $pull: { tasks: task._id } });

  await task.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
});

// GET all tasks for a project (by projectCode)
export const getAllTasksForProject = asyncHandler(async (req, res, next) => {
  const { projectCode } = req.params;

  const project = await findProjectByCode(projectCode);

  const tasks = await Task.find({ project: project._id })
    .populate("assignees", "fullName email")
    .populate("subtasks")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched for project"));
});

// GET single task by code scoped to projectCode
export const getTaskByCode = asyncHandler(async (req, res, next) => {
  const { projectCode, taskCode } = req.params;

  const project = await findProjectByCode(projectCode);

  const task = await Task.findOne({ taskCode, project: project._id })
    .populate("assignees", "fullName email")
    .populate("subtasks")
    .populate("project", "title");

  if (!task) {
    return next(new ApiError(404, "Task not found in this project"));
  }

  res.status(200).json(new ApiResponse(200, task, "Fetched individual task"));
});

// COMMENTS: ADD comment to task by projectCode + taskCode
export const addComment = asyncHandler(async (req, res, next) => {
  const { projectCode, taskCode } = req.params;
  const { userId, text } = req.body;

  if (!text?.trim()) {
    return next(new ApiError(400, "Comment text is required"));
  }

  const project = await findProjectByCode(projectCode);

  const task = await Task.findOne({ taskCode, project: project._id });
  if (!task) {
    return next(new ApiError(404, "Task not found in this project"));
  }

  task.comments.push({ user: userId, text });
  await task.save();

  res.status(201).json(new ApiResponse(201, task.comments, "Comment added"));
});

// COMMENTS: DELETE comment by commentCode (formerly commentId)
export const deleteComment = asyncHandler(async (req, res, next) => {
  const { projectCode, taskCode, commentCode } = req.params;

  const project = await findProjectByCode(projectCode);

  const task = await Task.findOne({ taskCode, project: project._id });
  if (!task) {
    return next(new ApiError(404, "Task not found in this project"));
  }

  const commentIndex = task.comments.findIndex(
    (c) => c.commentCode === commentCode
  );
  if (commentIndex === -1) {
    return next(new ApiError(404, "Comment not found"));
  }

  task.comments.splice(commentIndex, 1);
  await task.save();

  res.status(200).json(new ApiResponse(200, task.comments, "Comment deleted"));
});

// GET ALL COMMENTS for a task (with user info populated manually)
export const getAllComments = asyncHandler(async (req, res, next) => {
  const { projectCode, taskCode } = req.params;

  const project = await findProjectByCode(projectCode);

  const task = await Task.findOne({ taskCode, project: project._id }).lean();
  if (!task) {
    return next(new ApiError(404, "Task not found in this project"));
  }

  // Manual population of user info in comments (since comments are subdocs)
  // Assuming you have User model imported

  const userIds = task.comments.map((c) => c.user);
  const users = await User.find({ _id: { $in: userIds } })
    .select("fullName email")
    .lean();

  // Create a map for quick lookup
  const userMap = {};
  users.forEach((u) => {
    userMap[u._id.toString()] = u;
  });

  // Attach user info to comments
  const commentsWithUser = task.comments.map((c) => ({
    ...c,
    user: userMap[c.user.toString()] || null,
  }));

  res
    .status(200)
    .json(
      new ApiResponse(200, commentsWithUser, "Comments fetched successfully")
    );
});
