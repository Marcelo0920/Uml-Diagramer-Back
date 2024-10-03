import mongoose from "mongoose";

const UmlClassSchema = new mongoose.Schema({
  name: String,
  attributes: [String],
  methods: [String],
  position: {
    x: Number,
    y: Number,
  },
  size: {
    width: Number,
    height: Number,
  },
});

const UmlLinkSchema = new mongoose.Schema({
  source: { type: mongoose.Schema.Types.ObjectId, ref: "UmlClass" },
  target: { type: mongoose.Schema.Types.ObjectId, ref: "UmlClass" },
  linkType: {
    type: String,
    enum: [
      "association",
      "composition",
      "aggregation",
      "generalization",
      "intermediate",
    ],
  },
  sourceMultiplicity: String,
  targetMultiplicity: String,
  intermediateClass: {
    name: String,
    attributes: [String],
    methods: [String],
    position: {
      x: Number,
      y: Number,
    },
    size: {
      width: Number,
      height: Number,
    },
  },
});
const UmlDiagramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    classes: [UmlClassSchema],
    links: [UmlLinkSchema],
  },
  { timestamps: true }
);

export const UmlDiagram = mongoose.model("UmlDiagram", UmlDiagramSchema);
