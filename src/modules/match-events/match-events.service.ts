import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { MatchEventPeriod } from "@/enums/match-event-period.enum";
import { MatchEventType } from "@/enums/match-event-type.enum";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { SeasonTeamPlayer } from "@/modules/season-team-players/season-team-player.entity";
import { SeasonTeam } from "@/modules/season-teams/season-team.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { CreateMatchEventDto } from "./dto/create-match-event.dto";
import { QueryMatchEventDto } from "./dto/query-match-event.dto";
import { UpdateMatchEventDto } from "./dto/update-match-event.dto";
import { MatchEvent } from "./match-event.entity";

@Injectable()
export class MatchEventsService extends TenantScopedService {
  constructor(
    @InjectModel(MatchEvent)
    private readonly matchEventModel: typeof MatchEvent,
    @InjectModel(Match)
    private readonly matchModel: typeof Match,
    @InjectModel(Team)
    private readonly teamModel: typeof Team,
    @InjectModel(Player)
    private readonly playerModel: typeof Player,
    @InjectModel(SeasonTeam)
    private readonly seasonTeamModel: typeof SeasonTeam,
    @InjectModel(SeasonTeamPlayer)
    private readonly seasonTeamPlayerModel: typeof SeasonTeamPlayer,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createDto: CreateMatchEventDto): Promise<MatchEvent> {
    const match = await this.findTenantMatch(createDto.matchId);
    await this.validateEventRelations(
      match,
      createDto.teamId,
      createDto.playerId,
      createDto.relatedPlayerId,
      createDto.type,
    );

    return this.matchEventModel.create({
      tenantId: this.getCurrentTenantId(),
      matchId: match.id,
      teamId: createDto.teamId,
      playerId: createDto.playerId ?? null,
      relatedPlayerId: createDto.relatedPlayerId ?? null,
      type: createDto.type,
      minute: this.toNumber(createDto.minute, 0),
      extraMinute: this.parseNullableNumber(createDto.extraMinute),
      period: createDto.period,
      description: this.normalizeNullableString(createDto.description),
    });
  }

  async findAll(query: QueryMatchEventDto) {
    return this.findMany(query);
  }

  async findByMatch(matchId: number, query: QueryMatchEventDto = {}) {
    await this.findTenantMatch(matchId);

    return this.findMany({
      ...query,
      matchId,
    });
  }

  async findById(id: number): Promise<MatchEvent> {
    const event = await this.matchEventModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!event) {
      throw new NotFoundException(`Match event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: number, updateDto: UpdateMatchEventDto): Promise<MatchEvent> {
    const event = await this.findById(id);
    const payload: Partial<MatchEvent> = {};

    const targetMatch =
      updateDto.matchId !== undefined
        ? await this.findTenantMatch(updateDto.matchId)
        : await this.findTenantMatch(event.matchId);
    const targetTeamId = updateDto.teamId !== undefined ? updateDto.teamId : event.teamId;
    const targetPlayerId =
      updateDto.playerId !== undefined ? (updateDto.playerId ?? null) : event.playerId;
    const targetRelatedPlayerId =
      updateDto.relatedPlayerId !== undefined
        ? (updateDto.relatedPlayerId ?? null)
        : event.relatedPlayerId;
    const targetType = updateDto.type !== undefined ? updateDto.type : event.type;

    await this.validateEventRelations(
      targetMatch,
      targetTeamId,
      targetPlayerId,
      targetRelatedPlayerId,
      targetType,
    );

    if (updateDto.matchId !== undefined) payload.matchId = targetMatch.id;
    if (updateDto.teamId !== undefined) payload.teamId = updateDto.teamId;
    if (updateDto.playerId !== undefined) payload.playerId = updateDto.playerId ?? null;
    if (updateDto.relatedPlayerId !== undefined)
      payload.relatedPlayerId = updateDto.relatedPlayerId ?? null;
    if (updateDto.type !== undefined) payload.type = updateDto.type;
    if (updateDto.minute !== undefined) payload.minute = this.toNumber(updateDto.minute, 0);
    if (updateDto.extraMinute !== undefined)
      payload.extraMinute = this.parseNullableNumber(updateDto.extraMinute);
    if (updateDto.period !== undefined) payload.period = updateDto.period;
    if (updateDto.description !== undefined)
      payload.description = this.normalizeNullableString(updateDto.description);

    return event.update(payload);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findById(id);
    await event.destroy();
  }

  private async findMany(query: QueryMatchEventDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 20);
    const offset = (page - 1) * limit;

    const where: WhereOptions<MatchEvent> = {};

    if (query.matchId !== undefined) {
      await this.findTenantMatch(this.toNumber(query.matchId, 0));
      where.matchId = this.toNumber(query.matchId, 0);
    }

    if (query.teamId !== undefined) {
      await this.findTenantTeam(this.toNumber(query.teamId, 0));
      where.teamId = this.toNumber(query.teamId, 0);
    }

    if (query.playerId !== undefined) {
      await this.findTenantPlayer(this.toNumber(query.playerId, 0));
      where.playerId = this.toNumber(query.playerId, 0);
    }

    if (query.type) where.type = query.type;
    if (query.period) where.period = query.period;

    if (query.minuteFrom !== undefined || query.minuteTo !== undefined) {
      where.minute = {} as any;
      if (query.minuteFrom !== undefined) where.minute[Op.gte] = this.toNumber(query.minuteFrom, 0);
      if (query.minuteTo !== undefined) where.minute[Op.lte] = this.toNumber(query.minuteTo, 0);
    }

    const { rows, count } = await this.matchEventModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["minute", "ASC"],
        ["extraMinute", "ASC"],
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

  private async validateEventRelations(
    match: Match,
    teamId: number,
    playerId: number | null | undefined,
    relatedPlayerId: number | null | undefined,
    type: MatchEventType,
  ) {
    const team = await this.findTenantTeam(teamId);

    if (![match.homeTeamId, match.awayTeamId].includes(team.id)) {
      throw new BadRequestException("teamId must belong to one of the teams in the match");
    }

    if (playerId) {
      await this.findTenantPlayer(playerId);
      await this.ensurePlayerBelongsToMatchRoster(match, teamId, playerId);
    }

    if (relatedPlayerId) {
      await this.findTenantPlayer(relatedPlayerId);
      await this.ensurePlayerBelongsToMatchRoster(match, teamId, relatedPlayerId);
    }

    if (playerId && relatedPlayerId && playerId === relatedPlayerId) {
      throw new BadRequestException("playerId and relatedPlayerId must be different");
    }

    if (type === MatchEventType.SUBSTITUTION && (!playerId || !relatedPlayerId)) {
      throw new BadRequestException(
        "Substitution events require both playerId and relatedPlayerId",
      );
    }
  }

  private async ensurePlayerBelongsToMatchRoster(match: Match, teamId: number, playerId: number) {
    const seasonTeam = await this.seasonTeamModel.findOne({
      where: this.withTenantWhere({ seasonId: match.seasonId, teamId }),
    });

    if (!seasonTeam) {
      throw new BadRequestException("The selected team is not registered for the match season");
    }

    const membership = await this.seasonTeamPlayerModel.findOne({
      where: this.withTenantWhere({ seasonTeamId: seasonTeam.id, playerId }),
    });

    if (!membership) {
      throw new BadRequestException(
        "Players referenced by the event must belong to the selected team's roster for the match season",
      );
    }

    if (!membership.isActive) {
      throw new BadRequestException("The selected player roster membership is inactive");
    }

    const matchTime = new Date(match.matchDate).getTime();
    const joinedAt = new Date(membership.joinedAt).getTime();
    const leftAt = membership.leftAt ? new Date(membership.leftAt).getTime() : null;

    if (joinedAt > matchTime || (leftAt !== null && leftAt < matchTime)) {
      throw new BadRequestException(
        "Players referenced by the event must be active in the team's roster on the match date",
      );
    }
  }

  private async findTenantMatch(matchId: number): Promise<Match> {
    const match = await this.matchModel.findOne({
      where: this.withTenantWhere({ id: matchId }),
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    return match;
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

  private normalizeNullableString(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private toNumber(value: number | string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
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
