import { Request, Response, Router } from "express";
import "dotenv/config";
import axios from "axios";
import OpenAI from "openai";
import { createReadStream, createWriteStream } from "fs";
import { fetchMediaStream } from "./utils/downloadMediaStream.js";
import { streamToS3 } from "./utils/streamToS3.js";

import { tmpdir } from "os";
import { join } from "path";
import { pipeline } from "stream/promises";
import { unlink } from "fs/promises";
import { generateReply } from "./utils/responseHandler.js";
import { sendWhatsAppMessage } from "./utils/sendWhatsAppMessage.js";
import { db } from "./database/drizzle.js";
import { users } from "./database/schema.js";

const router = Router();

const token = process.env.TOKEN!;
const waToken = process.env.AUTHORIZATIONTOKEN!;
const TRANSCRIPTION_THRESHOLD = 8000;

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

        if (message?.timestamp) {
          const msgTimestamp = Number(message.timestamp) * 1000;
          const now = Date.now();
          const FIFTEEN_MINUTES = 15 * 60 * 1000;

          if (now - msgTimestamp > FIFTEEN_MINUTES) {
            const istTime = new Date(msgTimestamp).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            });
            console.log(
              `⏳ Skipping old message. Timestamp in IST: ${istTime}`
            );
            return;
          }
        }

        if (message?.from) {
          let phone_no = body_param.entry[0].changes[0].value.messages[0].from;
          let my_phone_no_id =
            body_param.entry[0].changes[0].value.metadata.phone_number_id;
          let message_type =
            body_param.entry[0].changes[0].value.messages[0].type;
          const version = process.env.WHATSAPP_API_VERSION as string;

          if (message_type === "document" || message_type === "audio") {
            await sendWhatsAppMessage(
              my_phone_no_id,
              phone_no,
              "🎧 I've received your audio! Starting transcription process... This usually takes a few seconds."
            );

            let message_document_id =
              message_type === "document"
                ? body_param.entry[0].changes[0].value.messages[0].document.id
                : body_param.entry[0].changes[0].value.messages[0].audio.id;

            const { data: meta } = await axios.get(
              `https://graph.facebook.com/${version}/${message_document_id}`,
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

            try {
              await db.insert(users).values({
                mobileNumber:
                  body_param.entry[0].changes[0].value.contacts[0].wa_id,
                type: body_param.entry[0].changes[0].value.messages[0].type,
                fullName:
                  body_param.entry[0].changes[0].value.contacts[0].profile
                    ?.name,
                file: s3Key,
              });
            } catch (error) {
              console.log("db_error_document", error);
            }

            // Start timing the transcription process
            const transcriptionStartTime = Date.now();
            let transcriptionUpdateSent = false;

            const longTranscriptionTimeout = setTimeout(async () => {
              await sendWhatsAppMessage(
                my_phone_no_id,
                phone_no,
                "⏳ Still processing your audio... This one's taking a bit longer than usual. I'll send you the audio summary as soon as it's ready!"
              );
              transcriptionUpdateSent = true;
            }, TRANSCRIPTION_THRESHOLD);

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

            const fileForOpenAI = createReadStream(tmpFile);

            try {
              const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY as string,
              });

              const transcription = await openai.audio.transcriptions.create({
                file: fileForOpenAI,
                model: "whisper-1",
              });

              clearTimeout(longTranscriptionTimeout);

              const transcriptionTime = Date.now() - transcriptionStartTime;
              console.log(`Transcription completed in ${transcriptionTime}ms`);

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
                },
                {
                  headers: {
                    Authorization: `Bearer ${waToken}`,
                  },
                }
              );
            } catch (error) {
              console.error("openai_error:", error);
              await sendWhatsAppMessage(
                my_phone_no_id,
                phone_no,
                "❌ Sorry, I couldn't process your audio. Please try sending it again or try with a different audio file."
              );
            }

            await unlink(tmpFile);
          } else if (message_type === "text") {
            let userText =
              body_param.entry[0].changes[0].value.messages[0].text.body;
            const replyText = generateReply(userText);

            await sendWhatsAppMessage(my_phone_no_id, phone_no, replyText);

            try {
              await db.insert(users).values({
                mobileNumber:
                  body_param.entry[0].changes[0].value.contacts[0].wa_id,
                type: body_param.entry[0].changes[0].value.messages[0].type,
                fullName:
                  body_param.entry[0].changes[0].value.contacts[0].profile
                    ?.name,
                text: userText,
              });
            } catch (error) {
              console.log("db_error_text", error);
            }
          } else {
            console.log({ messageType: message_type, action: "unknown" });

            await sendWhatsAppMessage(
              my_phone_no_id,
              phone_no,
              `⚠️ Oops! I currently support only *audio* messages for transcription and summarization. 🎧\n\nPlease try sending a voice note or audio file. 😊`
            );
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
