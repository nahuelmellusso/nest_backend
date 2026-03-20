import { BadRequestException, Injectable } from "@nestjs/common";
import { ImageUploadService } from "@/modules/uploads/services/ImageUploadService";

@Injectable()
export class PlayerPhotoService {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  async upload(playerId: number, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Player photo file is required");
    }

    return this.imageUploadService.uploadImage(file, {
      folder: `players/${playerId}`,
      width: 512,
      height: 512,
      fit: "cover",
      quality: 82,
    });
  }

  async deletePhotoIfExists(key?: string | null) {
    await this.imageUploadService.deleteFileIfExists(key);
  }
}
