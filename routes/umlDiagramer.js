import express from "express";
import {
  addClass,
  addLink,
  createDiagram,
  deleteClass,
  deleteDiagram,
  deleteLink,
  getAllDiagrams,
  getDiagram,
  updateClass,
  updateClassPosition,
  updateDiagram,
  updateLink,
} from "../controllers/umlDiagramer.js";
const router = express.Router();

// Diagram routes
router.post("/", createDiagram);
router.get("/", getAllDiagrams);
router.get("/:id", getDiagram);
router.put("/:id", updateDiagram);
router.delete("/:id", deleteDiagram);

// Class routes
router.post("/:id/classes", addClass);
router.put("/:diagramId/classes/:classId", updateClass);
router.delete("/:diagramId/classes/:classId", deleteClass);
router.put("/:diagramId/classes/:classId/position", updateClassPosition);

// Link routes
router.post("/:id/links", addLink);
router.put("/:diagramId/links/:linkId", updateLink);
router.delete("/:diagramId/links/:linkId", deleteLink);

export default router;
