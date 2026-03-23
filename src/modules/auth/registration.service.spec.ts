jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("@/utils/slug.util", () => ({
  generateSlug: jest.fn(),
}));

const { BadRequestException, ConflictException, NotFoundException } = require("@nestjs/common");
const { generateSlug } = require("@/utils/slug.util");
const { makeTenant } = require("@/test/factories/tenant.factory");
const { makeUser } = require("@/test/factories/user.factory");
const { createRegistrationServiceTestSetup } = require("@/test/utils/registration-service.utils");

describe("RegistrationService", () => {
  let service;
  let usersService;
  let tenantsService;
  let jwtService;
  let typedEventEmitter;
  let sequelize;
  let transactionMock;

  beforeEach(() => {
    const setup = createRegistrationServiceTestSetup();

    service = setup.service;
    usersService = setup.usersService;
    tenantsService = setup.tenantsService;
    jwtService = setup.jwtService;
    typedEventEmitter = setup.typedEventEmitter;
    sequelize = setup.sequelize;
    transactionMock = setup.transactionMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerOwner", () => {
    it("should create tenant, owner user and access token successfully", async () => {
      const dto = {
        name: "Nahuel",
        email: "nahuel@example.com",
        password: "123456",
        tenantName: "Championship App",
        primaryPosition: "Forward",
        secondaryPosition: "Midfielder",
      };

      const createdTenant = makeTenant({
        id: 10,
        name: "Championship App",
        slug: "championship-app",
      });

      const createdUser = makeUser({
        id: 25,
        name: "Nahuel",
        email: "nahuel@example.com",
        tenantId: 10,
        isAdmin: true,
      });

      generateSlug.mockReturnValue("championship-app");
      tenantsService.generateUniqueSlug.mockResolvedValue("championship-app");
      tenantsService.create.mockResolvedValue(createdTenant);
      usersService.findByEmailInTenant.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(createdUser);
      jwtService.signAsync.mockResolvedValue("mocked-jwt-token");

      const result = await service.registerOwner(dto);

      expect(generateSlug).toHaveBeenCalledWith("Championship App");
      expect(tenantsService.generateUniqueSlug).toHaveBeenCalledWith("championship-app");
      expect(sequelize.transaction).toHaveBeenCalledTimes(1);
      expect(typedEventEmitter.emit).toHaveBeenCalledWith("user.registered", {
        userId: 25,
        tenantId: 10,
        tenantName: "Championship App",
        name: "Nahuel",
        email: "nahuel@example.com",
      });
      expect(result.tenant).toEqual({
        id: 10,
        name: "Championship App",
        slug: "championship-app",
      });
    });

    it("should use name as tenant base name when tenantName is not provided", async () => {
      const dto = {
        name: "Nahuel Mellusso",
        email: "nahuel@example.com",
        password: "123456",
      };

      const createdTenant = makeTenant({
        id: 1,
        name: "Nahuel Mellusso",
        slug: "nahuel-mellusso",
      });

      const createdUser = makeUser({
        id: 2,
        name: "Nahuel Mellusso",
        email: "nahuel@example.com",
        tenantId: 1,
      });

      generateSlug.mockReturnValue("nahuel-mellusso");
      tenantsService.generateUniqueSlug.mockResolvedValue("nahuel-mellusso");
      tenantsService.create.mockResolvedValue(createdTenant);
      usersService.findByEmailInTenant.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(createdUser);
      jwtService.signAsync.mockResolvedValue("token");

      const result = await service.registerOwner(dto);

      expect(generateSlug).toHaveBeenCalledWith("Nahuel Mellusso");
      expect(result.tenant).toEqual({
        id: 1,
        name: "Nahuel Mellusso",
        slug: "nahuel-mellusso",
      });
    });

    it("should throw BadRequestException when tenant base name is empty", async () => {
      const dto = {
        name: "   ",
        email: "nahuel@example.com",
        password: "123456",
        tenantName: "   ",
      };

      const promise = service.registerOwner(dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      expect(typedEventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when email already exists in created tenant", async () => {
      const dto = {
        name: "Nahuel",
        email: "nahuel@example.com",
        password: "123456",
        tenantName: "Championship",
      };

      const createdTenant = makeTenant({
        id: 7,
        name: "Championship",
        slug: "championship",
      });

      const existingUser = makeUser({
        id: 99,
        email: "nahuel@example.com",
        tenantId: 7,
      });

      generateSlug.mockReturnValue("championship");
      tenantsService.generateUniqueSlug.mockResolvedValue("championship");
      tenantsService.create.mockResolvedValue(createdTenant);
      usersService.findByEmailInTenant.mockResolvedValue(existingUser);

      await expect(service.registerOwner(dto)).rejects.toThrow(ConflictException);
      expect(typedEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe("registerUserInTenant", () => {
    it("should create a tenant user and return access token", async () => {
      const dto = {
        name: "Player One",
        email: "player@example.com",
        password: "123456",
        primaryPosition: "Defender",
        secondaryPosition: "Goalkeeper",
      };

      const tenant = makeTenant({
        id: 20,
        name: "Championship",
        slug: "championship",
      });

      const createdUser = makeUser({
        id: 30,
        name: "Player One",
        email: "player@example.com",
        tenantId: 20,
        isAdmin: false,
      });

      tenantsService.findBySlug.mockResolvedValue(tenant);
      usersService.findByEmailInTenant.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(createdUser);
      jwtService.signAsync.mockResolvedValue("tenant-user-token");

      const result = await service.registerUserInTenant(dto, "championship");

      expect(typedEventEmitter.emit).toHaveBeenCalledWith("user.registered", {
        userId: 30,
        tenantId: 20,
        tenantName: "Championship",
        name: "Player One",
        email: "player@example.com",
      });
      expect(result.user).toEqual({
        id: 30,
        name: "Player One",
        email: "player@example.com",
        tenantId: 20,
      });
    });

    it("should throw NotFoundException when tenant does not exist", async () => {
      const dto = {
        name: "Player One",
        email: "player@example.com",
        password: "123456",
      };

      tenantsService.findBySlug.mockResolvedValue(null);

      await expect(service.registerUserInTenant(dto, "unknown-tenant")).rejects.toThrow(
        NotFoundException,
      );
      expect(typedEventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when email already exists in tenant", async () => {
      const dto = {
        name: "Player One",
        email: "player@example.com",
        password: "123456",
      };

      const tenant = makeTenant({
        id: 20,
        name: "Championship",
        slug: "championship",
      });

      const existingUser = makeUser({
        id: 88,
        name: "Player One",
        email: "player@example.com",
        tenantId: 20,
      });

      tenantsService.findBySlug.mockResolvedValue(tenant);
      usersService.findByEmailInTenant.mockResolvedValue(existingUser);

      await expect(service.registerUserInTenant(dto, "championship")).rejects.toThrow(
        ConflictException,
      );
      expect(typedEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
