import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegistrationService } from "./registration.service";
import { UsersService } from "@/modules/users/users.service";
import { TenantsService } from "@/modules/tenants/tenants.service";
import { generateSlug } from "@/utils/slug.util";
import { makeTenant } from "@/test/factories/tenant.factory";
import { makeUser } from "@/test/factories/user.factory";
import { createRegistrationServiceTestSetup } from "@/test/utils/registration-service.utils";
import type { TransactionMock } from "@/test/helpers/mock-sequelize-transaction";

jest.mock("@/utils/slug.util", () => ({
  generateSlug: jest.fn(),
}));

describe("RegistrationService", () => {
  let service: RegistrationService;
  let usersService: jest.Mocked<UsersService>;
  let tenantsService: jest.Mocked<TenantsService>;
  let jwtService: jest.Mocked<JwtService>;
  let sequelize: {
    transaction: jest.Mock;
  };
  let transactionMock: TransactionMock;

  beforeEach(() => {
    const setup = createRegistrationServiceTestSetup();

    service = setup.service;
    usersService = setup.usersService;
    tenantsService = setup.tenantsService;
    jwtService = setup.jwtService;
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

      (generateSlug as jest.Mock).mockReturnValue("championship-app");
      tenantsService.generateUniqueSlug.mockResolvedValue("championship-app");
      tenantsService.create.mockResolvedValue(createdTenant as never);
      usersService.findByEmailInTenant.mockResolvedValue(null as never);
      usersService.createUser.mockResolvedValue(createdUser as never);
      jwtService.signAsync.mockResolvedValue("mocked-jwt-token");

      const result = await service.registerOwner(dto as any);

      expect(generateSlug).toHaveBeenCalledWith("Championship App");
      expect(tenantsService.generateUniqueSlug).toHaveBeenCalledWith("championship-app");
      expect(sequelize.transaction).toHaveBeenCalledTimes(1);

      expect(tenantsService.create).toHaveBeenCalledWith(
        {
          name: "Championship App",
          slug: "championship-app",
          status: "active",
        },
        transactionMock,
      );

      expect(usersService.findByEmailInTenant).toHaveBeenCalledWith(
        "nahuel@example.com",
        10,
        false,
        transactionMock,
      );

      expect(usersService.createUser).toHaveBeenCalledWith(
        {
          name: "Nahuel",
          email: "nahuel@example.com",
          password: "123456",
          tenantId: 10,
          isEmailVerified: false,
          isAdmin: true,
          primaryPosition: "Forward",
          secondaryPosition: "Midfielder",
          avatarFilename: null,
        },
        transactionMock,
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 25,
        email: "nahuel@example.com",
        tenantId: 10,
      });

      expect(result).toEqual({
        accessToken: "mocked-jwt-token",
        user: {
          id: 25,
          name: "Nahuel",
          email: "nahuel@example.com",
          tenantId: 10,
        },
        tenant: {
          id: 10,
          name: "Championship App",
          slug: "championship-app",
        },
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

      (generateSlug as jest.Mock).mockReturnValue("nahuel-mellusso");
      tenantsService.generateUniqueSlug.mockResolvedValue("nahuel-mellusso");
      tenantsService.create.mockResolvedValue(createdTenant as never);
      usersService.findByEmailInTenant.mockResolvedValue(null as never);
      usersService.createUser.mockResolvedValue(createdUser as never);
      jwtService.signAsync.mockResolvedValue("token");

      const result = await service.registerOwner(dto as any);

      expect(generateSlug).toHaveBeenCalledWith("Nahuel Mellusso");
      expect(tenantsService.create).toHaveBeenCalledWith(
        {
          name: "Nahuel Mellusso",
          slug: "nahuel-mellusso",
          status: "active",
        },
        transactionMock,
      );

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

      const promise = service.registerOwner(dto as any);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow("Tenant name is required");

      expect(generateSlug).not.toHaveBeenCalled();
      expect(tenantsService.generateUniqueSlug).not.toHaveBeenCalled();
      expect(sequelize.transaction).not.toHaveBeenCalled();
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

      (generateSlug as jest.Mock).mockReturnValue("championship");
      tenantsService.generateUniqueSlug.mockResolvedValue("championship");
      tenantsService.create.mockResolvedValue(createdTenant as never);
      usersService.findByEmailInTenant.mockResolvedValue(existingUser as never);

      await expect(service.registerOwner(dto as any)).rejects.toThrow(ConflictException);
      await expect(service.registerOwner(dto as any)).rejects.toThrow(
        "Email already exists in this tenant",
      );

      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it("should set nullable optional positions to null when not provided", async () => {
      const dto = {
        name: "Nahuel",
        email: "nahuel@example.com",
        password: "123456",
        tenantName: "Championship",
      };

      const createdTenant = makeTenant({
        id: 3,
        name: "Championship",
        slug: "championship",
      });

      const createdUser = makeUser({
        id: 4,
        name: "Nahuel",
        email: "nahuel@example.com",
        tenantId: 3,
        isAdmin: true,
      });

      (generateSlug as jest.Mock).mockReturnValue("championship");
      tenantsService.generateUniqueSlug.mockResolvedValue("championship");
      tenantsService.create.mockResolvedValue(createdTenant as never);
      usersService.findByEmailInTenant.mockResolvedValue(null as never);
      usersService.createUser.mockResolvedValue(createdUser as never);
      jwtService.signAsync.mockResolvedValue("token");

      await service.registerOwner(dto as any);

      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryPosition: null,
          secondaryPosition: null,
          avatarFilename: null,
          isAdmin: true,
          isEmailVerified: false,
        }),
        transactionMock,
      );
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

      tenantsService.findBySlug.mockResolvedValue(tenant as never);
      usersService.findByEmailInTenant.mockResolvedValue(null as never);
      usersService.createUser.mockResolvedValue(createdUser as never);
      jwtService.signAsync.mockResolvedValue("tenant-user-token");

      const result = await service.registerUserInTenant(dto as any, "championship");

      expect(tenantsService.findBySlug).toHaveBeenCalledWith("championship");
      expect(usersService.findByEmailInTenant).toHaveBeenCalledWith("player@example.com", 20);

      expect(usersService.createUser).toHaveBeenCalledWith({
        name: "Player One",
        email: "player@example.com",
        password: "123456",
        tenantId: 20,
        isEmailVerified: false,
        isAdmin: false,
        primaryPosition: "Defender",
        secondaryPosition: "Goalkeeper",
        avatarFilename: null,
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 30,
        email: "player@example.com",
        tenantId: 20,
      });

      expect(result).toEqual({
        accessToken: "tenant-user-token",
        user: {
          id: 30,
          name: "Player One",
          email: "player@example.com",
          tenantId: 20,
        },
        tenant: {
          id: 20,
          name: "Championship",
          slug: "championship",
        },
      });
    });

    it("should throw NotFoundException when tenant does not exist", async () => {
      const dto = {
        name: "Player One",
        email: "player@example.com",
        password: "123456",
      };

      tenantsService.findBySlug.mockResolvedValue(null as never);

      await expect(service.registerUserInTenant(dto as any, "unknown-tenant")).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.registerUserInTenant(dto as any, "unknown-tenant")).rejects.toThrow(
        "Tenant not found",
      );

      expect(usersService.findByEmailInTenant).not.toHaveBeenCalled();
      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
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

      tenantsService.findBySlug.mockResolvedValue(tenant as never);
      usersService.findByEmailInTenant.mockResolvedValue(existingUser as never);

      await expect(service.registerUserInTenant(dto as any, "championship")).rejects.toThrow(
        ConflictException,
      );

      await expect(service.registerUserInTenant(dto as any, "championship")).rejects.toThrow(
        "Email already exists in this tenant",
      );

      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it("should set optional positions as null for tenant user when not provided", async () => {
      const dto = {
        name: "Player One",
        email: "player@example.com",
        password: "123456",
      };

      const tenant = makeTenant({
        id: 50,
        name: "Tournament X",
        slug: "tournament-x",
      });

      const createdUser = makeUser({
        id: 60,
        name: "Player One",
        email: "player@example.com",
        tenantId: 50,
        isAdmin: false,
      });

      tenantsService.findBySlug.mockResolvedValue(tenant as never);
      usersService.findByEmailInTenant.mockResolvedValue(null as never);
      usersService.createUser.mockResolvedValue(createdUser as never);
      jwtService.signAsync.mockResolvedValue("token");

      await service.registerUserInTenant(dto as any, "tournament-x");

      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: false,
          isEmailVerified: false,
          primaryPosition: null,
          secondaryPosition: null,
          avatarFilename: null,
          tenantId: 50,
          email: "player@example.com",
          name: "Player One",
          password: "123456",
        }),
      );
    });
  });
});
