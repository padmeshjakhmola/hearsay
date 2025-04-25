import axios from "axios";
import "dotenv/config";

const waToken = process.env.AUTHORIZATIONTOKEN!; // WA permanent token

export async function sendWhatsAppMessage(
  phoneNoId: string,
  to: string,
  message: string,
  version = "v20.0"
) {
  try {
    await axios.post(
      `https://graph.facebook.com/${version}/${phoneNoId}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${waToken}`,
        },
      }
    );
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}
