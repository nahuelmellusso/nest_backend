import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { STORAGE } from "../../storage/storage.module";
import type { StorageProvider } from "../../storage/storage.provider";
import * as sharp from "sharp";

@Injectable()
export class UserAvatarService {
  constructor(@Inject(STORAGE) private readonly storage: StorageProvider) {}

  async uploadAvatar(file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException("Avatar file is required");

    const MAX_SIZE = 512;

    const img = sharp(file.buffer, { failOn: "error" });
    const meta = await img.metadata();
    if (!meta.width || !meta.height) throw new BadRequestException("Invalid image");

    const outBuffer = await img
      .resize(MAX_SIZE, MAX_SIZE, { fit: "cover", position: "center" })
      .webp({ quality: 82 })
      .toBuffer();

    return this.storage.upload({
      buffer: outBuffer,
      mimeType: "image/webp",
      originalName: "avatar.webp",
      folder: "avatars",
    });
  }

  async deleteAvatarIfExists(key?: string | null) {
    if (!key) return;
    await this.storage.delete?.(key).catch(() => undefined);
  }
}
