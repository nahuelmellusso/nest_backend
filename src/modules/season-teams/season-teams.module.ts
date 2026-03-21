import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { SeasonTeam } from "./season-team.entity";
import { SeasonTeamsController } from "./season-teams.controller";
import { SeasonTeamsService } from "./season-teams.service";

@Module({
  imports: [SequelizeModule.forFeature([SeasonTeam, Season, Team]), TenancyModule],
  controllers: [SeasonTeamsController],
  providers: [SeasonTeamsService],
  exports: [SeasonTeamsService],
})
export class SeasonTeamsModule {}
