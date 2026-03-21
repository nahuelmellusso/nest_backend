import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { MatchLineupRole } from "@/enums/match-lineup-role.enum";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { MatchLineup } from "./match-lineup.entity";
import { MatchLineupsService } from "./match-lineups.service";

describe("MatchLineupsService", () => {
  let service: MatchLineupsService;

  const mockLineupModel = { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() };
  const mockMatchModel = { findOne: jest.fn() };
  const mockTeamModel = { findOne: jest.fn() };
  const mockPlayerModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLineupModel.findOne.mockReset();
    mockLineupModel.findAndCountAll.mockReset();
    mockLineupModel.create.mockReset();
    mockMatchModel.findOne.mockReset();
    mockTeamModel.findOne.mockReset();
    mockPlayerModel.findOne.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchLineupsService,
        { provide: getModelToken(MatchLineup), useValue: mockLineupModel },
        { provide: getModelToken(Match), useValue: mockMatchModel },
        { provide: getModelToken(Team), useValue: mockTeamModel },
        { provide: getModelToken(Player), useValue: mockPlayerModel },
        { provide: TenantContextService, useValue: mockTenantContextService() },
      ],
    }).compile();

    service = module.get<MatchLineupsService>(MatchLineupsService);
    module
      .get<jest.Mocked<TenantContextService>>(TenantContextService)
      .getTenantId.mockReturnValue(1);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a lineup when relations are valid", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockLineupModel.findOne.mockResolvedValue(null);
      mockLineupModel.create.mockResolvedValue({ id: 1, matchId: 4, teamId: 20, playerId: 8 });

      const result = await service.create({
        matchId: 4,
        teamId: 20,
        playerId: 8,
        role: MatchLineupRole.STARTER,
        shirtNumber: 10,
        isCaptain: true,
        minuteIn: 0,
      } as any);

      expect(mockLineupModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        matchId: 4,
        teamId: 20,
        playerId: 8,
        role: MatchLineupRole.STARTER,
        position: null,
        shirtNumber: 10,
        isCaptain: true,
        minuteIn: 0,
        minuteOut: null,
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
      mockPlayerModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });

      await expect(
        service.create({
          matchId: 4,
          teamId: 30,
          playerId: 8,
          role: MatchLineupRole.STARTER,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw when the player is already assigned to the same team in the match", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockLineupModel.findOne.mockResolvedValueOnce({ id: 99 });

      await expect(
        service.create({
          matchId: 4,
          teamId: 20,
          playerId: 8,
          role: MatchLineupRole.STARTER,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when a second captain is assigned to the same team", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockLineupModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 50 });

      await expect(
        service.create({
          matchId: 4,
          teamId: 20,
          playerId: 8,
          role: MatchLineupRole.STARTER,
          isCaptain: true,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when minuteOut is earlier than minuteIn", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockTeamModel.findOne.mockResolvedValue({ id: 20, tenantId: 1 });
      mockPlayerModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockLineupModel.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          matchId: 4,
          teamId: 20,
          playerId: 8,
          role: MatchLineupRole.SUBSTITUTE,
          minuteIn: 70,
          minuteOut: 65,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated lineups", async () => {
      mockMatchModel.findOne.mockResolvedValue({
        id: 4,
        tenantId: 1,
        homeTeamId: 20,
        awayTeamId: 21,
      });
      mockLineupModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

      const result = await service.findAll({
        matchId: "4" as any,
        role: MatchLineupRole.STARTER,
      } as any);

      expect(mockLineupModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, matchId: 4, role: MatchLineupRole.STARTER },
        offset: 0,
        limit: 30,
        order: [
          ["matchId", "ASC"],
          ["teamId", "ASC"],
          ["role", "ASC"],
          ["shirtNumber", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should throw when lineup is not found", async () => {
      mockLineupModel.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
