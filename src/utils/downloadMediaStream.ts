import axios from "axios";
import { PassThrough, Readable } from "stream";

export async function fetchMediaStream(opts: {
  url: string;
  token: string;
}): Promise<Readable> {
  const { data } = await axios.get(opts.url, {
    responseType: "stream",
    headers: { Authorization: `Bearer ${opts.token}` },
  });

  const pt = new PassThrough();

  data.pipe(pt);

  console.log("done_in_downloadMediaStream");

  return pt;
}
