import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { MatchEventPeriod } from "@/enums/match-event-period.enum";
import { MatchEventType } from "@/enums/match-event-type.enum";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { MatchEvent } from "./match-event.entity";
import { MatchEventsService } from "./match-events.service";

describe("MatchEventsService", () => {
  let service: MatchEventsService;

  const mockEventModel = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
  const mockMatchModel = { findOne: jest.fn() };
  const mockTeamModel = { findOne: jest.fn() };
  const mockPlayerModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockEventModel.findOne.mockReset();
    mockEventModel.findAndCountAll.mockReset();
    mockEventModel.create.mockReset();
    mockMatchModel.findOne.mockReset();
    mockTeamModel.findOne.mockReset();
    mockPlayerModel.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchEventsService,
        { provide: getModelToken(MatchEvent), useValue: mockEventModel },
        { provide: getModelToken(Match), useValue: mockMatchModel },
        { provide: getModelToken(Team), useValue: mockTeamModel },
        { provide: getModelToken(Player), useValue: mockPlayerModel },
        { provide: TenantContextService, useValue: mockTenantContextService() },
      ],
    }).compile();

    service = module.get<MatchEventsService>(MatchEventsService);
    module
      .get<jest.Mocked<TenantContextService>>(TenantContextService)
      .getTenantId.mockReturnValue(1);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a match event when relations are valid", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockEventModel.create.mockResolvedValue({ id: 1, matchId: 4, minute: 15 });

      const result = await service.create({
        matchId: 4,
        teamId: 20,
        playerId: 8,
        type: MatchEventType.GOAL,
        minute: 15,
        period: MatchEventPeriod.FIRST_HALF,
      } as any);

      expect(mockEventModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        matchId: 4,
        teamId: 20,
        playerId: 8,
        relatedPlayerId: null,
        type: MatchEventType.GOAL,
        minute: 15,
        extraMinute: null,
        period: MatchEventPeriod.FIRST_HALF,
        description: null,
      });
      expect(result.id).toBe(1);
    });

    it("should throw when team is not part of the match", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockTeamModel.findOne.mockResolvedValue({ id: 30, tenantId: 1 });

      await expect(
        service.create({
          matchId: 4,
          teamId: 30,
          type: MatchEventType.GOAL,
          minute: 15,
          period: MatchEventPeriod.FIRST_HALF,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when substitution misses related player", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });

      await expect(
        service.create({
          matchId: 4,
          teamId: 20,
          playerId: 8,
          type: MatchEventType.SUBSTITUTION,
          minute: 60,
          period: MatchEventPeriod.SECOND_HALF,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated match events", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockEventModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

      const result = await service.findAll({
        matchId: "4" as any,
        type: MatchEventType.GOAL,
      } as any);

      expect(mockEventModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, matchId: 4, type: MatchEventType.GOAL },
        offset: 0,
        limit: 20,
        order: [
          ["minute", "ASC"],
          ["extraMinute", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should throw when event is not found", async () => {
      mockEventModel.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
