import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { MatchStatus } from "@/enums/match-status.enum";
import { Round } from "@/modules/rounds/round.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { Match } from "./match.entity";
import { MatchesService } from "./matches.service";

describe("MatchesService", () => {
  let service: MatchesService;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockMatchModel = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
  const mockSeasonModel = { findOne: jest.fn() };
  const mockStageModel = { findOne: jest.fn() };
  const mockRoundModel = { findOne: jest.fn() };
  const mockTeamModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMatchModel.findOne.mockReset();
    mockMatchModel.findAndCountAll.mockReset();
    mockMatchModel.create.mockReset();
    mockSeasonModel.findOne.mockReset();
    mockStageModel.findOne.mockReset();
    mockRoundModel.findOne.mockReset();
    mockTeamModel.findOne.mockReset();

    tenantContextService = mockTenantContextService();
    tenantContextService.getTenantId.mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: getModelToken(Match), useValue: mockMatchModel },
        { provide: getModelToken(Season), useValue: mockSeasonModel },
        { provide: getModelToken(Stage), useValue: mockStageModel },
        { provide: getModelToken(Round), useValue: mockRoundModel },
        { provide: getModelToken(Team), useValue: mockTeamModel },
        { provide: TenantContextService, useValue: tenantContextService },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a match when hierarchy and teams are valid", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 3, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, seasonId: 3 });
      mockRoundModel.findOne.mockResolvedValue({ id: 7, tenantId: 1, stageId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 10, tenantId: 1 });
      mockMatchModel.findOne.mockResolvedValue(null);
      mockMatchModel.create.mockResolvedValue({ id: 1, seasonId: 3, stageId: 5, roundId: 7 });

      const result = await service.create({
        seasonId: 3,
        stageId: 5,
        roundId: 7,
        homeTeamId: 10,
        awayTeamId: 11,
        matchDate: "2026-03-25T20:00:00.000Z",
        status: MatchStatus.SCHEDULED,
      } as any);

      expect(mockMatchModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          seasonId: 3,
          stageId: 5,
          roundId: 7,
          homeTeamId: 10,
          awayTeamId: 11,
          status: MatchStatus.SCHEDULED,
        }),
      );
      expect(result.id).toBe(1);
    });

    it("should throw when teams are the same", async () => {
      await expect(
        service.create({
          seasonId: 3,
          stageId: 5,
          roundId: 7,
          homeTeamId: 10,
          awayTeamId: 10,
          matchDate: "2026-03-25T20:00:00.000Z",
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when stage does not belong to season", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 3, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, seasonId: 99 });
      mockRoundModel.findOne.mockResolvedValue({ id: 7, tenantId: 1, stageId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 10, tenantId: 1 });

      await expect(
        service.create({
          seasonId: 3,
          stageId: 5,
          roundId: 7,
          homeTeamId: 10,
          awayTeamId: 11,
          matchDate: "2026-03-25T20:00:00.000Z",
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when fixture already exists in round", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 3, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue({ id: 5, tenantId: 1, seasonId: 3 });
      mockRoundModel.findOne.mockResolvedValue({ id: 7, tenantId: 1, stageId: 5 });
      mockTeamModel.findOne.mockResolvedValue({ id: 10, tenantId: 1 });
      mockMatchModel.findOne.mockResolvedValue({ id: 88 });

      await expect(
        service.create({
          seasonId: 3,
          stageId: 5,
          roundId: 7,
          homeTeamId: 10,
          awayTeamId: 11,
          matchDate: "2026-03-25T20:00:00.000Z",
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when tenant context is missing", async () => {
      tenantContextService.getTenantId.mockReturnValue(null as any);

      await expect(
        service.create({
          seasonId: 3,
          stageId: 5,
          roundId: 7,
          homeTeamId: 10,
          awayTeamId: 11,
          matchDate: "2026-03-25T20:00:00.000Z",
        } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findAll", () => {
    it("should return tenant-scoped paginated matches", async () => {
      mockRoundModel.findOne.mockResolvedValue({ id: 7, tenantId: 1, stageId: 5 });
      mockMatchModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, stadium: "Monumental" }],
        count: 1,
      });

      const result = await service.findAll({
        roundId: "7" as any,
        search: "Monu",
        status: MatchStatus.SCHEDULED,
        isActive: "true" as any,
        page: "1" as any,
        limit: "10" as any,
      });

      expect(mockMatchModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          roundId: 7,
          stadium: { [Op.like]: "%Monu%" },
          status: MatchStatus.SCHEDULED,
          isActive: true,
        },
        offset: 0,
        limit: 10,
        order: [
          ["matchDate", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findByRound", () => {
    it("should list matches for one round", async () => {
      mockRoundModel.findOne.mockResolvedValue({ id: 7, tenantId: 1, stageId: 5 });
      mockMatchModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 2, roundId: 7 }], count: 1 });

      const result = await service.findByRound(7, { limit: "5" as any });

      expect(mockMatchModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, roundId: 7 },
        offset: 0,
        limit: 5,
        order: [
          ["matchDate", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should update scores and status", async () => {
      const update = jest.fn().mockResolvedValue({ id: 9, status: MatchStatus.COMPLETED });
      mockMatchModel.findOne.mockResolvedValue({
        id: 9,
        seasonId: 3,
        stageId: 5,
        roundId: 7,
        homeTeamId: 10,
        awayTeamId: 11,
        homeScore: null,
        awayScore: null,
        homePenaltyScore: null,
        awayPenaltyScore: null,
        status: MatchStatus.SCHEDULED,
        update,
      });

      const result = await service.update(9, {
        homeScore: 2,
        awayScore: 1,
        status: MatchStatus.COMPLETED,
      } as any);

      expect(update).toHaveBeenCalledWith({
        homeScore: 2,
        awayScore: 1,
        status: MatchStatus.COMPLETED,
      });
      expect(result.status).toBe(MatchStatus.COMPLETED);
    });
  });

  describe("findById", () => {
    it("should throw when match is not found", async () => {
      mockMatchModel.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
