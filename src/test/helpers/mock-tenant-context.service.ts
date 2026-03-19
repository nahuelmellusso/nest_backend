import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

export const mockTenantContextService = (): jest.Mocked<TenantContextService> =>
  ({
    getTenantId: jest.fn(),
  }) as unknown as jest.Mocked<TenantContextService>;
