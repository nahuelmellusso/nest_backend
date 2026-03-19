import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Tenant } from "../tenants/tenant.entity";
import { TenantDomains } from "../tenant-domains/tenant-domains.entity";
import { TenantResolverMiddleware } from "./middleware/tenant-resolver.middleware";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

//@todo check middleware y context service

@Module({
  imports: [SequelizeModule.forFeature([Tenant, TenantDomains])],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenancyModule {}
