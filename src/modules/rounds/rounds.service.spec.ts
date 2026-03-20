import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { RoundStatus } from "@/enums/round-status.enum";
import { Stage } from "@/modules/stages/stage.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { Round } from "./round.entity";
import { RoundsService } from "./rounds.service";

describe("RoundsService", () => {
  let service: RoundsService;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockRoundModel = {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  };

  const mockStageModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRoundModel.findOne.mockReset();
    mockRoundModel.findAndCountAll.mockReset();
    mockRoundModel.create.mockReset();
    mockStageModel.findOne.mockReset();

    tenantContextService = mockTenantContextService();
    tenantContextService.getTenantId.mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundsService,
        {
          provide: getModelToken(Round),
          useValue: mockRoundModel,
        },
        {
          provide: getModelToken(Stage),
          useValue: mockStageModel,
        },
        {
          provide: TenantContextService,
          useValue: tenantContextService,
        },
      ],
    }).compile();

    service = module.get<RoundsService>(RoundsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a round inside the current tenant stage", async () => {
      mockStageModel.findOne.mockResolvedValue({ id: 11, tenantId: 1 });
      mockRoundModel.findOne.mockResolvedValue(null);
      mockRoundModel.create.mockResolvedValue({
        id: 1,
        tenantId: 1,
        stageId: 11,
        name: "Round 1",
        roundNumber: 1,
        status: RoundStatus.SCHEDULED,
      });

      const result = await service.create({
        stageId: 11,
        name: "Round 1",
        roundNumber: 1,
        startDate: "2026-03-20",
        endDate: "2026-03-27",
      });

      expect(mockStageModel.findOne).toHaveBeenCalledWith({
        where: { id: 11, tenantId: 1 },
      });
      expect(mockRoundModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        stageId: 11,
        name: "Round 1",
        roundNumber: 1,
        startDate: "2026-03-20",
        endDate: "2026-03-27",
        status: RoundStatus.SCHEDULED,
        settings: null,
        isActive: true,
      });
      expect(result.id).toBe(1);
    });

    it("should throw when round name already exists in stage", async () => {
      mockStageModel.findOne.mockResolvedValue({ id: 11, tenantId: 1 });
      mockRoundModel.findOne.mockResolvedValueOnce({ id: 4 });

      await expect(
        service.create({
          stageId: 11,
          name: "Round 1",
          roundNumber: 2,
          startDate: "2026-03-20",
          endDate: "2026-03-27",
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when tenant context is missing", async () => {
      tenantContextService.getTenantId.mockReturnValue(null as any);

      await expect(
        service.create({
          stageId: 11,
          name: "Round 2",
          roundNumber: 2,
          startDate: "2026-03-28",
          endDate: "2026-04-04",
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findAll", () => {
    it("should return tenant-scoped paginated rounds", async () => {
      mockStageModel.findOne.mockResolvedValue({ id: 11, tenantId: 1 });
      mockRoundModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, name: "Round 1" }],
        count: 1,
      });

      const result = await service.findAll({
        stageId: "11" as any,
        search: "Round",
        status: RoundStatus.SCHEDULED,
        isActive: "true" as any,
        page: "1" as any,
        limit: "10" as any,
      });

      expect(mockRoundModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          stageId: 11,
          name: { [Op.like]: "%Round%" },
          status: RoundStatus.SCHEDULED,
          isActive: true,
        },
        offset: 0,
        limit: 10,
        order: [
          ["stageId", "ASC"],
          ["roundNumber", "ASC"],
          ["id", "ASC"],
        ],
      });

      expect(result.meta.total).toBe(1);
    });
  });

  describe("findByStage", () => {
    it("should list rounds for one stage in the current tenant", async () => {
      mockStageModel.findOne.mockResolvedValue({ id: 11, tenantId: 1 });
      mockRoundModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 2, stageId: 11, name: "Round 2" }],
        count: 1,
      });

      const result = await service.findByStage(11, {
        isActive: "true" as any,
        limit: "5" as any,
      });

      expect(mockRoundModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          stageId: 11,
          isActive: true,
        },
        offset: 0,
        limit: 5,
        order: [
          ["stageId", "ASC"],
          ["roundNumber", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should update round and validate round number inside target stage", async () => {
      const update = jest.fn().mockResolvedValue({ id: 9, roundNumber: 3 });
      mockRoundModel.findOne
        .mockResolvedValueOnce({
          id: 9,
          tenantId: 1,
          stageId: 11,
          name: "Round 2",
          roundNumber: 2,
          update,
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.update(9, {
        name: "Round 3",
        roundNumber: 3,
        status: RoundStatus.IN_PROGRESS,
      });

      expect(update).toHaveBeenCalledWith({
        name: "Round 3",
        roundNumber: 3,
        status: RoundStatus.IN_PROGRESS,
      });
      expect(result.roundNumber).toBe(3);
    });
  });

  describe("findById", () => {
    it("should throw when round is not found", async () => {
      mockRoundModel.findOne.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
