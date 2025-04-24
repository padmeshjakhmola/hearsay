interface GetObjectParam {
  Bucket: string;
  Key: string;
}

interface AWSFILEUPLOAD {
  Bucket: string;
  Key: string | undefined;
  Body?: Buffer | Uint8Array | Blob | string | Readable;
  ContentType?: string;
  ACL?: string;
}

type Uploadable =
  | ReadStream // fs.createReadStream()
  | Buffer
  | Uint8Array
  | File; // in browsers
