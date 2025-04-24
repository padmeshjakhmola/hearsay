import crypto from "crypto";

export const uniqueFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");
