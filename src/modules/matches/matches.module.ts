import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Match } from "./match.entity";
import { MatchesController } from "./matches.controller";
import { MatchesService } from "./matches.service";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Round } from "@/modules/rounds/round.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";

@Module({
  imports: [SequelizeModule.forFeature([Match, Season, Stage, Round, Team]), TenancyModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
