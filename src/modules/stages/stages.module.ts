import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { StagesController } from "./stages.controller";
import { StagesService } from "./stages.service";
import { Stage } from "./stage.entity";
import { Season } from "@/modules/seasons/season.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";

@Module({
  imports: [SequelizeModule.forFeature([Stage, Season]), TenancyModule],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
