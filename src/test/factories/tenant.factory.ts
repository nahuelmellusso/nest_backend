type TenantFactoryInput = Partial<{
  id: number;
  name: string;
  slug: string;
  status: string;
}>;

export const makeTenant = (overrides: TenantFactoryInput = {}) => ({
  id: 1,
  name: "Championship",
  slug: "championship",
  status: "active",
  ...overrides,
});
