import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  // Send a response to the client
  res.send("Hello, TypeScript + Node.js + Express!");
});

export default router;
