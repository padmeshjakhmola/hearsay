import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import s3 from "./aws.js";
import { signedUrl } from "../lib/actions/sign.js";

export async function downloadMedia(opts: {
  url: string;
  mime_type: string;
  id: string;
  token: string;
}): Promise<string> {
  console.log("reached_donwloadMedia");

  try {
    const ext = (opts.mime_type.split("/")[1] || "bin").replace("+", "_");

    const key = `${opts.id}.${ext}`;
    const res = await axios.get(opts.url, {
      responseType: "stream",
      headers: { Authorization: `Bearer ${opts.token}` },
    });

    await new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: res.data,
        ContentType: opts.mime_type,
      },
    }).done();

    const getSignedUrl = await signedUrl({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    return getSignedUrl;
  } catch (error) {
    console.error("error_saving_file", error);
    throw error;
  }
}
