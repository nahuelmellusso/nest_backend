import { Injectable, NestMiddleware, NotFoundException, ForbiddenException } from "@nestjs/common";
import { NextFunction, Response } from "express";
import { InjectModel } from "@nestjs/sequelize";
import { TenantDomains } from "@/modules/tenant-domains/tenant-domains.entity";
import { Tenant } from "@/modules/tenants/tenant.entity";
import { TenantRequest } from "../interfaces/tenant-request.interface";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(TenantDomains)
    private readonly tenantDomainModel: typeof TenantDomains,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const host = this.extractHost(req);

    if (!host) {
      throw new NotFoundException("Tenant host could not be resolved");
    }

    const tenantDomain = await this.tenantDomainModel.findOne({
      where: {
        domain: host,
        isActive: true,
      },
      include: [
        {
          model: Tenant,
          required: true,
        },
      ],
    });

    if (!tenantDomain) {
      throw new NotFoundException(`No tenant found for host: ${host}`);
    }

    if (!tenantDomain.tenant) {
      throw new NotFoundException("Tenant not found");
    }

    if (!tenantDomain.tenant.isActive) {
      throw new ForbiddenException("Tenant is inactive");
    }

    req.tenant = tenantDomain.tenant;
    req.tenantDomain = tenantDomain;

    return this.tenantContextService.run(() => next(), tenantDomain.tenant);
  }

  private extractHost(req: TenantRequest): string | null {
    const forwardedHost = req.headers["x-forwarded-host"];
    const rawHost =
      (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ||
      req.headers.host ||
      req.hostname;

    if (!rawHost || typeof rawHost !== "string") {
      return null;
    }

    return rawHost.split(":")[0].trim().toLowerCase();
  }
}
