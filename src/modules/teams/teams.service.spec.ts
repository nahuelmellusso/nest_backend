jest.mock("./teamLogo.service", () => {
  return {
    TeamLogoService: jest.fn().mockImplementation(() => ({
      upload: jest.fn(),
      deleteLogoIfExists: jest.fn(),
    })),
  };
});

import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { Team } from "./team.entity";
import { TeamsService } from "./teams.service";
import { TeamLogoService } from "./teamLogo.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { mockTenantContextService } from "@/test/helpers/mock-tenant-context.service";

describe("TeamsService", () => {
  let service: TeamsService;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockTeamModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  };

  const mockTeamLogoService = {
    upload: jest.fn(),
    deleteLogoIfExists: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    tenantContextService = mockTenantContextService();
    tenantContextService.getTenantId.mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: getModelToken(Team),
          useValue: mockTeamModel,
        },
        {
          provide: TeamLogoService,
          useValue: mockTeamLogoService,
        },
        {
          provide: TenantContextService,
          useValue: tenantContextService,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a team with generated slug", async () => {
      const dto = {
        name: "Boca Juniors",
        shortName: "BOCA",
        country: "AR",
        city: "Buenos Aires",
      } as any;

      mockTeamModel.findAll.mockResolvedValue([]);
      mockTeamModel.findOne.mockResolvedValue(null);
      mockTeamModel.create.mockResolvedValue({
        id: 1,
        ...dto,
        slug: "boca-juniors",
        tenantId: 1,
        isActive: true,
      });

      const result = await service.create(dto);

      expect(mockTeamModel.findAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          slug: {
            [Op.like]: "boca-juniors%",
          },
        },
        attributes: ["slug"],
        paranoid: false,
      });

      expect(mockTeamModel.findOne).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          slug: "boca-juniors",
        },
        paranoid: false,
      });

      expect(mockTeamModel.create).toHaveBeenCalledWith({
        tenantId: 1,
        name: "Boca Juniors",
        shortName: "BOCA",
        slug: "boca-juniors",
        city: "Buenos Aires",
        country: "AR",
        logoUrl: null,
        foundedYear: null,
        websiteUrl: null,
        metadata: null,
        isActive: true,
      });

      expect(result.slug).toBe("boca-juniors");
    });

    it("should upload logo if file is provided", async () => {
      const dto = {
        name: "Boca Juniors",
        shortName: "BOCA",
        country: "AR",
      } as any;

      const file = { originalname: "logo.png", buffer: Buffer.from("img") } as Express.Multer.File;
      const save = jest.fn().mockResolvedValue(undefined);

      const createdTeam = {
        id: 10,
        name: dto.name,
        slug: "boca-juniors",
        logoUrl: null,
        tenantId: 1,
        save,
      };

      mockTeamModel.findAll.mockResolvedValue([]);
      mockTeamModel.findOne.mockResolvedValue(null);
      mockTeamModel.create.mockResolvedValue(createdTeam);
      mockTeamLogoService.upload.mockResolvedValue({
        key: "teams/10/logo.webp",
      });

      const result = await service.create(dto, file);

      expect(mockTeamLogoService.upload).toHaveBeenCalledWith(10, file);
      expect(result.logoUrl).toBe("teams/10/logo.webp");
      expect(save).toHaveBeenCalled();
    });

    it("should throw when slug already exists in tenant", async () => {
      const dto = {
        name: "Boca Juniors",
        shortName: "BOCA",
        slug: "boca",
        country: "AR",
      } as any;

      mockTeamModel.findOne.mockResolvedValue({ id: 99 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockTeamModel.create).not.toHaveBeenCalled();
    });

    it("should throw when tenant context is missing", async () => {
      tenantContextService.getTenantId.mockReturnValue(null as any);

      await expect(
        service.create({
          name: "River Plate",
          shortName: "RIVER",
          country: "AR",
        } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findAll", () => {
    it("should return paginated teams with tenant filtering", async () => {
      mockTeamModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, name: "Boca Juniors" }],
        count: 1,
      });

      const result = await service.findAll({
        search: "Boca",
        country: "ar",
        isActive: "true" as any,
        page: "2" as any,
        limit: "5" as any,
      });

      expect(mockTeamModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tenantId: 1,
          country: "AR",
          isActive: true,
          [Op.or]: [
            { name: { [Op.like]: "%Boca%" } },
            { shortName: { [Op.like]: "%Boca%" } },
            { slug: { [Op.like]: "%Boca%" } },
            { city: { [Op.like]: "%Boca%" } },
          ],
        },
        offset: 5,
        limit: 5,
        order: [["name", "ASC"]],
      });

      expect(result).toEqual({
        data: [{ id: 1, name: "Boca Juniors" }],
        meta: {
          total: 1,
          page: 2,
          limit: 5,
          totalPages: 1,
        },
      });
    });
  });

  describe("update", () => {
    it("should replace existing logo when file is provided", async () => {
      const file = {
        originalname: "new-logo.png",
        buffer: Buffer.from("img"),
      } as Express.Multer.File;
      const team = {
        id: 44,
        slug: "boca-juniors",
        logoUrl: "teams/44/old-logo.webp",
        update: jest.fn().mockResolvedValue({ id: 44, logoUrl: "teams/44/new-logo.webp" }),
      };

      mockTeamModel.findOne.mockResolvedValue(team);
      mockTeamLogoService.upload.mockResolvedValue({ key: "teams/44/new-logo.webp" });

      const result = await service.update(44, {}, file);

      expect(mockTeamLogoService.deleteLogoIfExists).toHaveBeenCalledWith("teams/44/old-logo.webp");
      expect(mockTeamLogoService.upload).toHaveBeenCalledWith(44, file);
      expect(team.update).toHaveBeenCalledWith({ logoUrl: "teams/44/new-logo.webp" });
      expect(result.logoUrl).toBe("teams/44/new-logo.webp");
    });
  });

  describe("remove", () => {
    it("should delete stored logo before destroying the team", async () => {
      const destroy = jest.fn().mockResolvedValue(undefined);
      mockTeamModel.findOne.mockResolvedValue({
        id: 9,
        logoUrl: "teams/9/logo.webp",
        destroy,
      });

      await service.remove(9);

      expect(mockTeamLogoService.deleteLogoIfExists).toHaveBeenCalledWith("teams/9/logo.webp");
      expect(destroy).toHaveBeenCalled();
    });
  });

  describe("findBySlug", () => {
    it("should throw when team is not found", async () => {
      mockTeamModel.findOne.mockResolvedValue(null);

      await expect(service.findBySlug("missing-team")).rejects.toThrow(NotFoundException);
    });
  });
});
