import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
});

export const User = mongoose.model("User", schema);
