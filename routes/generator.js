import express from "express";
import { generateSpringBootProject } from "../controllers/generator.js";

const router = express.Router();

router.post("/", generateSpringBootProject);

export default router;
