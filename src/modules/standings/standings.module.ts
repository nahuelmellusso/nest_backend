import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { Standing } from "./standing.entity";
import { StandingsController } from "./standings.controller";
import { StandingsService } from "./standings.service";

@Module({
  imports: [SequelizeModule.forFeature([Standing, Season, Stage, Team]), TenancyModule],
  controllers: [StandingsController],
  providers: [StandingsService],
  exports: [StandingsService],
})
export class StandingsModule {}
