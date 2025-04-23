// Import the 'express' module
import express from "express";
import { logRequest } from "./middleware/logger.js";
import router from "./routes/user.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use(logRequest);

app.use("/v1", router);

app.listen(port, () => {
  console.log(`🚀 Server is up on port ${port}`);
});
