import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const bucket = process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS S3 configuration missing. Set AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.',
      );
    }

    this.region = region;
    this.bucket = bucket;
    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  /**
   * Upload a file to S3 and return its object key (not the full URL).
   * Use {@link getUrl} to derive the public URL when needed.
   *
   * @param file       The file buffer and metadata from Multer.
   * @param keyPrefix  S3 key prefix, e.g. "avatars/42".
   * @returns          The S3 object key, e.g. "avatars/42/<uuid>.webp".
   */
  async uploadFile(
    file: Express.Multer.File,
    keyPrefix: string,
  ): Promise<string> {
    const ext = extname(file.originalname).toLowerCase();
    const key = `${keyPrefix}/${randomUUID()}${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Tiedoston lataus epäonnistui: ${(err as Error).message}`,
      );
    }

    return key;
  }

  /**
   * Generate the public HTTPS URL for a stored S3 object key.
   *
   * @param key  The S3 object key, e.g. "avatars/42/<uuid>.webp".
   * @returns    Full public URL.
   */
  getUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Delete an S3 object by its key.
   *
   * @param key  The S3 object key to delete.
   */
  async deleteByKey(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Tiedoston poisto epäonnistui: ${(err as Error).message}`,
      );
    }
  }
}
