import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Sport } from "./sport.entity";
import { SportsController } from "./sports.controller";
import { SportsService } from "./sports.service";

@Module({
  imports: [SequelizeModule.forFeature([Sport])],
  controllers: [SportsController],
  providers: [SportsService],
  exports: [SportsService],
})
export class SportsModule {}
