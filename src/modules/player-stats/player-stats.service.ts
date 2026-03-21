import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Player } from "@/modules/players/player.entity";
import { Season } from "@/modules/seasons/season.entity";
import { Stage } from "@/modules/stages/stage.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { CreatePlayerStatDto } from "./dto/create-player-stat.dto";
import { QueryPlayerStatDto } from "./dto/query-player-stat.dto";
import { UpdatePlayerStatDto } from "./dto/update-player-stat.dto";
import { PlayerStat } from "./player-stat.entity";

@Injectable()
export class PlayerStatsService extends TenantScopedService {
  constructor(
    @InjectModel(PlayerStat)
    private readonly playerStatModel: typeof PlayerStat,
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    @InjectModel(Stage)
    private readonly stageModel: typeof Stage,
    @InjectModel(Team)
    private readonly teamModel: typeof Team,
    @InjectModel(Player)
    private readonly playerModel: typeof Player,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createDto: CreatePlayerStatDto): Promise<PlayerStat> {
    await this.validateHierarchy(createDto.seasonId, createDto.stageId);
    await this.findTenantTeam(createDto.teamId);
    await this.findTenantPlayer(createDto.playerId);
    this.validateStats({
      ...createDto,
      cleanSheets: createDto.cleanSheets ?? 0,
    });
    await this.ensureUniquePlayerStat(createDto.stageId, createDto.teamId, createDto.playerId);

    return this.playerStatModel.create({
      tenantId: this.getCurrentTenantId(),
      seasonId: createDto.seasonId,
      stageId: createDto.stageId,
      teamId: createDto.teamId,
      playerId: createDto.playerId,
      matchesPlayed: this.toNonNegativeNumber(createDto.matchesPlayed),
      matchesStarted: this.toNonNegativeNumber(createDto.matchesStarted),
      minutesPlayed: this.toNonNegativeNumber(createDto.minutesPlayed),
      goals: this.toNonNegativeNumber(createDto.goals),
      assists: this.toNonNegativeNumber(createDto.assists),
      yellowCards: this.toNonNegativeNumber(createDto.yellowCards),
      redCards: this.toNonNegativeNumber(createDto.redCards),
      ownGoals: this.toNonNegativeNumber(createDto.ownGoals),
      cleanSheets: this.toNonNegativeNumber(createDto.cleanSheets ?? 0),
    });
  }

  async findAll(query: QueryPlayerStatDto) {
    return this.findMany(query);
  }

  async findByStage(stageId: number, query: QueryPlayerStatDto = {}) {
    await this.findTenantStage(stageId);

    return this.findMany({
      ...query,
      stageId,
    });
  }

  async findById(id: number): Promise<PlayerStat> {
    const playerStat = await this.playerStatModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!playerStat) {
      throw new NotFoundException(`Player stat with ID ${id} not found`);
    }

    return playerStat;
  }

  async update(id: number, updateDto: UpdatePlayerStatDto): Promise<PlayerStat> {
    const playerStat = await this.findById(id);
    const payload: Partial<PlayerStat> = {};

    const targetSeasonId =
      updateDto.seasonId !== undefined
        ? this.toPositiveNumber(updateDto.seasonId, 0)
        : playerStat.seasonId;
    const targetStageId =
      updateDto.stageId !== undefined
        ? this.toPositiveNumber(updateDto.stageId, 0)
        : playerStat.stageId;
    const targetTeamId =
      updateDto.teamId !== undefined
        ? this.toPositiveNumber(updateDto.teamId, 0)
        : playerStat.teamId;
    const targetPlayerId =
      updateDto.playerId !== undefined
        ? this.toPositiveNumber(updateDto.playerId, 0)
        : playerStat.playerId;
    const targetMatchesPlayed =
      updateDto.matchesPlayed !== undefined
        ? this.toNonNegativeNumber(updateDto.matchesPlayed)
        : playerStat.matchesPlayed;
    const targetMatchesStarted =
      updateDto.matchesStarted !== undefined
        ? this.toNonNegativeNumber(updateDto.matchesStarted)
        : playerStat.matchesStarted;
    const targetMinutesPlayed =
      updateDto.minutesPlayed !== undefined
        ? this.toNonNegativeNumber(updateDto.minutesPlayed)
        : playerStat.minutesPlayed;
    const targetGoals =
      updateDto.goals !== undefined ? this.toNonNegativeNumber(updateDto.goals) : playerStat.goals;
    const targetAssists =
      updateDto.assists !== undefined
        ? this.toNonNegativeNumber(updateDto.assists)
        : playerStat.assists;
    const targetYellowCards =
      updateDto.yellowCards !== undefined
        ? this.toNonNegativeNumber(updateDto.yellowCards)
        : playerStat.yellowCards;
    const targetRedCards =
      updateDto.redCards !== undefined
        ? this.toNonNegativeNumber(updateDto.redCards)
        : playerStat.redCards;
    const targetOwnGoals =
      updateDto.ownGoals !== undefined
        ? this.toNonNegativeNumber(updateDto.ownGoals)
        : playerStat.ownGoals;
    const targetCleanSheets =
      updateDto.cleanSheets !== undefined
        ? this.toNonNegativeNumber(updateDto.cleanSheets)
        : playerStat.cleanSheets;

    await this.validateHierarchy(targetSeasonId, targetStageId);
    await this.findTenantTeam(targetTeamId);
    await this.findTenantPlayer(targetPlayerId);
    this.validateStats({
      matchesPlayed: targetMatchesPlayed,
      matchesStarted: targetMatchesStarted,
      minutesPlayed: targetMinutesPlayed,
      goals: targetGoals,
      assists: targetAssists,
      yellowCards: targetYellowCards,
      redCards: targetRedCards,
      ownGoals: targetOwnGoals,
      cleanSheets: targetCleanSheets,
    });
    await this.ensureUniquePlayerStat(targetStageId, targetTeamId, targetPlayerId, id);

    if (updateDto.seasonId !== undefined) payload.seasonId = targetSeasonId;
    if (updateDto.stageId !== undefined) payload.stageId = targetStageId;
    if (updateDto.teamId !== undefined) payload.teamId = targetTeamId;
    if (updateDto.playerId !== undefined) payload.playerId = targetPlayerId;
    if (updateDto.matchesPlayed !== undefined) payload.matchesPlayed = targetMatchesPlayed;
    if (updateDto.matchesStarted !== undefined) payload.matchesStarted = targetMatchesStarted;
    if (updateDto.minutesPlayed !== undefined) payload.minutesPlayed = targetMinutesPlayed;
    if (updateDto.goals !== undefined) payload.goals = targetGoals;
    if (updateDto.assists !== undefined) payload.assists = targetAssists;
    if (updateDto.yellowCards !== undefined) payload.yellowCards = targetYellowCards;
    if (updateDto.redCards !== undefined) payload.redCards = targetRedCards;
    if (updateDto.ownGoals !== undefined) payload.ownGoals = targetOwnGoals;
    if (updateDto.cleanSheets !== undefined) payload.cleanSheets = targetCleanSheets;

    return playerStat.update(payload);
  }

  async remove(id: number): Promise<void> {
    const playerStat = await this.findById(id);
    await playerStat.destroy();
  }

  private async findMany(query: QueryPlayerStatDto) {
    const page = this.toPositiveNumber(query.page, 1);
    const limit = this.toPositiveNumber(query.limit, 20);
    const offset = (page - 1) * limit;

    const where: WhereOptions<PlayerStat> = {};

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

    if (query.playerId !== undefined) {
      const playerId = this.toPositiveNumber(query.playerId, 0);
      await this.findTenantPlayer(playerId);
      where.playerId = playerId;
    }

    const { rows, count } = await this.playerStatModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["stageId", "ASC"],
        ["goals", "DESC"],
        ["assists", "DESC"],
        ["minutesPlayed", "DESC"],
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
    matchesPlayed: number;
    matchesStarted: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    ownGoals: number;
    cleanSheets: number;
  }) {
    if (payload.matchesStarted > payload.matchesPlayed) {
      throw new BadRequestException("matchesStarted cannot be greater than matchesPlayed");
    }

    if (payload.cleanSheets > payload.matchesPlayed) {
      throw new BadRequestException("cleanSheets cannot be greater than matchesPlayed");
    }

    if (payload.redCards > payload.matchesPlayed) {
      throw new BadRequestException("redCards cannot be greater than matchesPlayed");
    }

    if (payload.minutesPlayed > payload.matchesPlayed * 130) {
      throw new BadRequestException("minutesPlayed exceeds a reasonable maximum for matchesPlayed");
    }
  }

  private async ensureUniquePlayerStat(
    stageId: number,
    teamId: number,
    playerId: number,
    excludeId?: number,
  ) {
    const where: WhereOptions<PlayerStat> = this.withTenantWhere({ stageId, teamId, playerId });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.playerStatModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException(
        "This player already has a stats row for the selected team and stage",
      );
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

  private async findTenantPlayer(playerId: number): Promise<Player> {
    const player = await this.playerModel.findOne({
      where: this.withTenantWhere({ id: playerId }),
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    return player;
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
