import { Module } from "@nestjs/common";
import { StorageModule } from "@/storage/storage.module";
import { ImageUploadService } from "./services/ImageUploadService";
@Module({
  imports: [StorageModule],
  providers: [ImageUploadService],
  exports: [ImageUploadService],
})
export class UploadsModule {}
