import { BadRequestException, Injectable } from "@nestjs/common";
import { ImageUploadService } from "@/modules/uploads/services/ImageUploadService";
@Injectable()
export class TournamentImageService {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  async upload(userId: number, file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException("Image file is required");

    const MAX_SIZE = 512;

    return this.imageUploadService.uploadImage(file, {
      folder: `tournaments/${userId}`,
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: "cover",
      quality: 82,
    });
  }

  async deleteImageIfExists(key?: string | null) {
    await this.imageUploadService.deleteFileIfExists(key);
  }
}
