import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { SeasonTeamStatus } from "@/enums/season-team-status.enum";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { SeasonTeam } from "./season-team.entity";
import { SeasonTeamsService } from "./season-teams.service";

describe("SeasonTeamsService", () => {
  let service: SeasonTeamsService;

  const mockSeasonTeamModel = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
  const mockSeasonModel = { findOne: jest.fn() };
  const mockTeamModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSeasonTeamModel.findOne.mockReset();
    mockSeasonTeamModel.findAndCountAll.mockReset();
    mockSeasonTeamModel.create.mockReset();
    mockSeasonModel.findOne.mockReset();
    mockTeamModel.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonTeamsService,
        { provide: getModelToken(SeasonTeam), useValue: mockSeasonTeamModel },
        { provide: getModelToken(Season), useValue: mockSeasonModel },
        { provide: getModelToken(Team), useValue: mockTeamModel },
        { provide: TenantContextService, useValue: mockTenantContextService() },
      ],
    }).compile();

    service = module.get<SeasonTeamsService>(SeasonTeamsService);
    module
      .get<jest.Mocked<TenantContextService>>(TenantContextService)
      .getTenantId.mockReturnValue(1);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a season team row when relations are valid", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockSeasonTeamModel.findOne.mockResolvedValue(null);
      mockSeasonTeamModel.create.mockResolvedValue({ id: 1, seasonId: 5, teamId: 20 });

      const result = await service.create({
        seasonId: 5,
        teamId: 20,
        status: SeasonTeamStatus.CONFIRMED,
        seed: 1,
        groupName: "A",
      } as any);

      expect(mockSeasonTeamModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        seasonId: 5,
        teamId: 20,
        status: SeasonTeamStatus.CONFIRMED,
        registeredAt: expect.any(Date),
        seed: 1,
        groupName: "A",
        notes: null,
        metadata: null,
        isActive: true,
      });
      expect(result.id).toBe(1);
    });

    it("should throw when the team is already registered in the season", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockSeasonTeamModel.findOne.mockResolvedValueOnce({ id: 10 });

      await expect(
        service.create({
          seasonId: 5,
          teamId: 20,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when the seed is already assigned in the season", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockSeasonTeamModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 11 });

      await expect(
        service.create({
          seasonId: 5,
          teamId: 20,
          seed: 1,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("should return paginated season teams", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 5, tenantId: 1 });
      mockSeasonTeamModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

      const result = await service.findAll({ seasonId: "5" as any } as any);

      expect(mockSeasonTeamModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, seasonId: 5 },
        offset: 0,
        limit: 20,
        order: [
          ["seasonId", "ASC"],
          ["seed", "ASC"],
          ["teamId", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should throw when season team is not found", async () => {
      mockSeasonTeamModel.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
