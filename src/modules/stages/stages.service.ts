import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Stage } from "./stage.entity";
import { CreateStageDto } from "./dto/create-stage.dto";
import { UpdateStageDto } from "./dto/update-stage.dto";
import { QueryStageDto } from "./dto/query-stage.dto";
import { StageType } from "@/enums/stage-type.enum";
import { Season } from "@/modules/seasons/season.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

@Injectable()
export class StagesService extends TenantScopedService {
  constructor(
    @InjectModel(Stage)
    private readonly stageModel: typeof Stage,
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createStageDto: CreateStageDto): Promise<Stage> {
    const season = await this.findTenantSeason(createStageDto.seasonId);
    await this.ensureNameAvailable(createStageDto.seasonId, createStageDto.name);
    await this.ensureOrderIndexAvailable(createStageDto.seasonId, createStageDto.orderIndex);

    return this.stageModel.create({
      tenantId: this.getCurrentTenantId(),
      seasonId: season.id,
      name: createStageDto.name.trim(),
      type: createStageDto.type,
      orderIndex: this.toNumber(createStageDto.orderIndex, 1),
      settings: createStageDto.settings ?? null,
      isActive: this.parseBoolean(createStageDto.isActive) ?? true,
    });
  }

  async findAll(query: QueryStageDto) {
    return this.findMany(query);
  }

  async findBySeason(seasonId: number, query: QueryStageDto = {}) {
    await this.findTenantSeason(seasonId);

    return this.findMany({
      ...query,
      seasonId,
    });
  }

  async findById(id: number): Promise<Stage> {
    const stage = await this.stageModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${id} not found`);
    }

    return stage;
  }

  async update(id: number, updateStageDto: UpdateStageDto): Promise<Stage> {
    const stage = await this.findById(id);
    const payload: Partial<Stage> = {};

    const targetSeasonId =
      updateStageDto.seasonId !== undefined
        ? this.toNumber(updateStageDto.seasonId, 0)
        : stage.seasonId;

    if (updateStageDto.seasonId !== undefined) {
      await this.findTenantSeason(targetSeasonId);
      payload.seasonId = targetSeasonId;
    }

    if (updateStageDto.name !== undefined) {
      const normalizedName = updateStageDto.name.trim();
      if (normalizedName !== stage.name || targetSeasonId !== stage.seasonId) {
        await this.ensureNameAvailable(targetSeasonId, normalizedName, id);
      }
      payload.name = normalizedName;
    }

    if (updateStageDto.type !== undefined) {
      payload.type = updateStageDto.type as StageType;
    }

    if (updateStageDto.orderIndex !== undefined) {
      const normalizedOrderIndex = this.toNumber(updateStageDto.orderIndex, 0);
      if (normalizedOrderIndex !== stage.orderIndex || targetSeasonId !== stage.seasonId) {
        await this.ensureOrderIndexAvailable(targetSeasonId, normalizedOrderIndex, id);
      }
      payload.orderIndex = normalizedOrderIndex;
    }

    if (updateStageDto.settings !== undefined) {
      payload.settings = updateStageDto.settings ?? null;
    }

    if (updateStageDto.isActive !== undefined) {
      payload.isActive = this.parseBoolean(updateStageDto.isActive);
    }

    return stage.update(payload);
  }

  async remove(id: number): Promise<void> {
    const stage = await this.findById(id);
    await stage.destroy();
  }

  private async findMany(query: QueryStageDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const where: WhereOptions<Stage> = {};

    if (query.seasonId !== undefined) {
      await this.findTenantSeason(this.toNumber(query.seasonId, 0));
      where.seasonId = this.toNumber(query.seasonId, 0);
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [{ name: { [Op.like]: search } }, { type: { [Op.like]: search } }];
    }

    if (query.type) {
      where.type = query.type;
    }

    const isActive = this.parseBoolean(query.isActive);
    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const { rows, count } = await this.stageModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["seasonId", "ASC"],
        ["orderIndex", "ASC"],
        ["id", "ASC"],
      ],
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

  private async findTenantSeason(seasonId: number): Promise<Season> {
    const season = await this.seasonModel.findOne({
      where: this.withTenantWhere({ id: seasonId }),
    });

    if (!season) {
      throw new NotFoundException(`Season with ID ${seasonId} not found`);
    }

    return season;
  }

  private async ensureNameAvailable(
    seasonId: number,
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const where: WhereOptions<Stage> = this.withTenantWhere({
      seasonId,
      name: name.trim(),
    });

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existingStage = await this.stageModel.findOne({ where, paranoid: false });

    if (existingStage) {
      throw new ConflictException("Stage name already exists in this season");
    }
  }

  private async ensureOrderIndexAvailable(
    seasonId: number,
    orderIndex: number,
    excludeId?: number,
  ): Promise<void> {
    const where: WhereOptions<Stage> = this.withTenantWhere({ seasonId, orderIndex });

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existingStage = await this.stageModel.findOne({ where, paranoid: false });

    if (existingStage) {
      throw new ConflictException("Stage orderIndex already exists in this season");
    }
  }

  private toNumber(value: number | string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseBoolean(value: boolean | string | undefined): boolean | undefined {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return undefined;
  }
}
