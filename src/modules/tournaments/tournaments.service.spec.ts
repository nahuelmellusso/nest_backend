jest.mock("@/modules/tournaments/tournamentImage.service", () => {
  return {
    TournamentImageService: jest.fn().mockImplementation(() => ({
      upload: jest.fn(),
      deleteImageIfExists: jest.fn(),
    })),
  };
});
import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { TournamentsService } from "./tournaments.service";
import { Tournament } from "./tournament.entity";
import { TournamentImageService } from "@/modules/tournaments/tournamentImage.service";

describe("TournamentsService", () => {
  let service: TournamentsService;

  const mockTournamentModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };

  const mockTournamentImageService = {
    upload: jest.fn(),
    deleteImageIfExists: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        {
          provide: getModelToken(Tournament),
          useValue: mockTournamentModel,
        },
        {
          provide: TournamentImageService,
          useValue: mockTournamentImageService,
        },
      ],
    }).compile();

    service = module.get<TournamentsService>(TournamentsService);
  });

  describe("create", () => {
    it("should create a tournament with generated slug", async () => {
      const dto = {
        name: "Copa Libertadores",
        type: "league",
        country: "AR",
        isActive: true,
      } as any;

      mockTournamentModel.findAll.mockResolvedValue([]);
      mockTournamentModel.create.mockResolvedValue({
        id: 1,
        name: dto.name,
        slug: "copa-libertadores",
        type: dto.type,
        country: dto.country,
        isActive: dto.isActive,
      });

      const result = await service.create(dto);

      expect(mockTournamentModel.findAll).toHaveBeenCalledWith({
        where: {
          slug: {
            [Op.like]: "copa-libertadores%",
          },
        },
        attributes: ["slug"],
        paranoid: false,
      });

      expect(mockTournamentModel.create).toHaveBeenCalledWith({
        name: dto.name,
        slug: "copa-libertadores",
        type: dto.type,
        country: dto.country,
        isActive: true,
      });

      expect(result.slug).toBe("copa-libertadores");
    });

    it("should create a tournament with incremental slug if base slug already exists", async () => {
      const dto = {
        name: "Copa Libertadores",
        type: "league",
        country: "AR",
      } as any;

      mockTournamentModel.findAll.mockResolvedValue([
        { slug: "copa-libertadores" },
        { slug: "copa-libertadores-1" },
      ]);

      mockTournamentModel.create.mockResolvedValue({
        id: 1,
        name: dto.name,
        slug: "copa-libertadores-2",
      });

      const result = await service.create(dto);

      expect(mockTournamentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "copa-libertadores-2",
        }),
      );
      expect(result.slug).toBe("copa-libertadores-2");
    });

    it("should upload image if file is provided", async () => {
      const dto = {
        name: "Premier League",
        type: "league",
        country: "EN",
      } as any;

      const file = {
        originalname: "image.png",
      } as Express.Multer.File;

      const save = jest.fn().mockResolvedValue(undefined);

      const createdTournament = {
        id: 10,
        name: dto.name,
        slug: "premier-league",
        image: null,
        save,
      };

      mockTournamentModel.findAll.mockResolvedValue([]);
      mockTournamentModel.create.mockResolvedValue(createdTournament);
      mockTournamentImageService.upload.mockResolvedValue({
        key: "tournaments/10/image.png",
      });

      const result = await service.create(dto, file);

      expect(mockTournamentImageService.upload).toHaveBeenCalledWith(10, file);
      expect(result.image).toBe("tournaments/10/image.png");
      expect(save).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated tournaments", async () => {
      mockTournamentModel.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, name: "A" }],
        count: 1,
      });

      const result = await service.findAll({ page: 1, limit: 10 } as any);

      expect(mockTournamentModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        offset: 0,
        limit: 10,
        order: [["createdAt", "DESC"]],
      });

      expect(result).toEqual({
        data: [{ id: 1, name: "A" }],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it("should apply filters correctly", async () => {
      mockTournamentModel.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });

      await service.findAll({
        page: 2,
        limit: 5,
        search: "liber",
        type: "league",
        country: "ar",
        isActive: true,
      } as any);

      expect(mockTournamentModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [{ name: { [Op.like]: "%liber%" } }, { slug: { [Op.like]: "%liber%" } }],
          type: "league",
          country: "AR",
          isActive: true,
        },
        offset: 5,
        limit: 5,
        order: [["createdAt", "DESC"]],
      });
    });
  });

  describe("findById", () => {
    it("should return tournament if found", async () => {
      const tournament = { id: 1, name: "Copa" };
      mockTournamentModel.findByPk.mockResolvedValue(tournament);

      const result = await service.findById(1);

      expect(result).toBe(tournament);
    });

    it("should throw NotFoundException if tournament does not exist", async () => {
      mockTournamentModel.findByPk.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findBySlug", () => {
    it("should return tournament if found", async () => {
      const tournament = { id: 1, slug: "copa" };
      mockTournamentModel.findOne.mockResolvedValue(tournament);

      const result = await service.findBySlug("copa");

      expect(mockTournamentModel.findOne).toHaveBeenCalledWith({
        where: { slug: "copa" },
      });
      expect(result).toBe(tournament);
    });

    it("should throw NotFoundException if slug does not exist", async () => {
      mockTournamentModel.findOne.mockResolvedValue(null);

      await expect(service.findBySlug("missing-slug")).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update tournament fields", async () => {
      const updateDto = {
        name: "Updated Tournament",
        type: "cup",
        isActive: false,
      } as any;

      const updatedTournament = {
        id: 1,
        slug: "existing-slug",
        image: null,
        update: jest.fn().mockResolvedValue({
          id: 1,
          ...updateDto,
        }),
      };

      jest.spyOn(service, "findById").mockResolvedValue(updatedTournament as any);

      const result = await service.update(1, updateDto);

      expect(updatedTournament.update).toHaveBeenCalledWith({
        name: "Updated Tournament",
        type: "cup",
        isActive: false,
      });

      expect(result).toEqual({
        id: 1,
        ...updateDto,
      });
    });

    it("should throw ConflictException when updating slug to an existing one", async () => {
      const currentTournament = {
        id: 1,
        slug: "old-slug",
        update: jest.fn(),
      };

      jest.spyOn(service, "findById").mockResolvedValue(currentTournament as any);
      mockTournamentModel.findOne.mockResolvedValue({ id: 2, slug: "new-slug" });

      await expect(service.update(1, { slug: "new-slug" } as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should replace image when file is provided", async () => {
      const file = { originalname: "new.png" } as Express.Multer.File;

      const currentTournament = {
        id: 1,
        slug: "old-slug",
        image: "old/image.png",
        update: jest.fn().mockResolvedValue({
          id: 1,
          image: "new/image.png",
        }),
      };

      jest.spyOn(service, "findById").mockResolvedValue(currentTournament as any);

      mockTournamentImageService.upload.mockResolvedValue({
        key: "new/image.png",
      });

      const result = await service.update(1, {} as any, file);

      expect(mockTournamentImageService.deleteImageIfExists).toHaveBeenCalledWith("old/image.png");
      expect(mockTournamentImageService.upload).toHaveBeenCalledWith(1, file);
      expect(currentTournament.update).toHaveBeenCalledWith({
        image: "new/image.png",
      });
      expect(result).toEqual({
        id: 1,
        image: "new/image.png",
      });
    });
  });

  describe("remove", () => {
    it("should destroy tournament", async () => {
      const destroy = jest.fn().mockResolvedValue(undefined);
      const tournament = { id: 1, destroy };

      jest.spyOn(service, "findById").mockResolvedValue(tournament as any);

      await service.remove(1);

      expect(destroy).toHaveBeenCalled();
    });
  });
});
