export const setupSocketIO = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      console.log(`User joined project: ${projectId}`);
    });

    socket.on("leave-project", (projectId) => {
      socket.leave(projectId);
      console.log(`User left project: ${projectId}`);
    });

    socket.on("class-added", ({ diagramId, newClass }) => {
      socket.to(diagramId).emit("class-added", { diagramId, newClass });
    });

    socket.on("class-deleted", ({ diagramId, classId }) => {
      console.log("Class deleted event received:", { diagramId, classId });
      socket.to(diagramId).emit("class-deleted", { diagramId, classId });
    });

    socket.on(
      "class-position-changed",
      ({ diagramId, classId, newPosition }) => {
        // Broadcast the position change to all other clients in the same project
        socket
          .to(diagramId)
          .emit("class-position-changed", { diagramId, classId, newPosition });
      }
    );

    socket.on("link-added", ({ diagramId, newLink }) => {
      socket.to(diagramId).emit("link-added", { diagramId, newLink });
    });

    socket.on("link-deleted", ({ diagramId, linkId }) => {
      console.log("Link deleted event received:", { diagramId, linkId });
      socket.to(diagramId).emit("link-deleted", { diagramId, linkId });
    });

    socket.on("link-updated", ({ diagramId, linkId, updatedLink }) => {
      socket
        .to(diagramId)
        .emit("link-updated", { diagramId, linkId, updatedLink });
    });
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
