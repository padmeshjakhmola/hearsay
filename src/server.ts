// Import the 'express' module
import express, { Router } from "express";
import { logRequest } from "./middleware/logger.js";
import userRoute from "./routes/user.js";
import embeddingRoutes from "./routes/chat.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(logRequest);

console.log(typeof embeddingRoutes, embeddingRoutes instanceof Router);

const baseRoute = express.Router();

baseRoute.use("/user", userRoute);
baseRoute.use("/chat", embeddingRoutes);

app.use("/v1", baseRoute);

app.listen(port, () => {
  console.log(`🚀 Server is up on port ${port}`);
});
