interface GetObjectParam {
  Bucket: string;
  Key: string;
}

interface AWSFILEUPLOAD {
  Bucket: string;
  Key: string | undefined;
  Body?: Buffer | Uint8Array | Blob | string | ReadableStream;
  ContentType?: string;
  ACL?: string;
}
