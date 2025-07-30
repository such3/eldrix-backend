import express from "express";
import {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getProjectByCode,
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createProject); // Create
router.get("/", getAllProjects); // Get all

router.get("/:projectCode", getProjectByCode); // Get one
router.patch("/:projectCode", updateProject); // Update
router.delete("/:projectCode", deleteProject); // Delete

export default router;
