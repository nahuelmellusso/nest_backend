import { Module } from "@nestjs/common";
import { LocalStorage } from "./local.storage";
import { S3Storage } from "./s3.storage";

export const STORAGE = Symbol("STORAGE");

@Module({
  providers: [
    {
      provide: STORAGE,
      useClass: process.env.STORAGE_DRIVER === "s3" ? S3Storage : LocalStorage,
    },
  ],
  exports: [STORAGE],
})
export class StorageModule {}
