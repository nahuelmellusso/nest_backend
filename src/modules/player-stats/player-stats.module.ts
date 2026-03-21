import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Player } from "@/modules/players/player.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { PlayerStat } from "./player-stat.entity";
import { PlayerStatsController } from "./player-stats.controller";
import { PlayerStatsService } from "./player-stats.service";

@Module({
  imports: [SequelizeModule.forFeature([PlayerStat, Season, Stage, Team, Player]), TenancyModule],
  controllers: [PlayerStatsController],
  providers: [PlayerStatsService],
  exports: [PlayerStatsService],
})
export class PlayerStatsModule {}
