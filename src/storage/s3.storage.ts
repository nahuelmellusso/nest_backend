// src/storage/s3.storage.ts
import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import * as path from "path";
import { StorageProvider, StoredFile } from "./storage.provider";

@Injectable()
export class S3Storage implements StorageProvider {
  private s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  private bucket = process.env.AWS_S3_BUCKET!;

  async upload({ buffer, mimeType, originalName, folder }: any): Promise<StoredFile> {
    const ext = path.extname(originalName) || "";
    const key = `${folder ? folder + "/" : ""}${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return { key, bucket: this.bucket };
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
