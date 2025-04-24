import { Request, Response, Router } from "express";

const router = Router();

const token = process.env.TOKEN!;

router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await req.body;
    console.log("WEBHOOK:-", JSON.stringify(data));

    return res.status(200).json({ message: "data_received", data });
  } catch (error) {
    return res.status(500).json({ error: "error_fetching_data" });
  }
});
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    console.log("aaaaaaaaaaaaaaaa", req.query);

    req.query["hub.mode"] == "subscribe" &&
      req.query["hub.verify_token"] == token;

    // return res.status(200).json(req.query);

    res.send(req.query["hub.challenge"]);

    // return res.status(200).json({ message: "data_received", data });
  } catch (error) {
    return res.status(400).json({ error: "error_fetching_data" });
  }
});

export default router;
