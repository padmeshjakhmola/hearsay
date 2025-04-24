import { Request, Response, Router } from "express";
import { downloadMedia } from "./utils/downloadMedia.js";
import axios from "axios";

const router = Router();

const token = process.env.TOKEN!;
const waToken = process.env.AUTHORIZATIONTOKEN!; // WA permanent token

router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const body_param = await req.body;
    console.log("WEBHOOK:-", JSON.stringify(body_param));

    try {
      if (body_param.object) {
        console.log("inside_body_param");
        // console.log("Aaaaaaaaaaaaaaaaaaaaaaa", body_param.entry[0].changes[0].value.messages[0]);
        if (body_param.entry[0] && body_param.entry[0].changes[0]) {
          let phone_no = body_param.entry[0].changes[0].value.messages[0].from;
          // let message = body_param.entry[0].changes[0].value.messages[0].text.body;
          let message_type =
            body_param.entry[0].changes[0].value.messages[0].type;

          console.log("all_props:", phone_no, message_type);

          if (message_type === "document") {
            let message_document_id =
              body_param.entry[0].changes[0].value.messages[0].document.id;

            const { data } = await axios.get(
              `https://graph.facebook.com/v20.0/${message_document_id}`,
              {
                headers: {
                  Authorization: `Bearer ${waToken}`,
                },
              }
            );

            const localPath = await downloadMedia({
              url: data.url,
              mime_type: data.mime_type,
              id: data.id,
              token: waToken,
            });
            console.log("saved to:", localPath);
          }
        }
      }
    } catch (error) {
      console.error("error_in_body_parser", error);
    }

    return res.status(200).json({ message: "data_received", body_param });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "error_fetching_data", message: error });
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
