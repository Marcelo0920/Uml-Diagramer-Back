import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import cors from "cors";
import generator from "./routes/generator.js";
import diagramer from "./routes/umlDiagramer.js";
import user from "./routes/user.js";
import mailer from "./routes/mailer.js";

import { setupSocketIO } from "./utils/socket.js";
import { connectDB } from "./data/database.js";

config({ path: "./data/config.env" });

const PORT = process.env.PORT || 5000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://staging.d29zhbrzfs1bz0.amplifyapp.com",
    methods: ["GET", "POST", "UPDATE", "DELETE"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use("/generator", generator);
app.use("/diagrams", diagramer);
app.use("/user", user);
app.use("/mailer", mailer);

// Socket.IO setup
setupSocketIO(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app, io };
