import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { SeasonTeamStatus } from "@/enums/season-team-status.enum";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { CreateSeasonTeamDto } from "./dto/create-season-team.dto";
import { QuerySeasonTeamDto } from "./dto/query-season-team.dto";
import { UpdateSeasonTeamDto } from "./dto/update-season-team.dto";
import { SeasonTeam } from "./season-team.entity";

@Injectable()
export class SeasonTeamsService extends TenantScopedService {
  constructor(
    @InjectModel(SeasonTeam)
    private readonly seasonTeamModel: typeof SeasonTeam,
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    @InjectModel(Team)
    private readonly teamModel: typeof Team,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createDto: CreateSeasonTeamDto): Promise<SeasonTeam> {
    await this.findTenantSeason(createDto.seasonId);
    await this.findTenantTeam(createDto.teamId);
    await this.ensureUniqueSeasonTeam(createDto.seasonId, createDto.teamId);
    await this.ensureUniqueSeed(createDto.seasonId, createDto.seed);

    return this.seasonTeamModel.create({
      tenantId: this.getCurrentTenantId(),
      seasonId: createDto.seasonId,
      teamId: createDto.teamId,
      status: createDto.status ?? SeasonTeamStatus.CONFIRMED,
      registeredAt: this.parseRegisteredAt(createDto.registeredAt),
      seed: this.parseNullablePositiveNumber(createDto.seed),
      groupName: this.normalizeNullableString(createDto.groupName),
      notes: this.normalizeNullableString(createDto.notes),
      metadata: createDto.metadata ?? null,
      isActive: this.parseBoolean(createDto.isActive) ?? true,
    });
  }

  async findAll(query: QuerySeasonTeamDto) {
    return this.findMany(query);
  }

  async findBySeason(seasonId: number, query: QuerySeasonTeamDto = {}) {
    await this.findTenantSeason(seasonId);

    return this.findMany({
      ...query,
      seasonId,
    });
  }

  async findById(id: number): Promise<SeasonTeam> {
    const seasonTeam = await this.seasonTeamModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!seasonTeam) {
      throw new NotFoundException(`Season team with ID ${id} not found`);
    }

    return seasonTeam;
  }

  async update(id: number, updateDto: UpdateSeasonTeamDto): Promise<SeasonTeam> {
    const seasonTeam = await this.findById(id);
    const payload: Partial<SeasonTeam> = {};

    const targetSeasonId =
      updateDto.seasonId !== undefined
        ? this.toPositiveNumber(updateDto.seasonId, 0)
        : seasonTeam.seasonId;
    const targetTeamId =
      updateDto.teamId !== undefined
        ? this.toPositiveNumber(updateDto.teamId, 0)
        : seasonTeam.teamId;
    const targetSeed =
      updateDto.seed !== undefined
        ? this.parseNullablePositiveNumber(updateDto.seed)
        : seasonTeam.seed;

    await this.findTenantSeason(targetSeasonId);
    await this.findTenantTeam(targetTeamId);
    await this.ensureUniqueSeasonTeam(targetSeasonId, targetTeamId, id);
    await this.ensureUniqueSeed(targetSeasonId, targetSeed, id);

    if (updateDto.seasonId !== undefined) payload.seasonId = targetSeasonId;
    if (updateDto.teamId !== undefined) payload.teamId = targetTeamId;
    if (updateDto.status !== undefined) payload.status = updateDto.status;
    if (updateDto.registeredAt !== undefined) {
      payload.registeredAt = this.parseRegisteredAt(updateDto.registeredAt);
    }
    if (updateDto.seed !== undefined) payload.seed = targetSeed;
    if (updateDto.groupName !== undefined) {
      payload.groupName = this.normalizeNullableString(updateDto.groupName);
    }
    if (updateDto.notes !== undefined) {
      payload.notes = this.normalizeNullableString(updateDto.notes);
    }
    if (updateDto.metadata !== undefined) {
      payload.metadata = updateDto.metadata ?? null;
    }
    if (updateDto.isActive !== undefined) {
      payload.isActive = this.parseBoolean(updateDto.isActive);
    }

    return seasonTeam.update(payload);
  }

  async remove(id: number): Promise<void> {
    const seasonTeam = await this.findById(id);
    await seasonTeam.destroy();
  }

  private async findMany(query: QuerySeasonTeamDto) {
    const page = this.toPositiveNumber(query.page, 1);
    const limit = this.toPositiveNumber(query.limit, 20);
    const offset = (page - 1) * limit;

    const where: WhereOptions<SeasonTeam> = {};

    if (query.seasonId !== undefined) {
      const seasonId = this.toPositiveNumber(query.seasonId, 0);
      await this.findTenantSeason(seasonId);
      where.seasonId = seasonId;
    }

    if (query.teamId !== undefined) {
      const teamId = this.toPositiveNumber(query.teamId, 0);
      await this.findTenantTeam(teamId);
      where.teamId = teamId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const { rows, count } = await this.seasonTeamModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["seasonId", "ASC"],
        ["seed", "ASC"],
        ["teamId", "ASC"],
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

  private async ensureUniqueSeasonTeam(seasonId: number, teamId: number, excludeId?: number) {
    const where: WhereOptions<SeasonTeam> = this.withTenantWhere({ seasonId, teamId });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.seasonTeamModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException("This team is already registered in the selected season");
    }
  }

  private async ensureUniqueSeed(seasonId: number, seed?: number | null, excludeId?: number) {
    if (seed === undefined || seed === null) return;

    const where: WhereOptions<SeasonTeam> = this.withTenantWhere({ seasonId, seed });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.seasonTeamModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException("This seed is already assigned in the selected season");
    }
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

  private async findTenantTeam(teamId: number): Promise<Team> {
    const team = await this.teamModel.findOne({
      where: this.withTenantWhere({ id: teamId }),
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    return team;
  }

  private normalizeNullableString(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private parseRegisteredAt(value?: string | Date): Date {
    if (!value) return new Date();
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Invalid registeredAt value");
    }
    return date;
  }

  private toPositiveNumber(value: number | string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseNullablePositiveNumber(value?: number | string | null): number | null {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException("Invalid numeric value");
    }
    return parsed;
  }

  private parseBoolean(value: boolean | string | undefined): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  }
}
