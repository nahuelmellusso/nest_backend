import { BadRequestException, Injectable } from "@nestjs/common";
import { ImageUploadService } from "@/modules/uploads/services/ImageUploadService";
@Injectable()
export class UserAvatarService {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException("Avatar file is required");

    const MAX_SIZE = 512;

    return this.imageUploadService.uploadImage(file, {
      folder: `avatars/${userId}`,
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: "cover",
      quality: 82,
    });
  }

  async deleteAvatarIfExists(key?: string | null) {
    await this.imageUploadService.deleteFileIfExists(key);
  }
}
