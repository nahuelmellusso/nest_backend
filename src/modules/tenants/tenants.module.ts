import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { TenantsService } from "./tenants.service";
import { Tenant } from "./tenant.entity";

@Module({
  imports: [SequelizeModule.forFeature([Tenant])],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
