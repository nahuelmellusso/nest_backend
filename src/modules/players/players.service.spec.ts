jest.mock("./playerPhoto.service", () => {
  return {
    PlayerPhotoService: jest.fn().mockImplementation(() => ({
      upload: jest.fn(),
      deletePhotoIfExists: jest.fn(),
    })),
  };
});

import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { User } from "@/modules/users/user.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { Player } from "./player.entity";
import { PlayerPhotoService } from "./playerPhoto.service";
import { PlayersService } from "./players.service";

describe("PlayersService", () => {
  let service: PlayersService;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockPlayerModel = {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
  };

  const mockPlayerPhotoService = {
    upload: jest.fn(),
    deletePhotoIfExists: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPlayerModel.findOne.mockReset();
    mockPlayerModel.findAndCountAll.mockReset();
    mockPlayerModel.create.mockReset();
    mockUserModel.findOne.mockReset();

    tenantContextService = mockTenantContextService();
    tenantContextService.getTenantId.mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: getModelToken(Player), useValue: mockPlayerModel },
        { provide: getModelToken(User), useValue: mockUserModel },
        { provide: PlayerPhotoService, useValue: mockPlayerPhotoService },
        { provide: TenantContextService, useValue: tenantContextService },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a player by copying user snapshot fields", async () => {
      mockUserModel.findOne.mockResolvedValue({
        id: 5,
        tenantId: 1,
        name: "Lionel Messi",
        avatarFilename: "avatars/5/photo.webp",
        primaryPosition: "FW",
      });
      mockPlayerModel.findOne.mockResolvedValue(null);
      mockPlayerModel.create.mockResolvedValue({ id: 1, userId: 5, fullName: "Lionel Messi" });

      const result = await service.create({ userId: 5 } as any);

      expect(mockPlayerModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        userId: 5,
        firstName: "Lionel",
        lastName: "Messi",
        fullName: "Lionel Messi",
        birthDate: null,
        nationality: null,
        position: "FW",
        photoUrl: "avatars/5/photo.webp",
        isActive: true,
        metadata: null,
      });
      expect(result.id).toBe(1);
    });

    it("should upload photo if file is provided", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      mockUserModel.findOne.mockResolvedValue({
        id: 5,
        tenantId: 1,
        name: "Lionel Messi",
        avatarFilename: null,
        primaryPosition: null,
      });
      mockPlayerModel.findOne.mockResolvedValue(null);
      mockPlayerModel.create.mockResolvedValue({ id: 10, photoUrl: null, save });
      mockPlayerPhotoService.upload.mockResolvedValue({ key: "players/10/photo.webp" });

      const result = await service.create(
        { userId: 5, firstName: "Leo" } as any,
        { originalname: "photo.png", buffer: Buffer.from("img") } as Express.Multer.File,
      );

      expect(mockPlayerPhotoService.upload).toHaveBeenCalledWith(10, expect.any(Object));
      expect(result.photoUrl).toBe("players/10/photo.webp");
      expect(save).toHaveBeenCalled();
    });

    it("should throw when user already has a player in tenant", async () => {
      mockUserModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, name: "Test User" });
      mockPlayerModel.findOne.mockResolvedValue({ id: 2 });

      await expect(service.create({ userId: 5 } as any)).rejects.toThrow(ConflictException);
    });

    it("should throw when tenant context is missing", async () => {
      tenantContextService.getTenantId.mockReturnValue(null as any);

      await expect(service.create({ userId: 5 } as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated players", async () => {
      mockUserModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockPlayerModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, fullName: "Lionel Messi" }],
        count: 1,
      });

      const result = await service.findAll({
        search: "Messi",
        userId: "5" as any,
        nationality: "ar",
        isActive: "true" as any,
        page: "1" as any,
        limit: "10" as any,
      });

      expect(mockPlayerModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          userId: 5,
          nationality: "AR",
          isActive: true,
          [Op.or]: [
            { firstName: { [Op.like]: "%Messi%" } },
            { lastName: { [Op.like]: "%Messi%" } },
            { fullName: { [Op.like]: "%Messi%" } },
          ],
        },
        offset: 0,
        limit: 10,
        order: [["fullName", "ASC"]],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findByUserId", () => {
    it("should throw when player does not exist for user", async () => {
      mockUserModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue(null);

      await expect(service.findByUserId(5)).rejects.toThrow(NotFoundException);
    });
  });
});
