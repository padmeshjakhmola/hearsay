import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export async function getEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    console.log("RAW_embedding_data:", response);

    const embedding = response.data[0].embedding;
    return embedding;
  } catch (error) {
    console.error("error_getting_embedings", error);
    return error;
  }
}
