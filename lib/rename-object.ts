import {
  S3Client,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

export async function renameObject(s3Client: S3Client, bucket: string, oldKey: string, newKey: string) {
  s3Client.middlewareStack.add(
    (next) => async (args) => {
      args.request.headers["X-Tigris-Rename"] = "true";
      return next(args);
    },
    {
      step: "build",
      name: "renameObject",
      tags: ["METADATA", "RENAME"],
    }
  );

  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${oldKey}`,
    Key: newKey,
  });

  await s3Client.send(copyCommand);

  s3Client.middlewareStack.remove("renameObject");
}