import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello, TypeScript + Node.js + Express!");
});

export default router;
