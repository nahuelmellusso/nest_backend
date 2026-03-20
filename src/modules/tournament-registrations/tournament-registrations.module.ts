import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { PlayersModule } from "@/modules/players/players.module";
import { Player } from "@/modules/players/player.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { Tournament } from "@/modules/tournaments/tournament.entity";
import { TournamentRegistration } from "./tournament-registration.entity";
import { TournamentRegistrationsController } from "./tournament-registrations.controller";
import { TournamentRegistrationsService } from "./tournament-registrations.service";

@Module({
  imports: [
    SequelizeModule.forFeature([TournamentRegistration, Player, Tournament, Season, Team]),
    TenancyModule,
    PlayersModule,
  ],
  controllers: [TournamentRegistrationsController],
  providers: [TournamentRegistrationsService],
  exports: [TournamentRegistrationsService],
})
export class TournamentRegistrationsModule {}
