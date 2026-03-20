import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Match } from "./match.entity";
import { CreateMatchDto } from "./dto/create-match.dto";
import { UpdateMatchDto } from "./dto/update-match.dto";
import { QueryMatchDto } from "./dto/query-match.dto";
import { MatchStatus } from "@/enums/match-status.enum";
import { Round } from "@/modules/rounds/round.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

@Injectable()
export class MatchesService extends TenantScopedService {
  constructor(
    @InjectModel(Match)
    private readonly matchModel: typeof Match,
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    @InjectModel(Stage)
    private readonly stageModel: typeof Stage,
    @InjectModel(Round)
    private readonly roundModel: typeof Round,
    @InjectModel(Team)
    private readonly teamModel: typeof Team,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    await this.validateTeams(createMatchDto.homeTeamId, createMatchDto.awayTeamId);
    await this.validateMatchHierarchy(
      createMatchDto.seasonId,
      createMatchDto.stageId,
      createMatchDto.roundId,
    );
    this.validateScores(createMatchDto);
    await this.ensureUniqueFixture(
      createMatchDto.roundId,
      createMatchDto.homeTeamId,
      createMatchDto.awayTeamId,
    );

    return this.matchModel.create({
      tenantId: this.getCurrentTenantId(),
      seasonId: createMatchDto.seasonId,
      stageId: createMatchDto.stageId,
      roundId: createMatchDto.roundId,
      homeTeamId: createMatchDto.homeTeamId,
      awayTeamId: createMatchDto.awayTeamId,
      stadium: this.normalizeNullableString(createMatchDto.stadium),
      matchDate: new Date(createMatchDto.matchDate),
      status: createMatchDto.status ?? MatchStatus.SCHEDULED,
      homeScore: this.parseNullableNumber(createMatchDto.homeScore),
      awayScore: this.parseNullableNumber(createMatchDto.awayScore),
      homePenaltyScore: this.parseNullableNumber(createMatchDto.homePenaltyScore),
      awayPenaltyScore: this.parseNullableNumber(createMatchDto.awayPenaltyScore),
      extraTimePlayed: this.parseBoolean(createMatchDto.extraTimePlayed) ?? false,
      notes: this.normalizeNullableString(createMatchDto.notes),
      settings: createMatchDto.settings ?? null,
      isActive: this.parseBoolean(createMatchDto.isActive) ?? true,
    });
  }

  async findAll(query: QueryMatchDto) {
    return this.findMany(query);
  }

  async findByRound(roundId: number, query: QueryMatchDto = {}) {
    await this.findTenantRound(roundId);

    return this.findMany({
      ...query,
      roundId,
    });
  }

  async findById(id: number): Promise<Match> {
    const match = await this.matchModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  async update(id: number, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.findById(id);
    const payload: Partial<Match> = {};

    const targetSeasonId =
      updateMatchDto.seasonId !== undefined
        ? this.toNumber(updateMatchDto.seasonId, 0)
        : match.seasonId;
    const targetStageId =
      updateMatchDto.stageId !== undefined
        ? this.toNumber(updateMatchDto.stageId, 0)
        : match.stageId;
    const targetRoundId =
      updateMatchDto.roundId !== undefined
        ? this.toNumber(updateMatchDto.roundId, 0)
        : match.roundId;
    const targetHomeTeamId =
      updateMatchDto.homeTeamId !== undefined
        ? this.toNumber(updateMatchDto.homeTeamId, 0)
        : match.homeTeamId;
    const targetAwayTeamId =
      updateMatchDto.awayTeamId !== undefined
        ? this.toNumber(updateMatchDto.awayTeamId, 0)
        : match.awayTeamId;

    const hierarchyChanged =
      targetSeasonId !== match.seasonId ||
      targetStageId !== match.stageId ||
      targetRoundId !== match.roundId;
    const teamsChanged =
      targetHomeTeamId !== match.homeTeamId || targetAwayTeamId !== match.awayTeamId;

    if (hierarchyChanged) {
      await this.validateMatchHierarchy(targetSeasonId, targetStageId, targetRoundId);
      payload.seasonId = targetSeasonId;
      payload.stageId = targetStageId;
      payload.roundId = targetRoundId;
    }

    if (teamsChanged) {
      await this.validateTeams(targetHomeTeamId, targetAwayTeamId);
      payload.homeTeamId = targetHomeTeamId;
      payload.awayTeamId = targetAwayTeamId;
    }

    if (hierarchyChanged || teamsChanged) {
      await this.ensureUniqueFixture(targetRoundId, targetHomeTeamId, targetAwayTeamId, id);
    }

    if (updateMatchDto.stadium !== undefined) {
      payload.stadium = this.normalizeNullableString(updateMatchDto.stadium);
    }

    if (updateMatchDto.matchDate !== undefined) {
      payload.matchDate = new Date(updateMatchDto.matchDate);
    }

    if (updateMatchDto.status !== undefined) {
      payload.status = updateMatchDto.status;
    }

    if (updateMatchDto.homeScore !== undefined) {
      payload.homeScore = this.parseNullableNumber(updateMatchDto.homeScore);
    }

    if (updateMatchDto.awayScore !== undefined) {
      payload.awayScore = this.parseNullableNumber(updateMatchDto.awayScore);
    }

    if (updateMatchDto.homePenaltyScore !== undefined) {
      payload.homePenaltyScore = this.parseNullableNumber(updateMatchDto.homePenaltyScore);
    }

    if (updateMatchDto.awayPenaltyScore !== undefined) {
      payload.awayPenaltyScore = this.parseNullableNumber(updateMatchDto.awayPenaltyScore);
    }

    if (updateMatchDto.extraTimePlayed !== undefined) {
      payload.extraTimePlayed = this.parseBoolean(updateMatchDto.extraTimePlayed);
    }

    if (updateMatchDto.notes !== undefined) {
      payload.notes = this.normalizeNullableString(updateMatchDto.notes);
    }

    if (updateMatchDto.settings !== undefined) {
      payload.settings = updateMatchDto.settings ?? null;
    }

    if (updateMatchDto.isActive !== undefined) {
      payload.isActive = this.parseBoolean(updateMatchDto.isActive);
    }

    this.validateScores({
      homeScore: payload.homeScore ?? match.homeScore,
      awayScore: payload.awayScore ?? match.awayScore,
      homePenaltyScore: payload.homePenaltyScore ?? match.homePenaltyScore,
      awayPenaltyScore: payload.awayPenaltyScore ?? match.awayPenaltyScore,
      status: payload.status ?? match.status,
    });

    return match.update(payload);
  }

  async remove(id: number): Promise<void> {
    const match = await this.findById(id);
    await match.destroy();
  }

  private async findMany(query: QueryMatchDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const where: WhereOptions<Match> = {};

    if (query.seasonId !== undefined) {
      await this.findTenantSeason(this.toNumber(query.seasonId, 0));
      where.seasonId = this.toNumber(query.seasonId, 0);
    }

    if (query.stageId !== undefined) {
      await this.findTenantStage(this.toNumber(query.stageId, 0));
      where.stageId = this.toNumber(query.stageId, 0);
    }

    if (query.roundId !== undefined) {
      await this.findTenantRound(this.toNumber(query.roundId, 0));
      where.roundId = this.toNumber(query.roundId, 0);
    }

    if (query.teamId !== undefined) {
      const teamId = this.toNumber(query.teamId, 0);
      await this.findTenantTeam(teamId);
      where[Op.or] = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    if (query.search?.trim()) {
      where.stadium = {
        [Op.like]: `%${query.search.trim()}%`,
      } as any;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.dateFrom || query.dateTo) {
      where.matchDate = {} as any;
      if (query.dateFrom) {
        where.matchDate[Op.gte] = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.matchDate[Op.lte] = new Date(query.dateTo);
      }
    }

    const isActive = this.parseBoolean(query.isActive);
    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const { rows, count } = await this.matchModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["matchDate", "ASC"],
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

  private async validateMatchHierarchy(seasonId: number, stageId: number, roundId: number) {
    const season = await this.findTenantSeason(seasonId);
    const stage = await this.findTenantStage(stageId);
    const round = await this.findTenantRound(roundId);

    if (stage.seasonId !== season.id) {
      throw new BadRequestException("Stage does not belong to the provided season");
    }

    if (round.stageId !== stage.id) {
      throw new BadRequestException("Round does not belong to the provided stage");
    }
  }

  private async validateTeams(homeTeamId: number, awayTeamId: number) {
    if (homeTeamId === awayTeamId) {
      throw new BadRequestException("homeTeamId and awayTeamId must be different");
    }

    await this.findTenantTeam(homeTeamId);
    await this.findTenantTeam(awayTeamId);
  }

  private validateScores(payload: {
    homeScore?: number | null;
    awayScore?: number | null;
    homePenaltyScore?: number | null;
    awayPenaltyScore?: number | null;
    status?: MatchStatus;
  }) {
    const hasHomeScore = payload.homeScore !== null && payload.homeScore !== undefined;
    const hasAwayScore = payload.awayScore !== null && payload.awayScore !== undefined;

    if (hasHomeScore !== hasAwayScore) {
      throw new BadRequestException("homeScore and awayScore must both be provided together");
    }

    const hasHomePenalty =
      payload.homePenaltyScore !== null && payload.homePenaltyScore !== undefined;
    const hasAwayPenalty =
      payload.awayPenaltyScore !== null && payload.awayPenaltyScore !== undefined;

    if (hasHomePenalty !== hasAwayPenalty) {
      throw new BadRequestException(
        "homePenaltyScore and awayPenaltyScore must both be provided together",
      );
    }

    if (hasHomePenalty && (!hasHomeScore || payload.homeScore !== payload.awayScore)) {
      throw new BadRequestException("Penalty scores require a tied regular score before penalties");
    }

    if (
      payload.status === MatchStatus.COMPLETED &&
      (!hasHomeScore || (hasHomePenalty && payload.homePenaltyScore === payload.awayPenaltyScore))
    ) {
      throw new BadRequestException(
        "Completed matches require a valid final score and penalty ties are not allowed",
      );
    }
  }

  private async ensureUniqueFixture(
    roundId: number,
    homeTeamId: number,
    awayTeamId: number,
    excludeId?: number,
  ) {
    const where: WhereOptions<Match> = this.withTenantWhere({ roundId, homeTeamId, awayTeamId });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existingMatch = await this.matchModel.findOne({ where, paranoid: false });

    if (existingMatch) {
      throw new ConflictException("This fixture already exists in the selected round");
    }
  }

  private async findTenantSeason(seasonId: number): Promise<Season> {
    const season = await this.seasonModel.findOne({
      where: this.withTenantWhere({ id: seasonId }),
    });
    if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);
    return season;
  }

  private async findTenantStage(stageId: number): Promise<Stage> {
    const stage = await this.stageModel.findOne({ where: this.withTenantWhere({ id: stageId }) });
    if (!stage) throw new NotFoundException(`Stage with ID ${stageId} not found`);
    return stage;
  }

  private async findTenantRound(roundId: number): Promise<Round> {
    const round = await this.roundModel.findOne({ where: this.withTenantWhere({ id: roundId }) });
    if (!round) throw new NotFoundException(`Round with ID ${roundId} not found`);
    return round;
  }

  private async findTenantTeam(teamId: number): Promise<Team> {
    const team = await this.teamModel.findOne({ where: this.withTenantWhere({ id: teamId }) });
    if (!team) throw new NotFoundException(`Team with ID ${teamId} not found`);
    return team;
  }

  private normalizeNullableString(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private toNumber(value: number | string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseBoolean(value: boolean | string | undefined): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  }

  private parseNullableNumber(value: number | string | undefined | null): number | null {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException("Invalid numeric value");
    }
    return parsed;
  }
}
