import { TenantsService } from "@/modules/tenants/tenants.service";

export const mockTenantsService = (): jest.Mocked<TenantsService> =>
  ({
    generateUniqueSlug: jest.fn(),
    create: jest.fn(),
    findBySlug: jest.fn(),
  }) as unknown as jest.Mocked<TenantsService>;
