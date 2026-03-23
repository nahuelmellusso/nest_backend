import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { CreateSportDto } from "./dto/create-sport.dto";
import { QuerySportDto } from "./dto/query-sport.dto";
import { UpdateSportDto } from "./dto/update-sport.dto";
import { Sport } from "./sport.entity";
import { SportStatus } from "@/enums/sport-status.enum";

@Injectable()
export class SportsService {
  constructor(
    @InjectModel(Sport)
    private readonly sportModel: typeof Sport,
  ) {}

  async create(createSportDto: CreateSportDto): Promise<Sport> {
    await this.ensureSlugAvailable(createSportDto.slug);

    return this.sportModel.create({
      name: createSportDto.name.trim(),
      slug: createSportDto.slug.trim().toLowerCase(),
      type: createSportDto.type,
      status: createSportDto.status ?? SportStatus.ACTIVE,
    });
  }

  async findAll(query: QuerySportDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<Sport> = {};

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [{ name: { [Op.like]: search } }, { slug: { [Op.like]: search } }];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    const { rows, count } = await this.sportModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [["name", "ASC"]],
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit) || 1,
      },
    };
  }

  async findById(id: number): Promise<Sport> {
    const sport = await this.sportModel.findByPk(id);

    if (!sport) {
      throw new NotFoundException(`Sport with ID ${id} not found`);
    }

    return sport;
  }

  async findBySlug(slug: string): Promise<Sport> {
    const sport = await this.sportModel.findOne({
      where: {
        slug: slug.trim().toLowerCase(),
      },
    });

    if (!sport) {
      throw new NotFoundException(`Sport with slug \"${slug}\" not found`);
    }

    return sport;
  }

  async update(id: number, updateSportDto: UpdateSportDto): Promise<Sport> {
    const sport = await this.findById(id);
    const payload: Partial<Sport> = {};

    if (updateSportDto.slug !== undefined) {
      const normalizedSlug = updateSportDto.slug.trim().toLowerCase();
      if (normalizedSlug !== sport.slug) {
        await this.ensureSlugAvailable(normalizedSlug, id);
        payload.slug = normalizedSlug;
      }
    }

    if (updateSportDto.name !== undefined) {
      payload.name = updateSportDto.name.trim();
    }

    if (updateSportDto.type !== undefined) {
      payload.type = updateSportDto.type;
    }

    if (updateSportDto.status !== undefined) {
      payload.status = updateSportDto.status;
    }

    return sport.update(payload);
  }

  async remove(id: number): Promise<void> {
    const sport = await this.findById(id);
    await sport.destroy();
  }

  private async ensureSlugAvailable(slug: string, excludeId?: number): Promise<void> {
    const where: WhereOptions<Sport> = {
      slug: slug.trim().toLowerCase(),
    };

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existingSport = await this.sportModel.findOne({ where });

    if (existingSport) {
      throw new ConflictException("Sport slug already exists");
    }
  }
}
