import { UmlDiagram } from "../models/UmlDiagram.js";
import { io } from "../app.js";

export const createDiagram = async (req, res) => {
  try {
    const newDiagram = new UmlDiagram(req.body);

    console.log(req.body);
    const savedDiagram = await newDiagram.save();
    res.status(201).json(savedDiagram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllDiagrams = async (req, res) => {
  try {
    const diagrams = await UmlDiagram.find();
    res.status(200).json(diagrams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDiagram = async (req, res) => {
  try {
    const diagram = await UmlDiagram.findById(req.params.id);
    if (!diagram) return res.status(404).json({ message: "Diagram not found" });
    res.status(200).json(diagram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDiagram = async (req, res) => {
  try {
    const updatedDiagram = await UmlDiagram.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDiagram)
      return res.status(404).json({ message: "Diagram not found" });
    res.status(200).json(updatedDiagram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDiagram = async (req, res) => {
  try {
    const deletedDiagram = await UmlDiagram.findByIdAndDelete(req.params.id);
    if (!deletedDiagram)
      return res.status(404).json({ message: "Diagram not found" });
    res.status(200).json({ message: "Diagram deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Class-specific operations
export const addClass = async (req, res) => {
  try {
    const diagram = await UmlDiagram.findById(req.params.id);
    if (!diagram) return res.status(404).json({ message: "Diagram not found" });
    console.log(req.body);
    diagram.classes.push(req.body);
    const updatedDiagram = await diagram.save();

    io.to(req.params.id).emit("class-added", {
      diagramId: req.params.id,
      newClass: req.body,
    });
    res.status(200).json(updatedDiagram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    console.log(
      "Received update request for class:",
      req.params.classId,
      req.body
    );
    const diagram = await UmlDiagram.findById(req.params.diagramId);
    if (!diagram) return res.status(404).json({ message: "Diagram not found" });
    const classIndex = diagram.classes.findIndex(
      (c) => c._id.toString() === req.params.classId
    );
    if (classIndex === -1)
      return res.status(404).json({ message: "Class not found" });

    // Exclude position from the update
    const { position, ...updateData } = req.body;

    diagram.classes[classIndex] = {
      ...diagram.classes[classIndex].toObject(),
      ...updateData,
    };
    const updatedDiagram = await diagram.save();

    console.log("Emitting class-updated event");
    io.to(req.params.diagramId).emit("class-updated", {
      diagramId: req.params.diagramId,
      classId: req.params.classId,
      updatedClass: diagram.classes[classIndex],
    });

    res.status(200).json(updatedDiagram);
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateClassPosition = async (req, res) => {
  console.log("trying to save position");
  try {
    const { diagramId, classId } = req.params;
    const { position } = req.body;

    const diagram = await UmlDiagram.findById(diagramId);
    if (!diagram) {
      return res.status(404).json({ message: "Diagram not found" });
    }

    const classIndex = diagram.classes.findIndex(
      (c) => c._id.toString() === classId
    );
    if (classIndex === -1) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Update the position of the class
    diagram.classes[classIndex].position = position;

    // Save the updated diagram
    const updatedDiagram = await diagram.save();

    io.to(diagramId).emit("class-position-changed", {
      diagramId,
      classId,
      newPosition: position,
    });

    res.status(200).json({
      message: "Class position updated successfully",
      updatedClass: diagram.classes[classIndex],
    });
  } catch (error) {
    console.error("Error updating class position:", error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    console.log("Received delete request for class:", req.params.classId);
    const diagram = await UmlDiagram.findById(req.params.diagramId);

    if (!diagram) return res.status(404).json({ message: "Diagram not found" });

    diagram.classes = diagram.classes.filter(
      (c) => c._id.toString() !== req.params.classId
    );
    const updatedDiagram = await diagram.save();

    console.log("Emitting class-deleted event");
    io.to(req.params.diagramId).emit("class-deleted", {
      diagramId: req.params.diagramId,
      classId: req.params.classId,
    });

    res.status(200).json(updatedDiagram);
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(400).json({ message: error.message });
  }
};

// Link-specific operations
export const addLink = async (req, res) => {
  try {
    const diagram = await UmlDiagram.findById(req.params.id);

    if (!diagram) return res.status(404).json({ message: "Diagram not found" });

    console.log("Received link data:", req.body);

    if (req.body.linkType === "intermediate" && req.body.intermediateClass) {
      // Create the intermediate class
      const newClass = {
        name: req.body.intermediateClass.name,
        attributes: req.body.intermediateClass.attributes,
        methods: req.body.intermediateClass.methods,
        position: req.body.intermediateClass.position,
        size: req.body.intermediateClass.size,
      };

      diagram.classes.push(newClass);
      const savedClass = diagram.classes[diagram.classes.length - 1];

      // Create a single link representing the intermediate relationship
      const intermediateLink = {
        source: req.body.source,
        target: req.body.target,
        linkType: "intermediate",
        sourceMultiplicity: req.body.sourceMultiplicity || "1",
        targetMultiplicity: req.body.targetMultiplicity || "1",
        intermediateClass: savedClass._id,
      };

      diagram.links.push(intermediateLink);
    } else {
      // For non-intermediate links, just add the link as is
      diagram.links.push(req.body);
    }

    const updatedDiagram = await diagram.save();
    console.log("Updated diagram:", updatedDiagram);

    res.status(200).json(updatedDiagram);
  } catch (error) {
    console.error("Error in addLink controller:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateLink = async (req, res) => {
  try {
    const diagram = await UmlDiagram.findById(req.params.diagramId);
    if (!diagram) return res.status(404).json({ message: "Diagram not found" });
    const linkIndex = diagram.links.findIndex(
      (l) => l._id.toString() === req.params.linkId
    );
    if (linkIndex === -1)
      return res.status(404).json({ message: "Link not found" });
    diagram.links[linkIndex] = {
      ...diagram.links[linkIndex].toObject(),
      ...req.body,
    };
    const updatedDiagram = await diagram.save();
    res.status(200).json(updatedDiagram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLink = async (req, res) => {
  try {
    const diagram = await UmlDiagram.findById(req.params.diagramId);
    if (!diagram) return res.status(404).json({ message: "Diagram not found" });
    diagram.links = diagram.links.filter(
      (l) => l._id.toString() !== req.params.linkId
    );
    const updatedDiagram = await diagram.save();
    res.status(200).json(updatedDiagram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
