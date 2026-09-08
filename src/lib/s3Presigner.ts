import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let globalS3Client: S3Client | null = null;

function getS3Client(): { client: S3Client; bucketName: string } {
  const region = process.env.AWS_REGION || "eu-north-1";
  const bucketName = process.env.AWS_BUCKET_NAME || "buyairgunsindiakgh-product-images";

  if (!globalS3Client) {
    globalS3Client = new S3Client({ region });
  }

  return { client: globalS3Client, bucketName };
}

/**
 * Extracts object key from full S3 URL or relative key string.
 */
export function extractS3Key(urlOrKey: string): string | null {
  if (!urlOrKey) return null;
  const trimmed = urlOrKey.trim();
  if (!trimmed) return null;

  // Handles http(s)://...s3...amazonaws.com/uploads/...
  // or https://bucketname.s3.region.amazonaws.com/key
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes("amazonaws.com")) {
        // Pathname starts with '/', so remove leading '/'
        const key = parsed.pathname.substring(1);
        return key ? decodeURIComponent(key) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  // If local path starting with '/' or relative path
  if (trimmed.startsWith("/")) {
    return null;
  }

  // Plain S3 key (e.g., uploads/123-abc.jpg)
  return trimmed;
}

/**
 * Converts a raw image URL/key to a private S3 presigned GET URL.
 * Returns the original URL/string if it is local or invalid.
 */
export async function getPresignedImageUrl(urlOrKey: string, expiresIn = 3600): Promise<string> {
  if (!urlOrKey) return urlOrKey;

  const key = extractS3Key(urlOrKey);
  if (!key) {
    // Return original string if not an S3 key (e.g., /next.svg, local path, etc.)
    return urlOrKey;
  }

  try {
    const { client, bucketName } = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned GET URL for key:", key, error);
    return urlOrKey;
  }
}

/**
 * Helper to process arrays of objects containing photo URLs or photo arrays.
 */
export async function presignPhotos<T extends { url: string }>(photos: T[]): Promise<T[]> {
  if (!photos || photos.length === 0) return photos;
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      url: await getPresignedImageUrl(photo.url),
    }))
  );
}
