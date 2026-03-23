import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { SeasonTeamPlayer } from "@/modules/season-team-players/season-team-player.entity";
import { SeasonTeam } from "@/modules/season-teams/season-team.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { MatchEvent } from "./match-event.entity";
import { MatchEventsController } from "./match-events.controller";
import { MatchEventsService } from "./match-events.service";

@Module({
  imports: [
    SequelizeModule.forFeature([MatchEvent, Match, Team, Player, SeasonTeam, SeasonTeamPlayer]),
    TenancyModule,
  ],
  controllers: [MatchEventsController],
  providers: [MatchEventsService],
  exports: [MatchEventsService],
})
export class MatchEventsModule {}
