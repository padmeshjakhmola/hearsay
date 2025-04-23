import morgan from "morgan";
import { RequestHandler } from "express";
import { formatDate } from "../utils/index.js";

export const logRequest: RequestHandler = morgan((tokens, req, res) => {
  const today = new Date();
  const formattedTime = formatDate(today);

  return [
    `[${formattedTime}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens["response-time"](req, res),
    "ms",
  ].join(" ");
});
