import express from "express";
import {
  postUser,
  loginUser,
  loadUser,
} from "../controllers/userController.js";

const router = express.Router();

// User routes
router.post("/register", postUser);
router.post("/login", loginUser);
router.get("/loaduser", loadUser);

export default router;
