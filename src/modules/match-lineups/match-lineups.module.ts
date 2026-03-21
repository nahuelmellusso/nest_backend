import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { MatchLineup } from "./match-lineup.entity";
import { MatchLineupsController } from "./match-lineups.controller";
import { MatchLineupsService } from "./match-lineups.service";

@Module({
  imports: [SequelizeModule.forFeature([MatchLineup, Match, Team, Player]), TenancyModule],
  controllers: [MatchLineupsController],
  providers: [MatchLineupsService],
  exports: [MatchLineupsService],
})
export class MatchLineupsModule {}
