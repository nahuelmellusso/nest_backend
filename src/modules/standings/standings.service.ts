import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { CreateStandingDto } from "./dto/create-standing.dto";
import { QueryStandingDto } from "./dto/query-standing.dto";
import { UpdateStandingDto } from "./dto/update-standing.dto";
import { Standing } from "./standing.entity";

@Injectable()
export class StandingsService extends TenantScopedService {
  constructor(
    @InjectModel(Standing)
    private readonly standingModel: typeof Standing,
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    @InjectModel(Stage)
    private readonly stageModel: typeof Stage,
    @InjectModel(Team)
    private readonly teamModel: typeof Team,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createDto: CreateStandingDto): Promise<Standing> {
    await this.validateHierarchy(createDto.seasonId, createDto.stageId);
    await this.findTenantTeam(createDto.teamId);
    this.validateStats(createDto);
    await this.ensureUniqueTeamStanding(createDto.stageId, createDto.teamId);
    await this.ensureUniquePosition(createDto.stageId, createDto.position);

    return this.standingModel.create({
      tenantId: this.getCurrentTenantId(),
      seasonId: createDto.seasonId,
      stageId: createDto.stageId,
      teamId: createDto.teamId,
      played: this.toNonNegativeNumber(createDto.played),
      wins: this.toNonNegativeNumber(createDto.wins),
      draws: this.toNonNegativeNumber(createDto.draws),
      losses: this.toNonNegativeNumber(createDto.losses),
      goalsFor: this.toNonNegativeNumber(createDto.goalsFor),
      goalsAgainst: this.toNonNegativeNumber(createDto.goalsAgainst),
      goalDifference: this.toNumber(createDto.goalDifference, 0),
      points: this.toNonNegativeNumber(createDto.points),
      position: this.toPositiveNumber(createDto.position, 1),
      lastFiveForm: this.normalizeForm(createDto.lastFiveForm),
      notes: this.normalizeNullableString(createDto.notes),
    });
  }

  async findAll(query: QueryStandingDto) {
    return this.findMany(query);
  }

  async findByStage(stageId: number, query: QueryStandingDto = {}) {
    await this.findTenantStage(stageId);

    return this.findMany({
      ...query,
      stageId,
    });
  }

  async findById(id: number): Promise<Standing> {
    const standing = await this.standingModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!standing) {
      throw new NotFoundException(`Standing with ID ${id} not found`);
    }

    return standing;
  }

  async update(id: number, updateDto: UpdateStandingDto): Promise<Standing> {
    const standing = await this.findById(id);
    const payload: Partial<Standing> = {};

    const targetSeasonId =
      updateDto.seasonId !== undefined
        ? this.toPositiveNumber(updateDto.seasonId, 0)
        : standing.seasonId;
    const targetStageId =
      updateDto.stageId !== undefined
        ? this.toPositiveNumber(updateDto.stageId, 0)
        : standing.stageId;
    const targetTeamId =
      updateDto.teamId !== undefined ? this.toPositiveNumber(updateDto.teamId, 0) : standing.teamId;
    const targetPlayed =
      updateDto.played !== undefined ? this.toNonNegativeNumber(updateDto.played) : standing.played;
    const targetWins =
      updateDto.wins !== undefined ? this.toNonNegativeNumber(updateDto.wins) : standing.wins;
    const targetDraws =
      updateDto.draws !== undefined ? this.toNonNegativeNumber(updateDto.draws) : standing.draws;
    const targetLosses =
      updateDto.losses !== undefined ? this.toNonNegativeNumber(updateDto.losses) : standing.losses;
    const targetGoalsFor =
      updateDto.goalsFor !== undefined
        ? this.toNonNegativeNumber(updateDto.goalsFor)
        : standing.goalsFor;
    const targetGoalsAgainst =
      updateDto.goalsAgainst !== undefined
        ? this.toNonNegativeNumber(updateDto.goalsAgainst)
        : standing.goalsAgainst;
    const targetGoalDifference =
      updateDto.goalDifference !== undefined
        ? this.toNumber(updateDto.goalDifference, 0)
        : standing.goalDifference;
    const targetPoints =
      updateDto.points !== undefined ? this.toNonNegativeNumber(updateDto.points) : standing.points;
    const targetPosition =
      updateDto.position !== undefined
        ? this.toPositiveNumber(updateDto.position, 0)
        : standing.position;

    await this.validateHierarchy(targetSeasonId, targetStageId);
    await this.findTenantTeam(targetTeamId);
    this.validateStats({
      played: targetPlayed,
      wins: targetWins,
      draws: targetDraws,
      losses: targetLosses,
      goalsFor: targetGoalsFor,
      goalsAgainst: targetGoalsAgainst,
      goalDifference: targetGoalDifference,
      points: targetPoints,
      lastFiveForm:
        updateDto.lastFiveForm !== undefined
          ? updateDto.lastFiveForm
          : (standing.lastFiveForm ?? undefined),
    });

    await this.ensureUniqueTeamStanding(targetStageId, targetTeamId, id);
    await this.ensureUniquePosition(targetStageId, targetPosition, id);

    if (updateDto.seasonId !== undefined) payload.seasonId = targetSeasonId;
    if (updateDto.stageId !== undefined) payload.stageId = targetStageId;
    if (updateDto.teamId !== undefined) payload.teamId = targetTeamId;
    if (updateDto.played !== undefined) payload.played = targetPlayed;
    if (updateDto.wins !== undefined) payload.wins = targetWins;
    if (updateDto.draws !== undefined) payload.draws = targetDraws;
    if (updateDto.losses !== undefined) payload.losses = targetLosses;
    if (updateDto.goalsFor !== undefined) payload.goalsFor = targetGoalsFor;
    if (updateDto.goalsAgainst !== undefined) payload.goalsAgainst = targetGoalsAgainst;
    if (updateDto.goalDifference !== undefined) payload.goalDifference = targetGoalDifference;
    if (updateDto.points !== undefined) payload.points = targetPoints;
    if (updateDto.position !== undefined) payload.position = targetPosition;
    if (updateDto.lastFiveForm !== undefined) {
      payload.lastFiveForm = this.normalizeForm(updateDto.lastFiveForm);
    }
    if (updateDto.notes !== undefined) {
      payload.notes = this.normalizeNullableString(updateDto.notes);
    }

    return standing.update(payload);
  }

  async remove(id: number): Promise<void> {
    const standing = await this.findById(id);
    await standing.destroy();
  }

  private async findMany(query: QueryStandingDto) {
    const page = this.toPositiveNumber(query.page, 1);
    const limit = this.toPositiveNumber(query.limit, 20);
    const offset = (page - 1) * limit;

    const where: WhereOptions<Standing> = {};

    if (query.seasonId !== undefined) {
      const seasonId = this.toPositiveNumber(query.seasonId, 0);
      await this.findTenantSeason(seasonId);
      where.seasonId = seasonId;
    }

    if (query.stageId !== undefined) {
      const stageId = this.toPositiveNumber(query.stageId, 0);
      await this.findTenantStage(stageId);
      where.stageId = stageId;
    }

    if (query.teamId !== undefined) {
      const teamId = this.toPositiveNumber(query.teamId, 0);
      await this.findTenantTeam(teamId);
      where.teamId = teamId;
    }

    const { rows, count } = await this.standingModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["stageId", "ASC"],
        ["position", "ASC"],
        ["points", "DESC"],
        ["goalDifference", "DESC"],
        ["goalsFor", "DESC"],
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

  private async validateHierarchy(seasonId: number, stageId: number): Promise<void> {
    const season = await this.findTenantSeason(seasonId);
    const stage = await this.findTenantStage(stageId);

    if (stage.seasonId !== season.id) {
      throw new BadRequestException("Stage does not belong to the provided season");
    }
  }

  private validateStats(payload: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    lastFiveForm?: string | null;
  }) {
    if (payload.wins + payload.draws + payload.losses !== payload.played) {
      throw new BadRequestException("played must equal wins + draws + losses");
    }

    if (payload.goalDifference !== payload.goalsFor - payload.goalsAgainst) {
      throw new BadRequestException("goalDifference must equal goalsFor - goalsAgainst");
    }

    if (payload.points !== payload.wins * 3 + payload.draws) {
      throw new BadRequestException("points must equal wins * 3 + draws");
    }

    const normalizedForm = this.normalizeForm(payload.lastFiveForm);
    if (normalizedForm && normalizedForm.length > payload.played) {
      throw new BadRequestException("lastFiveForm cannot contain more results than played matches");
    }
  }

  private async ensureUniqueTeamStanding(stageId: number, teamId: number, excludeId?: number) {
    const where: WhereOptions<Standing> = this.withTenantWhere({ stageId, teamId });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.standingModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException("This team already has a standing row for the selected stage");
    }
  }

  private async ensureUniquePosition(stageId: number, position: number, excludeId?: number) {
    const where: WhereOptions<Standing> = this.withTenantWhere({ stageId, position });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.standingModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException("This position is already assigned in the selected stage");
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

  private async findTenantStage(stageId: number): Promise<Stage> {
    const stage = await this.stageModel.findOne({
      where: this.withTenantWhere({ id: stageId }),
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    return stage;
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

  private normalizeForm(value?: string | null): string | null {
    const normalized = value?.trim().toUpperCase();
    return normalized ? normalized : null;
  }

  private normalizeNullableString(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private toNumber(value: number | string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toPositiveNumber(value: number | string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toNonNegativeNumber(value: number | string | undefined): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException("Invalid numeric value");
    }

    return parsed;
  }
}
