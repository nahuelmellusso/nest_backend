import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { Tournament } from "./tournament.entity";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { QueryTournamentDto } from "./dto/query-tournament.dto";
import { TournamentImageService } from "@/modules/tournaments/tournametImage.service";
import { generateSlug } from "@/utils/slug.util";
@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel(Tournament)
    private readonly tournamentModel: typeof Tournament,
    private readonly tournamentImageService: TournamentImageService,
  ) {}

  async create(
    createTournamentDto: CreateTournamentDto,
    file?: Express.Multer.File,
  ): Promise<Tournament> {

    const slug = await this.generateUniqueSlug(createTournamentDto.name);

    const tournament = await this.tournamentModel.create({
      name: createTournamentDto.name,
      slug,
      type: createTournamentDto.type,
      country: createTournamentDto.country,
      isActive: createTournamentDto.isActive ?? true,
    });

    if (file) {
      const stored = await this.tournamentImageService.upload(tournament.id, file);
      tournament.image = stored.key;
      tournament.save();
    }

    return tournament;
  }

  async findAll(query: QueryTournamentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query.search}%` } },
        { slug: { [Op.like]: `%${query.search}%` } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.country) {
      where.country = query.country.toUpperCase();
    }

    if (typeof query.isActive === "boolean") {
      where.isActive = query.isActive;
    }

    const { rows, count } = await this.tournamentModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findById(id: number): Promise<Tournament> {
    const tournament = await this.tournamentModel.findByPk(id);

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    return tournament;
  }

  async findBySlug(slug: string): Promise<Tournament> {
    const tournament = await this.tournamentModel.findOne({
      where: { slug },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with slug "${slug}" not found`);
    }

    return tournament;
  }

  async update(
    id: number,
    updateTournamentDto: UpdateTournamentDto,
    file?: Express.Multer.File,
  ): Promise<Tournament> {
    const tournament = await this.findById(id);

    if (updateTournamentDto.slug && updateTournamentDto.slug !== tournament.slug) {
      const existingTournament = await this.tournamentModel.findOne({
        where: { slug: updateTournamentDto.slug },
      });

      if (existingTournament) {
        throw new ConflictException("Tournament slug already exists");
      }
    }

    const payload: Partial<Tournament> = {};

    if (updateTournamentDto.name !== undefined) {
      payload.name = updateTournamentDto.name;
    }

    if (updateTournamentDto.slug !== undefined) {
      payload.slug = updateTournamentDto.slug;
    }

    if (updateTournamentDto.type !== undefined) {
      payload.type = updateTournamentDto.type;
    }

    if (updateTournamentDto.country !== undefined) {
      payload.country = updateTournamentDto.country;
    }

    if (updateTournamentDto.isActive !== undefined) {
      payload.isActive = updateTournamentDto.isActive;
    }

    if (file) {
      await this.tournamentImageService.deleteImageIfExists(tournament.image);

      const stored = await this.tournamentImageService.upload(tournament.id, file);
      payload.image = stored.key;
    }

    return tournament.update(payload);
  }

  async remove(id: number): Promise<void> {
    const tournament = await this.findById(id);
    await tournament.destroy();
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);

    if (!baseSlug) {
      throw new ConflictException("Unable to generate a valid slug from tournament name");
    }

    const existingSlugs = await this.tournamentModel.findAll({
      where: {
        slug: {
          [Op.like]: `${baseSlug}%`,
        },
      },
      attributes: ["slug"],
      paranoid: false,
    });

    const slugSet = new Set(existingSlugs.map((item) => item.slug));

    if (!slugSet.has(baseSlug)) {
      return baseSlug;
    }

    let counter = 1;
    let candidate = `${baseSlug}-${counter}`;

    while (slugSet.has(candidate)) {
      counter += 1;
      candidate = `${baseSlug}-${counter}`;
    }

    return candidate;
  }
}
