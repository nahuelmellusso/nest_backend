import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { SeasonTeamPlayer } from "@/modules/season-team-players/season-team-player.entity";
import { SeasonTeam } from "@/modules/season-teams/season-team.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { CreateMatchLineupDto } from "./dto/create-match-lineup.dto";
import { QueryMatchLineupDto } from "./dto/query-match-lineup.dto";
import { UpdateMatchLineupDto } from "./dto/update-match-lineup.dto";
import { MatchLineup } from "./match-lineup.entity";

@Injectable()
export class MatchLineupsService extends TenantScopedService {
  constructor(
    @InjectModel(MatchLineup)
    private readonly matchLineupModel: typeof MatchLineup,
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

  async create(createDto: CreateMatchLineupDto): Promise<MatchLineup> {
    const match = await this.findTenantMatch(createDto.matchId);
    await this.validateRelations(match, createDto.teamId, createDto.playerId);
    await this.ensureUniquePlayer(createDto.matchId, createDto.teamId, createDto.playerId);
    await this.ensureSingleCaptain(
      createDto.matchId,
      createDto.teamId,
      this.parseBoolean(createDto.isCaptain) ?? false,
    );
    this.validateMinutes(createDto.minuteIn, createDto.minuteOut);

    return this.matchLineupModel.create({
      tenantId: this.getCurrentTenantId(),
      matchId: match.id,
      teamId: createDto.teamId,
      playerId: createDto.playerId,
      role: createDto.role,
      position: this.normalizeNullableString(createDto.position),
      shirtNumber: this.parseNullableNumber(createDto.shirtNumber),
      isCaptain: this.parseBoolean(createDto.isCaptain) ?? false,
      minuteIn: this.parseNullableNumber(createDto.minuteIn),
      minuteOut: this.parseNullableNumber(createDto.minuteOut),
    });
  }

  async findAll(query: QueryMatchLineupDto) {
    return this.findMany(query);
  }

  async findByMatch(matchId: number, query: QueryMatchLineupDto = {}) {
    await this.findTenantMatch(matchId);

    return this.findMany({
      ...query,
      matchId,
    });
  }

  async findById(id: number): Promise<MatchLineup> {
    const lineup = await this.matchLineupModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!lineup) {
      throw new NotFoundException(`Match lineup with ID ${id} not found`);
    }

    return lineup;
  }

  async update(id: number, updateDto: UpdateMatchLineupDto): Promise<MatchLineup> {
    const lineup = await this.findById(id);
    const payload: Partial<MatchLineup> = {};

    const targetMatch =
      updateDto.matchId !== undefined
        ? await this.findTenantMatch(this.toNumber(updateDto.matchId, 0))
        : await this.findTenantMatch(lineup.matchId);
    const targetTeamId =
      updateDto.teamId !== undefined ? this.toNumber(updateDto.teamId, 0) : lineup.teamId;
    const targetPlayerId =
      updateDto.playerId !== undefined ? this.toNumber(updateDto.playerId, 0) : lineup.playerId;
    const targetIsCaptain =
      updateDto.isCaptain !== undefined
        ? (this.parseBoolean(updateDto.isCaptain) ?? false)
        : lineup.isCaptain;
    const targetMinuteIn =
      updateDto.minuteIn !== undefined
        ? this.parseNullableNumber(updateDto.minuteIn)
        : lineup.minuteIn;
    const targetMinuteOut =
      updateDto.minuteOut !== undefined
        ? this.parseNullableNumber(updateDto.minuteOut)
        : lineup.minuteOut;

    await this.validateRelations(targetMatch, targetTeamId, targetPlayerId);
    await this.ensureUniquePlayer(targetMatch.id, targetTeamId, targetPlayerId, id);
    await this.ensureSingleCaptain(targetMatch.id, targetTeamId, targetIsCaptain, id);
    this.validateMinutes(targetMinuteIn, targetMinuteOut);

    if (updateDto.matchId !== undefined) payload.matchId = targetMatch.id;
    if (updateDto.teamId !== undefined) payload.teamId = targetTeamId;
    if (updateDto.playerId !== undefined) payload.playerId = targetPlayerId;
    if (updateDto.role !== undefined) payload.role = updateDto.role;
    if (updateDto.position !== undefined) {
      payload.position = this.normalizeNullableString(updateDto.position);
    }
    if (updateDto.shirtNumber !== undefined) {
      payload.shirtNumber = this.parseNullableNumber(updateDto.shirtNumber);
    }
    if (updateDto.isCaptain !== undefined) payload.isCaptain = targetIsCaptain;
    if (updateDto.minuteIn !== undefined) payload.minuteIn = targetMinuteIn;
    if (updateDto.minuteOut !== undefined) payload.minuteOut = targetMinuteOut;

    return lineup.update(payload);
  }

  async remove(id: number): Promise<void> {
    const lineup = await this.findById(id);
    await lineup.destroy();
  }

  private async findMany(query: QueryMatchLineupDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 30);
    const offset = (page - 1) * limit;

    const where: WhereOptions<MatchLineup> = {};

    if (query.matchId !== undefined) {
      const matchId = this.toNumber(query.matchId, 0);
      await this.findTenantMatch(matchId);
      where.matchId = matchId;
    }

    if (query.teamId !== undefined) {
      const teamId = this.toNumber(query.teamId, 0);
      await this.findTenantTeam(teamId);
      where.teamId = teamId;
    }

    if (query.playerId !== undefined) {
      const playerId = this.toNumber(query.playerId, 0);
      await this.findTenantPlayer(playerId);
      where.playerId = playerId;
    }

    if (query.role) {
      where.role = query.role;
    }

    const { rows, count } = await this.matchLineupModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["matchId", "ASC"],
        ["teamId", "ASC"],
        ["role", "ASC"],
        ["shirtNumber", "ASC"],
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

  private async validateRelations(match: Match, teamId: number, playerId: number) {
    const team = await this.findTenantTeam(teamId);
    await this.findTenantPlayer(playerId);

    if (![match.homeTeamId, match.awayTeamId].includes(team.id)) {
      throw new BadRequestException("teamId must belong to one of the teams in the match");
    }

    await this.ensurePlayerBelongsToMatchRoster(match, teamId, playerId);
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
        "playerId must belong to the selected team's roster for the match season",
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
        "playerId must be active in the selected team's roster on the match date",
      );
    }
  }

  private async ensureUniquePlayer(
    matchId: number,
    teamId: number,
    playerId: number,
    excludeId?: number,
  ) {
    const where: WhereOptions<MatchLineup> = this.withTenantWhere({
      matchId,
      teamId,
      playerId,
    });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.matchLineupModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException(
        "This player is already assigned to the selected team in this match",
      );
    }
  }

  private async ensureSingleCaptain(
    matchId: number,
    teamId: number,
    isCaptain: boolean,
    excludeId?: number,
  ) {
    if (!isCaptain) return;

    const where: WhereOptions<MatchLineup> = this.withTenantWhere({
      matchId,
      teamId,
      isCaptain: true,
    });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existingCaptain = await this.matchLineupModel.findOne({ where, paranoid: false });

    if (existingCaptain) {
      throw new ConflictException("A captain is already assigned for this team in the match");
    }
  }

  private validateMinutes(minuteIn?: number | string | null, minuteOut?: number | string | null) {
    const parsedMinuteIn = this.parseNullableNumber(minuteIn);
    const parsedMinuteOut = this.parseNullableNumber(minuteOut);

    if (parsedMinuteIn !== null && parsedMinuteOut !== null && parsedMinuteOut < parsedMinuteIn) {
      throw new BadRequestException("minuteOut must be greater than or equal to minuteIn");
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
