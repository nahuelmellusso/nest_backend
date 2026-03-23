import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { Standing } from "./standing.entity";
import { StandingsService } from "./standings.service";

describe("StandingsService", () => {
  let service: StandingsService;

  const mockStandingModel = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
  const mockSeasonModel = { findOne: jest.fn() };
  const mockStageModel = { findOne: jest.fn() };
  const mockTeamModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStandingModel.findOne.mockReset();
    mockStandingModel.findAndCountAll.mockReset();
    mockStandingModel.create.mockReset();
    mockSeasonModel.findOne.mockReset();
    mockStageModel.findOne.mockReset();
    mockTeamModel.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StandingsService,
        { provide: getModelToken(Standing), useValue: mockStandingModel },
        { provide: getModelToken(Season), useValue: mockSeasonModel },
        { provide: getModelToken(Stage), useValue: mockStageModel },
        { provide: getModelToken(Team), useValue: mockTeamModel },
        { provide: TenantContextService, useValue: mockTenantContextService() },
      ],
    }).compile();

    service = module.get<StandingsService>(StandingsService);
    module
      .get<jest.Mocked<TenantContextService>>(TenantContextService)
      .getTenantId.mockReturnValue(1);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a standing row when hierarchy and stats are valid", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, ruleset: null });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockStandingModel.findOne.mockResolvedValue(null);
      mockStandingModel.create.mockResolvedValue({ id: 1, stageId: 8, teamId: 20 });

      const result = await service.create({
        seasonId: 5,
        stageId: 8,
        teamId: 20,
        played: 5,
        wins: 3,
        draws: 1,
        losses: 1,
        goalsFor: 9,
        goalsAgainst: 4,
        goalDifference: 5,
        points: 10,
        position: 1,
        lastFiveForm: "WWDWL",
      } as any);

      expect(mockStandingModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        seasonId: 5,
        stageId: 8,
        teamId: 20,
        played: 5,
        wins: 3,
        draws: 1,
        losses: 1,
        goalsFor: 9,
        goalsAgainst: 4,
        goalDifference: 5,
        points: 10,
        position: 1,
        lastFiveForm: "WWDWL",
        notes: null,
      });
      expect(result.id).toBe(1);
    });

    it("should throw when stage does not belong to the season", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, ruleset: null });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 999 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          played: 1,
          wins: 1,
          draws: 0,
          losses: 0,
          goalsFor: 1,
          goalsAgainst: 0,
          goalDifference: 1,
          points: 3,
          position: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when stats are inconsistent", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, ruleset: null });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          played: 4,
          wins: 3,
          draws: 1,
          losses: 1,
          goalsFor: 9,
          goalsAgainst: 4,
          goalDifference: 5,
          points: 10,
          position: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when the team already has a standing row in the stage", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, ruleset: null });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockStandingModel.findOne.mockResolvedValueOnce({ id: 12 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          played: 5,
          wins: 3,
          draws: 1,
          losses: 1,
          goalsFor: 9,
          goalsAgainst: 4,
          goalDifference: 5,
          points: 10,
          position: 1,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when the position is already assigned in the stage", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, ruleset: null });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockStandingModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 13 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          played: 5,
          wins: 3,
          draws: 1,
          losses: 1,
          goalsFor: 9,
          goalsAgainst: 4,
          goalDifference: 5,
          points: 10,
          position: 1,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should honor custom season scoring rules", async () => {
      mockSeasonModel.findOne.mockResolvedValue({
        id: 5,
        tenantId: 1,
        ruleset: {
          sport: "basketball",
          standings: {
            winPoints: 2,
            drawPoints: 0,
            lossPoints: 1,
          },
          match: {
            allowDraws: false,
          },
        },
      });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockStandingModel.findOne.mockResolvedValue(null);
      mockStandingModel.create.mockResolvedValue({ id: 2, stageId: 8, teamId: 20 });

      const result = await service.create({
        seasonId: 5,
        stageId: 8,
        teamId: 20,
        played: 5,
        wins: 3,
        draws: 0,
        losses: 2,
        goalsFor: 400,
        goalsAgainst: 370,
        goalDifference: 30,
        points: 8,
        position: 2,
        lastFiveForm: "WLWLW",
      } as any);

      expect(result.id).toBe(2);
    });

    it("should reject draws when the season ruleset disallows them", async () => {
      mockSeasonModel.findOne.mockResolvedValue({
        id: 5,
        tenantId: 1,
        ruleset: {
          sport: "basketball",
          standings: {
            winPoints: 2,
            drawPoints: 0,
            lossPoints: 1,
          },
          match: {
            allowDraws: false,
          },
        },
      });
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });

      await expect(
        service.create({
          seasonId: 5,
          stageId: 8,
          teamId: 20,
          played: 5,
          wins: 3,
          draws: 1,
          losses: 1,
          goalsFor: 400,
          goalsAgainst: 370,
          goalDifference: 30,
          points: 8,
          position: 2,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated standings ordered by position and points", async () => {
      mockStageModel.findOne.mockResolvedValue({ id: 8, tenantId: 1, seasonId: 5 });
      mockStandingModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

      const result = await service.findAll({ stageId: "8" as any } as any);

      expect(mockStandingModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, stageId: 8 },
        offset: 0,
        limit: 20,
        order: [
          ["stageId", "ASC"],
          ["position", "ASC"],
          ["points", "DESC"],
          ["goalDifference", "DESC"],
          ["goalsFor", "DESC"],
          ["id", "ASC"],
        ],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should throw when standing is not found", async () => {
      mockStandingModel.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
