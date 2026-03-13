import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Tournament } from "./tournament.entity";
import { TournamentsController } from "./tournaments.controller";
import { TournamentsService } from "./tournaments.service";
import { TournamentImageService } from "@/modules/tournaments/tournametImage.service";

@Module({
  imports: [SequelizeModule.forFeature([Tournament])],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentImageService],
  exports: [TournamentsService, TournamentImageService],
})
export class TournamentsModule {}
