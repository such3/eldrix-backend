import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  updateAccountDetails,
} from "../controllers/user.controller.js"; // User authentication controllers
import { verifyJWT } from "../middlewares/auth.js";

const router = new Router();

router.route("/register").post(
  registerUser // User registration handler
);

router.route("/login").post(loginUser); // User login handler

router.route("/logout").post(verifyJWT, logoutUser); // User logout handler

router.route("/refresh-token").post(refreshAccessToken); // Token refresh handler

router.route("/profile").get(verifyJWT, getCurrentUser);

router.route("/profile").patch(verifyJWT, updateAccountDetails);

export default router;
