jest.mock("@/modules/players/players.service", () => ({ PlayersService: class PlayersService {} }));

import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Player } from "@/modules/players/player.entity";
import { PlayersService } from "@/modules/players/players.service";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { Tournament } from "@/modules/tournaments/tournament.entity";
import { TournamentRegistrationStatus } from "@/enums/tournament-registration-status.enum";
import { TournamentRegistration } from "./tournament-registration.entity";
import { TournamentRegistrationsService } from "./tournament-registrations.service";

describe("TournamentRegistrationsService", () => {
  let service: TournamentRegistrationsService;
  let playersService: jest.Mocked<PlayersService>;

  const mockRegistrationModel = {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  };
  const mockPlayerModel = { findOne: jest.fn() };
  const mockTournamentModel = { findOne: jest.fn() };
  const mockSeasonModel = { findOne: jest.fn() };
  const mockTeamModel = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRegistrationModel.findOne.mockReset();
    mockRegistrationModel.findAndCountAll.mockReset();
    mockRegistrationModel.create.mockReset();
    mockPlayerModel.findOne.mockReset();
    mockTournamentModel.findOne.mockReset();
    mockSeasonModel.findOne.mockReset();
    mockTeamModel.findOne.mockReset();

    playersService = {
      findByUserId: jest.fn(),
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentRegistrationsService,
        { provide: getModelToken(TournamentRegistration), useValue: mockRegistrationModel },
        { provide: getModelToken(Player), useValue: mockPlayerModel },
        { provide: getModelToken(Tournament), useValue: mockTournamentModel },
        { provide: getModelToken(Season), useValue: mockSeasonModel },
        { provide: getModelToken(Team), useValue: mockTeamModel },
        { provide: PlayersService, useValue: playersService },
        { provide: TenantContextService, useValue: mockTenantContextService() },
      ],
    }).compile();

    service = module.get<TournamentRegistrationsService>(TournamentRegistrationsService);
    module
      .get<jest.Mocked<TenantContextService>>(TenantContextService)
      .getTenantId.mockReturnValue(1);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a registration with existing player", async () => {
      mockPlayerModel.findOne.mockResolvedValue({ id: 4, tenantId: 1 });
      mockTournamentModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockSeasonModel.findOne.mockResolvedValue({ id: 12, tenantId: 1, tournamentId: 8 });
      mockRegistrationModel.findOne.mockResolvedValue(null);
      mockRegistrationModel.create.mockResolvedValue({ id: 1, playerId: 4, seasonId: 12 });

      const result = await service.create({
        playerId: 4,
        tournamentId: 8,
        seasonId: 12,
      } as any);

      expect(mockRegistrationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          playerId: 4,
          tournamentId: 8,
          seasonId: 12,
          status: TournamentRegistrationStatus.PENDING,
        }),
      );
      expect(result.id).toBe(1);
    });

    it("should create player from user when player does not exist", async () => {
      playersService.findByUserId.mockRejectedValue(new NotFoundException());
      playersService.create.mockResolvedValue({ id: 9, tenantId: 1 } as any);
      mockTournamentModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockSeasonModel.findOne.mockResolvedValue({ id: 12, tenantId: 1, tournamentId: 8 });
      mockRegistrationModel.findOne.mockResolvedValue(null);
      mockRegistrationModel.create.mockResolvedValue({ id: 2, playerId: 9 });

      const result = await service.create({ userId: 6, tournamentId: 8, seasonId: 12 } as any);

      expect(playersService.create).toHaveBeenCalledWith({ userId: 6 });
      expect(result.id).toBe(2);
    });

    it("should throw when player is already registered in season", async () => {
      mockPlayerModel.findOne.mockResolvedValue({ id: 4, tenantId: 1 });
      mockTournamentModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockSeasonModel.findOne.mockResolvedValue({ id: 12, tenantId: 1, tournamentId: 8 });
      mockRegistrationModel.findOne.mockResolvedValue({ id: 88 });

      await expect(
        service.create({ playerId: 4, tournamentId: 8, seasonId: 12 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("should return paginated registrations", async () => {
      mockTournamentModel.findOne.mockResolvedValue({ id: 8, tenantId: 1 });
      mockRegistrationModel.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

      const result = await service.findAll({ tournamentId: "8" as any, limit: "5" as any } as any);

      expect(mockRegistrationModel.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 1, tournamentId: 8 },
        offset: 0,
        limit: 5,
        order: [["registeredAt", "DESC"]],
      });
      expect(result.meta.total).toBe(1);
    });
  });
});
