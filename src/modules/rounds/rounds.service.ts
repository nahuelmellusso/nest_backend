import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Round } from "./round.entity";
import { CreateRoundDto } from "./dto/create-round.dto";
import { UpdateRoundDto } from "./dto/update-round.dto";
import { QueryRoundDto } from "./dto/query-round.dto";
import { RoundStatus } from "@/enums/round-status.enum";
import { Stage } from "@/modules/stages/stage.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

@Injectable()
export class RoundsService extends TenantScopedService {
  constructor(
    @InjectModel(Round)
    private readonly roundModel: typeof Round,
    @InjectModel(Stage)
    private readonly stageModel: typeof Stage,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createRoundDto: CreateRoundDto): Promise<Round> {
    const stage = await this.findTenantStage(createRoundDto.stageId);
    await this.ensureNameAvailable(createRoundDto.stageId, createRoundDto.name);
    await this.ensureRoundNumberAvailable(createRoundDto.stageId, createRoundDto.roundNumber);

    return this.roundModel.create({
      tenantId: this.getCurrentTenantId(),
      stageId: stage.id,
      name: createRoundDto.name.trim(),
      roundNumber: this.toNumber(createRoundDto.roundNumber, 1),
      startDate: createRoundDto.startDate,
      endDate: createRoundDto.endDate,
      status: createRoundDto.status ?? RoundStatus.SCHEDULED,
      settings: createRoundDto.settings ?? null,
      isActive: this.parseBoolean(createRoundDto.isActive) ?? true,
    });
  }

  async findAll(query: QueryRoundDto) {
    return this.findMany(query);
  }

  async findByStage(stageId: number, query: QueryRoundDto = {}) {
    await this.findTenantStage(stageId);

    return this.findMany({
      ...query,
      stageId,
    });
  }

  async findById(id: number): Promise<Round> {
    const round = await this.roundModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!round) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }

    return round;
  }

  async update(id: number, updateRoundDto: UpdateRoundDto): Promise<Round> {
    const round = await this.findById(id);
    const payload: Partial<Round> = {};

    const targetStageId =
      updateRoundDto.stageId !== undefined
        ? this.toNumber(updateRoundDto.stageId, 0)
        : round.stageId;

    if (updateRoundDto.stageId !== undefined) {
      await this.findTenantStage(targetStageId);
      payload.stageId = targetStageId;
    }

    if (updateRoundDto.name !== undefined) {
      const normalizedName = updateRoundDto.name.trim();
      if (normalizedName !== round.name || targetStageId !== round.stageId) {
        await this.ensureNameAvailable(targetStageId, normalizedName, id);
      }
      payload.name = normalizedName;
    }

    if (updateRoundDto.roundNumber !== undefined) {
      const normalizedRoundNumber = this.toNumber(updateRoundDto.roundNumber, 0);
      if (normalizedRoundNumber !== round.roundNumber || targetStageId !== round.stageId) {
        await this.ensureRoundNumberAvailable(targetStageId, normalizedRoundNumber, id);
      }
      payload.roundNumber = normalizedRoundNumber;
    }

    if (updateRoundDto.startDate !== undefined) {
      payload.startDate = updateRoundDto.startDate;
    }

    if (updateRoundDto.endDate !== undefined) {
      payload.endDate = updateRoundDto.endDate;
    }

    if (updateRoundDto.status !== undefined) {
      payload.status = updateRoundDto.status;
    }

    if (updateRoundDto.settings !== undefined) {
      payload.settings = updateRoundDto.settings ?? null;
    }

    if (updateRoundDto.isActive !== undefined) {
      payload.isActive = this.parseBoolean(updateRoundDto.isActive);
    }

    return round.update(payload);
  }

  async remove(id: number): Promise<void> {
    const round = await this.findById(id);
    await round.destroy();
  }

  private async findMany(query: QueryRoundDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const where: WhereOptions<Round> = {};

    if (query.stageId !== undefined) {
      await this.findTenantStage(this.toNumber(query.stageId, 0));
      where.stageId = this.toNumber(query.stageId, 0);
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      where.name = {
        [Op.like]: search,
      } as any;
    }

    if (query.status) {
      where.status = query.status;
    }

    const isActive = this.parseBoolean(query.isActive);
    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const { rows, count } = await this.roundModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["stageId", "ASC"],
        ["roundNumber", "ASC"],
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

  private async findTenantStage(stageId: number): Promise<Stage> {
    const stage = await this.stageModel.findOne({
      where: this.withTenantWhere({ id: stageId }),
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    return stage;
  }

  private async ensureNameAvailable(
    stageId: number,
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const where: WhereOptions<Round> = this.withTenantWhere({
      stageId,
      name: name.trim(),
    });

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existingRound = await this.roundModel.findOne({ where, paranoid: false });

    if (existingRound) {
      throw new ConflictException("Round name already exists in this stage");
    }
  }

  private async ensureRoundNumberAvailable(
    stageId: number,
    roundNumber: number,
    excludeId?: number,
  ): Promise<void> {
    const where: WhereOptions<Round> = this.withTenantWhere({ stageId, roundNumber });

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existingRound = await this.roundModel.findOne({ where, paranoid: false });

    if (existingRound) {
      throw new ConflictException("Round number already exists in this stage");
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
