import { BadRequestException, Injectable } from "@nestjs/common";
import { ImageUploadService } from "@/modules/uploads/services/ImageUploadService";

@Injectable()
export class TeamLogoService {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  async upload(teamId: number, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Logo image file is required");
    }

    const MAX_SIZE = 512;

    return this.imageUploadService.uploadImage(file, {
      folder: `teams/${teamId}`,
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: "cover",
      quality: 82,
    });
  }

  async deleteLogoIfExists(key?: string | null) {
    await this.imageUploadService.deleteFileIfExists(key);
  }
}
