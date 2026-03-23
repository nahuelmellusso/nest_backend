import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Player } from "@/modules/players/player.entity";
import { SeasonTeam } from "@/modules/season-teams/season-team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { SeasonTeamPlayer } from "./season-team-player.entity";
import { SeasonTeamPlayersController } from "./season-team-players.controller";
import { SeasonTeamPlayersService } from "./season-team-players.service";

@Module({
  imports: [SequelizeModule.forFeature([SeasonTeamPlayer, SeasonTeam, Player]), TenancyModule],
  controllers: [SeasonTeamPlayersController],
  providers: [SeasonTeamPlayersService],
  exports: [SeasonTeamPlayersService],
})
export class SeasonTeamPlayersModule {}
