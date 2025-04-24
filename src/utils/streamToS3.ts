// utils/streamToS3.ts
import { Upload } from "@aws-sdk/lib-storage";
import { PassThrough, Readable } from "stream";
import s3 from "./aws.js";

export function streamToS3(bodyStream: Readable, key: string, mime: string) {
  const tee = new PassThrough(); // we’ll send this on to OpenAI
  bodyStream.pipe(tee); // duplicate bytes

  new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: bodyStream,
      ContentType: mime,
    },
  })
    .done()
    .catch(console.error);

  console.log("done_in_streamtos3");

  return tee;
}
