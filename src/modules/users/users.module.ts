import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UserAvatarService } from "./avatar.service";
import { User } from "./user.entity";
import { databaseProviders } from "@/database/database.providers";
import { StorageModule } from "@/storage/storage.module";
import { UploadsModule } from "@/modules/uploads/uploads.module";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { TenantsModule } from "@/modules/tenants/tenants.module";

@Module({
  imports: [StorageModule, UploadsModule, TenantsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserAvatarService,
    TenantContextService,
    {
      provide: "USER_REPOSITORY",
      useValue: User,
    },
    ...databaseProviders,
  ],
  exports: [UsersService, UserAvatarService, TenantContextService],
})
export class UsersModule {}
