import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { UploadsModule } from "@/modules/uploads/uploads.module";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { User } from "@/modules/users/user.entity";
import { Player } from "./player.entity";
import { PlayerPhotoService } from "./playerPhoto.service";
import { PlayersController } from "./players.controller";
import { PlayersService } from "./players.service";

@Module({
  imports: [SequelizeModule.forFeature([Player, User]), TenancyModule, UploadsModule],
  controllers: [PlayersController],
  providers: [PlayersService, PlayerPhotoService],
  exports: [PlayersService, PlayerPhotoService],
})
export class PlayersModule {}
