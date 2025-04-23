import { Router, Request, Response } from "express";
import { getEmbedding } from "../utils/getEmbedding.js";
import { db } from "../database/drizzle.js";
import { users } from "../database/schema.js";
import { findMostSimilarQuery } from "../utils/findPreviousQuery.js";

const router = Router();

// router.post("/", async (req: Request, res: Response): Promise<any> => {
//   const { text } = req.body;

//   if (!text || typeof text !== "string") {
//     return res.status(400).json({ error: "Missing 'text' query parameter" });
//   }

//   try {
//     const embedding = await getEmbedding(text);

//     if (!Array.isArray(embedding)) throw new Error("embedding is not an array");

//     await db.insert(users).values({
//       text: text,
//       embedding: embedding,
//     });

//     return res.status(200).json({ embedding });
//   } catch (error) {
//     console.error("server_error", error);
//     return res.status(500).json({ error: "Failed to get embedding" });
//   }
// });

router.post("/search", async (req: Request, res: Response): Promise<any> => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "Missing input text" });

  try {
    const embedding = await getEmbedding(text);

    if (!Array.isArray(embedding)) throw new Error("embedding is not an array");

    const match = await findMostSimilarQuery(embedding);
    await db.insert(users).values({ text, embedding });

    // console.log("Match:-", match);

    if (match) {
      return res.json({
        message: "Closest previous query found",
        originalText: match.text,
        similarityScore: match.similarity,
      });
    } else {
      return res.json({ message: "No similar match found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
