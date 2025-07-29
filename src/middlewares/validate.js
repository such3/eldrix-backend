// src/middlewares/validate.js
import { validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => err.msg),
    });
  }
  next();
};

export default validate;

// How to use this ?
// src/routes/auth.routes.js
// import express from "express";
// import { body } from "express-validator";
// import validate from "../middlewares/validate.js";
// import { signupController, loginController } from "../controllers/auth.controller.js";

// const router = express.Router();

// router.post(
//   "/signup",
//   [
//     body("fullName").notEmpty().withMessage("Full name is required"),
//     body("email").isEmail().withMessage("Invalid email"),
//     body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
//   ],
//   validate,
//   signupController
// );

// router.post(
//   "/login",
//   [
//     body("email").isEmail().withMessage("Invalid email"),
//     body("password").notEmpty().withMessage("Password is required"),
//   ],
//   validate,
//   loginController
// );

// export default router;
