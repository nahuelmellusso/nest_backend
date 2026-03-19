export const makeUser = (overrides = {}) => ({
  id: 1,
  name: "Nahuel",
  email: "nahuel@example.com",
  tenantId: 1,
  isAdmin: false,
  isEmailVerified: false,
  primaryPosition: null,
  secondaryPosition: null,
  avatarFilename: null,
  ...overrides,
});

export const makeOwnerUser = (overrides = {}) =>
  makeUser({
    isAdmin: true,
    ...overrides,
  });

export const makeTenantUser = (overrides = {}) =>
  makeUser({
    isAdmin: false,
    ...overrides,
  });
