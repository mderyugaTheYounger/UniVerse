import { S3Client, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

/**
 * S3 helpers for UniVerse profile pictures.
 *
 * Required env vars: S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * Optional (for MinIO/LocalStack in local dev): S3_ENDPOINT, e.g. http://localhost:9000
 */

const Bucket = process.env.S3_BUCKET!;

export const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  ...(process.env.S3_ENDPOINT
    ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
    : {}),
});

/** Image types accepted for profile pictures. */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Maximum upload size in bytes (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Creates a presigned POST so the browser can upload straight to S3.
 * The server picks the object key; the client never chooses it.
 */
export async function createUploadUrl(userId: number, contentType: string) {
  const key = `profile-pictures/${userId}/${randomUUID()}`;

  const { url, fields } = await createPresignedPost(s3, {
    Bucket,
    Key: key,
    Fields: { 'Content-Type': contentType },
    Conditions: [
      ['content-length-range', 1, MAX_UPLOAD_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Expires: 300, // seconds
  });

  return { key, url, fields };
}

/** Creates a short-lived presigned GET URL for displaying a stored picture. */
export function createDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), {
    expiresIn: 300,
  });
}

/** Returns true if an object exists at `key` (used to confirm an upload finished). */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Deletes an object (use when a picture is replaced or the user is deleted). */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
}