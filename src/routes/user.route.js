import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  updateAccountDetails,
  changeCurrentPassword,
} from "../controllers/user.controller.js"; // User authentication controllers
import { verifyJWT } from "../middlewares/auth.js";

import avatarUpload from "../middlewares/multer.js";

const router = new Router();

router.route("/register").post(
  registerUser // User registration handler
);

router.route("/login").post(loginUser); // User login handler

router.route("/logout").post(verifyJWT, logoutUser); // User logout handler

router.route("/refresh-token").post(refreshAccessToken); // Token refresh handler

router.route("/profile").get(verifyJWT, getCurrentUser);

router
  .route("/profile")
  .patch(verifyJWT, avatarUpload.single("avatar"), updateAccountDetails);

router.route("/change-password").patch(verifyJWT, changeCurrentPassword);
export default router;
