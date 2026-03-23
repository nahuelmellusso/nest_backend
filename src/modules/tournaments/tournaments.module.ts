import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Tournament } from "./tournament.entity";
import { TournamentsController } from "./tournaments.controller";
import { TournamentsService } from "./tournaments.service";
import { TournamentImageService } from "@/modules/tournaments/tournamentImage.service";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { UploadsModule } from "@/modules/uploads/uploads.module";
import { SportsModule } from "@/modules/sports/sports.module";

@Module({
  imports: [SequelizeModule.forFeature([Tournament]), TenancyModule, UploadsModule, SportsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentImageService],
  exports: [TournamentsService, TournamentImageService],
})
export class TournamentsModule {}
