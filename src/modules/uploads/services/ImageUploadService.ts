import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { STORAGE } from "@/storage/storage.module";
import type { StorageProvider } from "@/storage/storage.provider";
import sharp from "sharp";
import { randomUUID } from "crypto";

type UploadImageOptions = {
  folder: string;
  width: number;
  height: number;
  fit?: keyof sharp.FitEnum;
  quality?: number;
  fileName?: string;
};

@Injectable()
export class ImageUploadService {
  constructor(@Inject(STORAGE) private readonly storage: StorageProvider) {}

  async uploadImage(file: Express.Multer.File, options: UploadImageOptions) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Image file is required");
    }

    const image = sharp(file.buffer, { failOn: "error" });
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException("Invalid image");
    }

    const outputBuffer = await image
      .resize(options.width, options.height, {
        fit: options.fit ?? "cover",
        position: "center",
      })
      .webp({ quality: options.quality ?? 82 })
      .toBuffer();

    const fileName = `${randomUUID()}.webp`;

    return this.storage.upload({
      buffer: outputBuffer,
      mimeType: "image/webp",
      originalName: fileName,
      folder: options.folder,
    });
  }

  async deleteFileIfExists(key?: string | null) {
    if (!key) return;
    await this.storage.delete?.(key).catch(() => undefined);
  }
}
