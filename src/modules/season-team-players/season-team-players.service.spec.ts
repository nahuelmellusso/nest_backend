import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { SeasonTeamPlayerStatus } from "@/enums/season-team-player-status.enum";
import { Player } from "@/modules/players/player.entity";
import { SeasonTeam } from "@/modules/season-teams/season-team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { SeasonTeamPlayer } from "./season-team-player.entity";
import { SeasonTeamPlayersService } from "./season-team-players.service";

describe("SeasonTeamPlayersService", () => {
  let service: SeasonTeamPlayersService;

  const mockMembershipModel = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
  const mockSeasonTeamModel = { findOne: jest.fn() };
  const mockPlayerModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMembershipModel.findOne.mockReset();
    mockMembershipModel.findAndCountAll.mockReset();
    mockMembershipModel.create.mockReset();
    mockSeasonTeamModel.findOne.mockReset();
    mockPlayerModel.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonTeamPlayersService,
        { provide: getModelToken(SeasonTeamPlayer), useValue: mockMembershipModel },
        { provide: getModelToken(SeasonTeam), useValue: mockSeasonTeamModel },
        { provide: getModelToken(Player), useValue: mockPlayerModel },
        { provide: TenantContextService, useValue: mockTenantContextService() },
      ],
    }).compile();

    service = module.get<SeasonTeamPlayersService>(SeasonTeamPlayersService);
    module
      .get<jest.Mocked<TenantContextService>>(TenantContextService)
      .getTenantId.mockReturnValue(1);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a roster membership when relations are valid", async () => {
      mockSeasonTeamModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockMembershipModel.findOne.mockResolvedValue(null);
      mockMembershipModel.create.mockResolvedValue({ id: 1, seasonTeamId: 5, playerId: 20 });

      const result = await service.create({
        seasonTeamId: 5,
        playerId: 20,
        jerseyNumber: 10,
        isCaptain: true,
        status: SeasonTeamPlayerStatus.ACTIVE,
      } as any);

      expect(mockMembershipModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        seasonTeamId: 5,
        playerId: 20,
        jerseyNumber: 10,
        position: null,
        status: SeasonTeamPlayerStatus.ACTIVE,
        joinedAt: expect.any(Date),
        leftAt: null,
        isCaptain: true,
        metadata: null,
        isActive: true,
      });
      expect(result.id).toBe(1);
    });

    it("should throw when the player is already assigned to the season team", async () => {
      mockSeasonTeamModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockMembershipModel.findOne.mockResolvedValueOnce({ id: 10 });

      await expect(
        service.create({
          seasonTeamId: 5,
          playerId: 20,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when jersey number is already assigned", async () => {
      mockSeasonTeamModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockMembershipModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 11 });

      await expect(
        service.create({
          seasonTeamId: 5,
          playerId: 20,
          jerseyNumber: 10,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when a second captain is assigned", async () => {
      mockSeasonTeamModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockMembershipModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 12 });

      await expect(
        service.create({
          seasonTeamId: 5,
          playerId: 20,
          isCaptain: true,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when leftAt is earlier than joinedAt", async () => {
      mockSeasonTeamModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });

      await expect(
        service.create({
          seasonTeamId: 5,
          playerId: 20,
          joinedAt: "2026-03-20T10:00:00.000Z",
          leftAt: "2026-03-19T10:00:00.000Z",
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated roster memberships", async () => {
      mockSeasonTeamModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockMembershipModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

      const result = await service.findAll({ seasonTeamId: "5" as any } as any);

      expect(mockMembershipModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, seasonTeamId: 5 },
        offset: 0,
        limit: 20,
        order: [
          ["seasonTeamId", "ASC"],
          ["jerseyNumber", "ASC"],
          ["playerId", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should throw when membership is not found", async () => {
      mockMembershipModel.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
