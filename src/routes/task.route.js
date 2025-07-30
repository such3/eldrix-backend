import express from "express";
import {
  createTask,
  updateTask,
  deleteTask,
  getAllTasksForProject,
  getTaskByCode,
  addComment,
  getAllComments,
  deleteComment,
} from "../controllers/task.controller.js";
const router = express.Router({ mergeParams: true });

// Routes scoped under /api/v1/projects/:projectCode/tasks

router
  .route("/")
  .post(createTask) // POST /api/v1/projects/:projectCode/tasks
  .get(getAllTasksForProject); // GET all tasks under project

router
  .route("/:taskCode")
  .get(getTaskByCode) // GET single task
  .put(updateTask) // UPDATE task
  .delete(deleteTask); // DELETE task

router
  .post("/:taskCode/comments", addComment) // add comment to task
  .delete("/:taskCode/comments/:commentId", deleteComment); // delete comment

router.get("/:taskCode/comments", getAllComments);

export default router;
