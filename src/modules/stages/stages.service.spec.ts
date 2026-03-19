import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { StageType } from "@/enums/stage-type.enum";
import { Season } from "@/modules/seasons/season.entity";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";
import { Stage } from "./stage.entity";
import { StagesService } from "./stages.service";

describe("StagesService", () => {
  let service: StagesService;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockStageModel = {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  };

  const mockSeasonModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStageModel.findOne.mockReset();
    mockStageModel.findAndCountAll.mockReset();
    mockStageModel.create.mockReset();
    mockSeasonModel.findOne.mockReset();

    tenantContextService = mockTenantContextService();
    tenantContextService.getTenantId.mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StagesService,
        {
          provide: getModelToken(Stage),
          useValue: mockStageModel,
        },
        {
          provide: getModelToken(Season),
          useValue: mockSeasonModel,
        },
        {
          provide: TenantContextService,
          useValue: tenantContextService,
        },
      ],
    }).compile();

    service = module.get<StagesService>(StagesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a stage inside the current tenant season", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 7, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValue(null);
      mockStageModel.create.mockResolvedValue({
        id: 1,
        tenantId: 1,
        seasonId: 7,
        name: "Regular Season",
        type: StageType.REGULAR_SEASON,
        orderIndex: 1,
        isActive: true,
      });

      const result = await service.create({
        seasonId: 7,
        name: "Regular Season",
        type: StageType.REGULAR_SEASON,
        orderIndex: 1,
      });

      expect(mockSeasonModel.findOne).toHaveBeenCalledWith({
        where: { id: 7, tenantId: 1 },
      });
      expect(mockStageModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        seasonId: 7,
        name: "Regular Season",
        type: StageType.REGULAR_SEASON,
        orderIndex: 1,
        settings: null,
        isActive: true,
      });
      expect(result.id).toBe(1);
    });

    it("should throw when stage name already exists in season", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 7, tenantId: 1 });
      mockStageModel.findOne.mockResolvedValueOnce({ id: 8 });

      await expect(
        service.create({
          seasonId: 7,
          name: "Playoffs",
          type: StageType.PLAYOFF,
          orderIndex: 2,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw when tenant context is missing", async () => {
      tenantContextService.getTenantId.mockReturnValue(null as any);

      await expect(
        service.create({
          seasonId: 7,
          name: "Final",
          type: StageType.FINAL,
          orderIndex: 3,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findAll", () => {
    it("should return tenant-scoped paginated stages", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 7, tenantId: 1 });
      mockStageModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, name: "Group Stage" }],
        count: 1,
      });

      const result = await service.findAll({
        seasonId: "7" as any,
        search: "Group",
        type: StageType.GROUP_STAGE,
        isActive: "true" as any,
        page: "1" as any,
        limit: "10" as any,
      });

      expect(mockStageModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          seasonId: 7,
          type: StageType.GROUP_STAGE,
          isActive: true,
          [Op.or]: [{ name: { [Op.like]: "%Group%" } }, { type: { [Op.like]: "%Group%" } }],
        },
        offset: 0,
        limit: 10,
        order: [
          ["seasonId", "ASC"],
          ["orderIndex", "ASC"],
          ["id", "ASC"],
        ],
      });

      expect(result.meta.total).toBe(1);
    });
  });

  describe("findBySeason", () => {
    it("should list stages for one season in the current tenant", async () => {
      mockSeasonModel.findOne.mockResolvedValue({ id: 7, tenantId: 1 });
      mockStageModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 2, seasonId: 7, name: "Quarter Finals" }],
        count: 1,
      });

      const result = await service.findBySeason(7, {
        isActive: "true" as any,
        limit: "5" as any,
      });

      expect(mockSeasonModel.findOne).toHaveBeenCalledWith({
        where: { id: 7, tenantId: 1 },
      });
      expect(mockStageModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          seasonId: 7,
          isActive: true,
        },
        offset: 0,
        limit: 5,
        order: [
          ["seasonId", "ASC"],
          ["orderIndex", "ASC"],
          ["id", "ASC"],
        ],
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should update stage and validate order index inside target season", async () => {
      const update = jest.fn().mockResolvedValue({ id: 5, orderIndex: 4 });
      mockStageModel.findOne
        .mockResolvedValueOnce({
          id: 5,
          tenantId: 1,
          seasonId: 7,
          name: "Playoff",
          orderIndex: 3,
          update,
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.update(5, {
        name: "Playoffs",
        orderIndex: 4,
      });

      expect(update).toHaveBeenCalledWith({
        name: "Playoffs",
        orderIndex: 4,
      });
      expect(result.orderIndex).toBe(4);
    });
  });

  describe("findById", () => {
    it("should throw when stage is not found", async () => {
      mockStageModel.findOne.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });
});
