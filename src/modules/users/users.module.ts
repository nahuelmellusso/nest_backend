import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UserAvatarService } from "./avatar.service";
import { User } from "./user.entity";
import { databaseProviders } from "../../database/database.providers";
import { StorageModule } from "../../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserAvatarService,
    {
      provide: "USER_REPOSITORY",
      useValue: User,
    },
    ...databaseProviders,
  ],
  exports: [UsersService],
})
export class UsersModule {}
