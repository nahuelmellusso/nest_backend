import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Team } from "./team.entity";
import { TeamsController } from "./teams.controller";
import { TeamsService } from "./teams.service";
import { TeamLogoService } from "./teamLogo.service";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { UploadsModule } from "@/modules/uploads/uploads.module";

@Module({
  imports: [SequelizeModule.forFeature([Team]), TenancyModule, UploadsModule],
  controllers: [TeamsController],
  providers: [TeamsService, TeamLogoService],
  exports: [TeamsService, TeamLogoService],
})
export class TeamsModule {}
