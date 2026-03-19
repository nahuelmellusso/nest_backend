import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { TenantContextService } from "./tenant-context.service";

@Injectable()
export class TenantScopedService {
  constructor(private readonly tenantContextService: TenantContextService) {}

  protected getCurrentTenantId(): number {
    const tenantId = this.tenantContextService.getTenantId();

    if (!tenantId) {
      throw new InternalServerErrorException("Tenant context not available");
    }

    return tenantId;
  }

  protected withTenantWhere<T extends Record<string, any>>(
    where: T = {} as T,
  ): T & {
    tenantId: number;
  } {
    return {
      ...where,
      tenantId: this.getCurrentTenantId(),
    };
  }

  protected withTenantCreateData<T extends Record<string, any>>(
    data: T,
  ): T & {
    tenantId: number;
  } {
    return {
      ...data,
      tenantId: this.getCurrentTenantId(),
    };
  }
}
