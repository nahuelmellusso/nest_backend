import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Tenant } from "@/modules/tenants/tenant.entity";
import { TenantRequest } from "../interfaces/tenant-request.interface";

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Tenant | undefined => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    return request.tenant;
  },
);
