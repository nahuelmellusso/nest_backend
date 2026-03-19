import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserAvatarService } from "./avatar.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { makeUser } from "@/test/factories/user.factory";

describe("UsersService", () => {
  let service: UsersService;

  const userRepositoryMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  };

  const userAvatarServiceMock = {
    uploadAvatar: jest.fn(),
    deleteAvatarIfExists: jest.fn(),
  };

  const tenantContextServiceMock = {
    getTenantId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    tenantContextServiceMock.getTenantId.mockReturnValue(10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: "USER_REPOSITORY",
          useValue: userRepositoryMock,
        },
        {
          provide: UserAvatarService,
          useValue: userAvatarServiceMock,
        },
        {
          provide: TenantContextService,
          useValue: tenantContextServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user successfully inside the current tenant", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test2@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "DF",
      };

      const createdUser = makeUser({
        id: 1,
        name: createUserDto.name,
        email: createUserDto.email,
        tenantId: 10,
        primaryPosition: "GK",
        secondaryPosition: "DF",
        avatarFilename: null,
      });

      userRepositoryMock.findOne.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual({
        success: true,
        data: {
          user: {
            id: 1,
            name: "Test User",
            email: "test2@example.com",
            tenantId: 10,
          },
        },
        message: "User created successfully",
      });

      expect(tenantContextServiceMock.getTenantId).toHaveBeenCalled();

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: createUserDto.email,
            tenantId: 10,
          },
          transaction: undefined,
        }),
      );

      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test User",
          email: "test2@example.com",
          tenantId: 10,
          primaryPosition: "GK",
          secondaryPosition: "DF",
          avatarFilename: null,
          isAdmin: false,
          isEmailVerified: false,
        }),
        { transaction: undefined },
      );
    });

    it("should throw ConflictException if email already exists in the same tenant", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "DF",
      };

      const existingUser = makeUser({
        id: 99,
        email: createUserDto.email,
        tenantId: 10,
      });

      userRepositoryMock.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);

      expect(tenantContextServiceMock.getTenantId).toHaveBeenCalled();

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: createUserDto.email,
            tenantId: 10,
          },
          transaction: undefined,
        }),
      );

      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should allow same email in another tenant", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "shared@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "DF",
      };

      tenantContextServiceMock.getTenantId.mockReturnValue(20);

      userRepositoryMock.findOne.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue(
        makeUser({
          id: 2,
          name: createUserDto.name,
          email: createUserDto.email,
          tenantId: 20,
          primaryPosition: "GK",
          secondaryPosition: "DF",
        }),
      );

      await service.create(createUserDto);

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: createUserDto.email,
            tenantId: 20,
          },
          transaction: undefined,
        }),
      );

      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "shared@example.com",
          tenantId: 20,
          primaryPosition: "GK",
          secondaryPosition: "DF",
        }),
        { transaction: undefined },
      );
    });

    it("should throw BadRequestException if primaryPosition and secondaryPosition are equal", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test3@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "GK",
      };

      userRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);

      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should upload avatar when file is provided", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test4@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "DF",
      };

      const file = {
        fieldname: "avatar",
        originalname: "avatar.png",
        encoding: "7bit",
        mimetype: "image/png",
        buffer: Buffer.from("fake-image"),
        size: 1234,
      } as Express.Multer.File;

      const createdUser = {
        ...makeUser({
          id: 1,
          name: createUserDto.name,
          email: createUserDto.email,
          tenantId: 10,
          avatarFilename: null,
          primaryPosition: "GK",
          secondaryPosition: "DF",
        }),
        save: jest.fn().mockResolvedValue(undefined),
      };

      userRepositoryMock.findOne.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue(createdUser);

      userAvatarServiceMock.uploadAvatar.mockResolvedValue({
        key: "avatars/1/test.webp",
        url: "https://cdn.example.com/avatars/1/test.webp",
      });

      const result = await service.create(createUserDto, file);

      expect(result).toEqual({
        success: true,
        data: {
          user: {
            id: 1,
            name: "Test User",
            email: "test4@example.com",
            tenantId: 10,
          },
        },
        message: "User created successfully",
      });

      expect(userAvatarServiceMock.uploadAvatar).toHaveBeenCalledWith(1, file);
      expect(createdUser.avatarFilename).toBe("avatars/1/test.webp");
      expect(createdUser.save).toHaveBeenCalled();
    });

    it("should store nullable positions as null when they are not provided", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test5@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      userRepositoryMock.findOne.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue(
        makeUser({
          id: 5,
          name: createUserDto.name,
          email: createUserDto.email,
          tenantId: 10,
          primaryPosition: null,
          secondaryPosition: null,
        }),
      );

      await service.create(createUserDto);

      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 10,
          primaryPosition: null,
          secondaryPosition: null,
          avatarFilename: null,
          email: "test5@example.com",
          name: "Test User",
          isAdmin: false,
          isEmailVerified: false,
        }),
        { transaction: undefined },
      );
    });

    it("should throw InternalServerErrorException when tenant context is missing", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test6@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "DF",
      };

      tenantContextServiceMock.getTenantId.mockReturnValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.create(createUserDto)).rejects.toThrow("Tenant context not available");

      expect(userRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });
  });
});
