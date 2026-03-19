import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { SeasonsController } from "./seasons.controller";
import { SeasonsService } from "./seasons.service";
import { Season } from "./season.entity";
import { TournamentsModule } from "../tournaments/tournaments.module";

@Module({
  imports: [SequelizeModule.forFeature([Season]), TournamentsModule],
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
