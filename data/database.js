import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "UML-DIAGRAMER",
    });

    console.log("Server connected to database");
  } catch (error) {
    console.log("Error while connecting DB", error);
    process.exit(1);
  }
};
