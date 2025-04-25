import { Request, Response, Router } from "express";
import axios from "axios";
import OpenAI from "openai";
import { createReadStream, createWriteStream } from "fs";
import { fetchMediaStream } from "./utils/downloadMediaStream.js";
import { streamToS3 } from "./utils/streamToS3.js";

import { tmpdir } from "os";
import { join } from "path";
import { pipeline } from "stream/promises";
import { unlink } from "fs/promises";

const router = Router();

const token = process.env.TOKEN!;
const waToken = process.env.AUTHORIZATIONTOKEN!; // WA permanent token

router.post("/", async (req: Request, res: Response): Promise<any> => {
  res.status(200).json({ message: "received" }); //for whatsapp api so it do not send multiple messages
  try {
    const body_param = await req.body;
    try {
      if (body_param.object) {
        const entry = body_param.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];
        const status = changes?.value?.statuses?.[0];

        if (message?.from) {
          let phone_no = body_param.entry[0].changes[0].value.messages[0].from;
          let my_phone_no_id =
            body_param.entry[0].changes[0].value.metadata.phone_number_id;
          let message_type =
            body_param.entry[0].changes[0].value.messages[0].type;
          const version = "v20.0";

          if (message_type === "document") {
            let message_document_id =
              body_param.entry[0].changes[0].value.messages[0].document.id;

            const { data: meta } = await axios.get(
              `https://graph.facebook.com/v20.0/${message_document_id}`,
              {
                headers: {
                  Authorization: `Bearer ${waToken}`,
                },
              }
            );

            const ext = (meta.mime_type.split("/")[1] || "bin").replace(
              "+",
              "_"
            );

            const s3Key = `${meta.id}.${ext}`;

            const fbStream = await fetchMediaStream({
              url: meta.url,
              token: waToken,
            });
            
            streamToS3(
              fbStream,
              s3Key,
              meta.mime_type
            ) as unknown as Uploadable;

            const tmpFile = join(tmpdir(), `${meta.id}.${ext}`);

            await pipeline(fbStream, createWriteStream(tmpFile));
            // fbStream is consumed and stored on disk temporarary

            // const info = await fileTypeFromFile(tmpFile);
            // console.log("Detected:", info); // {ext:'mp3', mime:'audio/mpeg'} | undefined

            const fileForOpenAI = createReadStream(tmpFile);

            try {
              const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY as string,
              });

              const transcription = await openai.audio.transcriptions.create({
                file: fileForOpenAI,
                model: "whisper-1",
              });

              const transcriptionText = transcription.text;

              const summaryRes = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful assistant that summarizes audio transcripts.",
                  },
                  {
                    role: "user",
                    content: `Please summarize the following transcript into bullet points. Keep the summary under 4096 characters:\n\n${transcriptionText}`,
                  },
                ],
              });

              const summarizedText =
                summaryRes.choices[0].message.content || "Unable to summarize.";

              await axios.post(
                `https://graph.facebook.com/${version}/${my_phone_no_id}/messages`,
                {
                  messaging_product: "whatsapp",
                  to: `${phone_no}`,
                  text: {
                    body: `${summarizedText}`,
                  },
                  // text: {
                  //   body: "Message received. Comment out the openai code to get the summary of the voice note.",
                  // },
                },
                {
                  headers: {
                    Authorization: `Bearer ${waToken}`,
                  },
                }
              );

              // uncomment when want to send data read status to the user.
              // console.log(
              //   response.data
              //     ? "sending_read_status..."
              //     : "error_occurred_sending_status..."
              // );
            } catch (error) {
              console.error("openai_error:", error);
            }

            await unlink(tmpFile);
          } else if (message_type === "text") {
            let message =
              body_param.entry[0].changes[0].value.messages[0].text.body;
            console.log({ messageType: "text", message });
          } else {
            console.log({ messageType: message_type, action: "unknown" });
          }
        } else if (status?.status) {
          console.log("user_message_status:", status.status);
        } else {
          console.log(
            "unknown payload format:",
            JSON.stringify(body_param, null, 2)
          );
        }
      }
    } catch (error) {
      console.error("error_in_body_parser", error);
    }

    // return res.status(200).json({ message: "data_received", body_param });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "error_fetching_data", message: error });
  }
});
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    req.query["hub.mode"] == "subscribe" &&
      req.query["hub.verify_token"] == token;

    res.send(req.query["hub.challenge"]);
  } catch (error) {
    return res.status(400).json({ error: "error_fetching_data" });
  }
});

export default router;
