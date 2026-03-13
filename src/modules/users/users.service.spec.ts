import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, BadRequestException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserAvatarService } from "./avatar.service";

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

  beforeEach(async () => {
    jest.clearAllMocks();

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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "test2@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "DF",
      };

      userRepositoryMock.findOne.mockResolvedValue(null);

      userRepositoryMock.create.mockResolvedValue({
        id: 1,
        name: createUserDto.name,
        email: createUserDto.email,
        password: "hashed_password",
        avatarFilename: null,
        primaryPosition: "GK",
        secondaryPosition: "DF",
      });

      const result = await service.create(createUserDto);

      expect(result).toEqual({
        success: true,
        data: {},
        message: "",
      });

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
        attributes: ["id", "email", "name"],
      });

      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createUserDto.name,
          email: createUserDto.email,
          password: expect.any(String),
          avatarFilename: null,
          primaryPosition: "GK",
          secondaryPosition: "DF",
        }),
      );
    });

    it("should throw ConflictException if email already exists", async () => {
      const createUserDto: CreateUserDto = {
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
        passwordConfirm: "password123",
        primaryPosition: "GK",
        secondaryPosition: "DF",
      };

      userRepositoryMock.findOne.mockResolvedValue({
        id: 99,
        email: createUserDto.email,
      });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);

      expect(userRepositoryMock.create).not.toHaveBeenCalled();
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
        id: 1,
        name: createUserDto.name,
        email: createUserDto.email,
        password: "hashed_password",
        avatarFilename: null,
        primaryPosition: "GK",
        secondaryPosition: "DF",
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
        data: {},
        message: "",
      });

      expect(userAvatarServiceMock.uploadAvatar).toHaveBeenCalledWith(1, file);
      expect(createdUser.avatarFilename).toBe("avatars/1/test.webp");
    });
  });
});
