import { app } from "./app.js";
import { connectDB } from "./data/database.js";

connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Servidor escuchando el puerto: ${process.env.PORT}`);
});
