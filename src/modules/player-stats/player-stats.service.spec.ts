import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Player } from "@/modules/players/player.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { PlayerStat } from "./player-stat.entity";
import { PlayerStatsService } from "./player-stats.service";

describe("PlayerStatsService", () => {
  let service: PlayerStatsService;

  const mockPlayerStatModel = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
  const mockSeasonModel = { findOne: jest.fn() };
  const mockStageModel = { findOne: jest.fn() };
  const mockTeamModel = { findOne: jest.fn() };
  const mockPlayerModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPlayerStatModel.findOne.mockReset();
    mockPlayerStatModel.findAndCountAll.mockReset();
    mockPlayerStatModel.create.mockReset();
    mockSeasonModel.findOne.mockReset();
    mockStageModel.findOne.mockReset();
    mockTeamModel.findOne.mockReset();
    mockPlayerModel.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerStatsService,
        { provide: getModelToken(PlayerStat), useValue: mockPlayerStatModel },
        { provide: getModelToken(Season), useValue: mockSeasonModel },
        { provide: getModelToken(Stage), useValue: mockStageModel },
        { provide: getModelToken(Team), useValue: mockTeamModel },
        { provide: getModelToken(Player), useValue: mockPlayerModel },
        { provide: TenantContextService, useValue: mockTenantContextService() },
      ],
    }).compile();

    service = module.get<PlayerStatsService>(PlayerStatsService);
    module
      .get<jest.Mocked<TenantContextService>>(TenantContextService)
      .getTenantId.mockReturnValue(1);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a player stat row when hierarchy and stats are valid", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 33, tenantId: 1 });
      mockPlayerStatModel.findOne.mockResolvedValue(null);
      mockPlayerStatModel.create.mockResolvedValue({ id: 1, stageId: 8, playerId: 33 });

      const result = await service.create({
        seasonId: 5,
        stageId: 8,
        teamId: 20,
        playerId: 33,
        matchesPlayed: 5,
        matchesStarted: 4,
        minutesPlayed: 410,
        goals: 3,
        assists: 2,
        yellowCards: 1,
        redCards: 0,
        ownGoals: 0,
        cleanSheets: 0,
      } as any);

      expect(mockPlayerStatModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        seasonId: 5,
        stageId: 8,
        teamId: 20,
        playerId: 33,
        matchesPlayed: 5,
        matchesStarted: 4,
        minutesPlayed: 410,
        goals: 3,
        assists: 2,
        yellowCards: 1,
        redCards: 0,
        ownGoals: 0,
        cleanSheets: 0,
      });
      expect(result.id).toBe(1);
    });

    it("should throw when stage does not belong to the season", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 999 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          playerId: 33,
          matchesPlayed: 1,
          matchesStarted: 1,
          minutesPlayed: 90,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          ownGoals: 0,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when matchesStarted is greater than matchesPlayed", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 33, tenantId: 1 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          playerId: 33,
          matchesPlayed: 2,
          matchesStarted: 3,
          minutesPlayed: 180,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          ownGoals: 0,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when the player already has stats for the same team and stage", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 33, tenantId: 1 });
      mockPlayerStatModel.findOne.mockResolvedValueOnce({ id: 10 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          playerId: 33,
          matchesPlayed: 5,
          matchesStarted: 4,
          minutesPlayed: 410,
          goals: 3,
          assists: 2,
          yellowCards: 1,
          redCards: 0,
          ownGoals: 0,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("should return paginated player stats ordered by impact", async () => {
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockPlayerStatModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

      const result = await service.findAll({ stageId: "8" as any } as any);

      expect(mockPlayerStatModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, stageId: 8 },
        offset: 0,
        limit: 20,
        order: [
          ["stageId", "ASC"],
          ["goals", "DESC"],
          ["assists", "DESC"],
          ["minutesPlayed", "DESC"],
          ["id", "ASC"],
        ],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should throw when player stat is not found", async () => {
      mockPlayerStatModel.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
