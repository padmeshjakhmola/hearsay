
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../../utils/aws.js";

export const signedUrl = async (getObjectParam: GetObjectParam) => {
  return getSignedUrl(s3, new GetObjectCommand(getObjectParam), {
    expiresIn: 3600,
  });
};
