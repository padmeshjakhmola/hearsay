import axios from "axios";
import fs from "node:fs";
import { mkdirSync } from "node:fs";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function downloadMedia(opts: {
  url: string;
  mime_type: string;
  id: string;
  token: string;
}): Promise<string> {
  console.log("reached_donwloadMedia");

  try {
    const ext = (opts.mime_type.split("/")[1] || "bin").replace("+", "_");
    const dirPath = path.join(__dirname, "tmp");
    const filePath = path.join(dirPath, `${opts.id}.${ext}`);

    mkdirSync(dirPath, { recursive: true });

    const res = await axios.get(opts.url, {
      responseType: "stream",
      headers: { Authorization: `Bearer ${opts.token}` },
    });

    await new Promise<void>((resolve, reject) => {
      res.data
        .pipe(fs.createWriteStream(filePath))
        .on("finish", resolve)
        .on("error", reject);
    });

    return filePath;
  } catch (error) {
    console.error("error_saving_file", error);
    throw error;
  }
}
