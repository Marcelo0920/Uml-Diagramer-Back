import express from "express";
import { generateJavaCode } from "../controllers/generator.js";

const router = express.Router();

router.post("/", generateJavaCode);

export default router;
