import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Round } from "./round.entity";
import { RoundsController } from "./rounds.controller";
import { RoundsService } from "./rounds.service";
import { Stage } from "@/modules/stages/stage.entity";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";

@Module({
  imports: [SequelizeModule.forFeature([Round, Stage]), TenancyModule],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
