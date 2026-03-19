import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { Tenant } from "@/modules/tenants/tenant.entity";

type TenantStore = {
  tenant?: Tenant;
};

@Injectable()
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

  run<T>(callback: () => T, tenant?: Tenant): T {
    return this.asyncLocalStorage.run({ tenant }, callback);
  }

  getTenant(): Tenant | undefined {
    return this.asyncLocalStorage.getStore()?.tenant;
  }

  getTenantId(): number | undefined {
    return this.getTenant()?.id;
  }
}
