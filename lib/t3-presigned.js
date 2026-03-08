import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.T3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const bucket = process.env.T3_BUCKET;

export async function generatePresignedPutUrl(key) {
  return getSignedUrl(s3Client, new PutObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
}

export async function generatePresignedGetUrl(key) {
  return getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 * 24 * 7 });
}

export async function generatePresignedDeleteUrl(key) {
  return getSignedUrl(s3Client, new DeleteObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
}