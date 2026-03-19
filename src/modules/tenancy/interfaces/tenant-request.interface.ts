import { Request } from "express";
import { Tenant } from "@/modules/tenants/tenant.entity";
import { TenantDomains } from "@/modules/tenant-domains/tenant-domains.entity";

export interface TenantRequest extends Request {
  tenant?: Tenant;
  tenantDomain?: TenantDomains;
}
