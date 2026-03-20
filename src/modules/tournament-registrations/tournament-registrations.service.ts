import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { CreatePlayerDto } from "@/modules/players/dto/create-player.dto";
import { Player } from "@/modules/players/player.entity";
import { PlayersService } from "@/modules/players/players.service";
import { Season } from "@/modules/seasons/season.entity";
import { Team } from "@/modules/teams/team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { Tournament } from "@/modules/tournaments/tournament.entity";
import { TournamentRegistrationStatus } from "@/enums/tournament-registration-status.enum";
import { CreateTournamentRegistrationDto } from "./dto/create-tournament-registration.dto";
import { QueryTournamentRegistrationDto } from "./dto/query-tournament-registration.dto";
import { UpdateTournamentRegistrationDto } from "./dto/update-tournament-registration.dto";
import { TournamentRegistration } from "./tournament-registration.entity";

@Injectable()
export class TournamentRegistrationsService extends TenantScopedService {
  constructor(
    @InjectModel(TournamentRegistration)
    private readonly registrationModel: typeof TournamentRegistration,
    @InjectModel(Player)
    private readonly playerModel: typeof Player,
    @InjectModel(Tournament)
    private readonly tournamentModel: typeof Tournament,
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    @InjectModel(Team)
    private readonly teamModel: typeof Team,
    private readonly playersService: PlayersService,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createDto: CreateTournamentRegistrationDto): Promise<TournamentRegistration> {
    const player = await this.resolvePlayer(createDto);
    await this.validateTournamentSeason(createDto.tournamentId, createDto.seasonId);

    if (createDto.teamId) {
      await this.findTenantTeam(createDto.teamId);
    }

    await this.ensureUniqueRegistration(player.id, createDto.seasonId);

    return this.registrationModel.create({
      tenantId: this.getCurrentTenantId(),
      playerId: player.id,
      tournamentId: createDto.tournamentId,
      seasonId: createDto.seasonId,
      teamId: createDto.teamId ?? null,
      status: createDto.status ?? TournamentRegistrationStatus.PENDING,
      registeredAt: new Date(),
      jerseyNumber: this.parseNullableNumber(createDto.jerseyNumber),
      position: this.normalizeNullableString(createDto.position),
      metadata: createDto.metadata ?? null,
      isActive: this.parseBoolean(createDto.isActive) ?? true,
    });
  }

  async findAll(query: QueryTournamentRegistrationDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const where: WhereOptions<TournamentRegistration> = {};

    if (query.tournamentId !== undefined) {
      await this.findTenantTournament(this.toNumber(query.tournamentId, 0));
      where.tournamentId = this.toNumber(query.tournamentId, 0);
    }

    if (query.seasonId !== undefined) {
      await this.findTenantSeason(this.toNumber(query.seasonId, 0));
      where.seasonId = this.toNumber(query.seasonId, 0);
    }

    if (query.playerId !== undefined) {
      await this.findTenantPlayer(this.toNumber(query.playerId, 0));
      where.playerId = this.toNumber(query.playerId, 0);
    }

    if (query.teamId !== undefined) {
      await this.findTenantTeam(this.toNumber(query.teamId, 0));
      where.teamId = this.toNumber(query.teamId, 0);
    }

    if (query.status) {
      where.status = query.status;
    }

    const isActive = this.parseBoolean(query.isActive);
    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const { rows, count } = await this.registrationModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [["registeredAt", "DESC"]],
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

  async findById(id: number): Promise<TournamentRegistration> {
    const registration = await this.registrationModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!registration) {
      throw new NotFoundException(`Tournament registration with ID ${id} not found`);
    }

    return registration;
  }

  async update(
    id: number,
    updateDto: UpdateTournamentRegistrationDto,
  ): Promise<TournamentRegistration> {
    const registration = await this.findById(id);
    const payload: Partial<TournamentRegistration> = {};

    const targetPlayer =
      updateDto.playerId !== undefined || updateDto.userId !== undefined
        ? await this.resolvePlayer(updateDto, id)
        : await this.findTenantPlayer(registration.playerId);
    const targetTournamentId =
      updateDto.tournamentId !== undefined
        ? this.toNumber(updateDto.tournamentId, 0)
        : registration.tournamentId;
    const targetSeasonId =
      updateDto.seasonId !== undefined
        ? this.toNumber(updateDto.seasonId, 0)
        : registration.seasonId;

    if (
      targetTournamentId !== registration.tournamentId ||
      targetSeasonId !== registration.seasonId
    ) {
      await this.validateTournamentSeason(targetTournamentId, targetSeasonId);
      payload.tournamentId = targetTournamentId;
      payload.seasonId = targetSeasonId;
    }

    if (targetPlayer.id !== registration.playerId) {
      payload.playerId = targetPlayer.id;
    }

    if (payload.playerId || payload.seasonId) {
      await this.ensureUniqueRegistration(targetPlayer.id, targetSeasonId, id);
    }

    if (updateDto.teamId !== undefined) {
      if (updateDto.teamId === null) {
        payload.teamId = null;
      } else {
        await this.findTenantTeam(updateDto.teamId);
        payload.teamId = updateDto.teamId;
      }
    }

    if (updateDto.status !== undefined) {
      payload.status = updateDto.status;
    }

    if (updateDto.jerseyNumber !== undefined) {
      payload.jerseyNumber = this.parseNullableNumber(updateDto.jerseyNumber);
    }

    if (updateDto.position !== undefined) {
      payload.position = this.normalizeNullableString(updateDto.position);
    }

    if (updateDto.metadata !== undefined) {
      payload.metadata = updateDto.metadata ?? null;
    }

    if (updateDto.isActive !== undefined) {
      payload.isActive = this.parseBoolean(updateDto.isActive);
    }

    return registration.update(payload);
  }

  async remove(id: number): Promise<void> {
    const registration = await this.findById(id);
    await registration.destroy();
  }

  private async resolvePlayer(
    dto: { playerId?: number; userId?: number },
    excludeRegistrationId?: number,
  ): Promise<Player> {
    if (dto.playerId) {
      return this.findTenantPlayer(dto.playerId);
    }

    if (!dto.userId) {
      throw new BadRequestException("playerId or userId is required");
    }

    try {
      return await this.playersService.findByUserId(dto.userId);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      return this.playersService.create({ userId: dto.userId } as CreatePlayerDto);
    }
  }

  private async validateTournamentSeason(tournamentId: number, seasonId: number) {
    const tournament = await this.findTenantTournament(tournamentId);
    const season = await this.findTenantSeason(seasonId);

    if (season.tournamentId !== tournament.id) {
      throw new BadRequestException("Season does not belong to the provided tournament");
    }
  }

  private async ensureUniqueRegistration(playerId: number, seasonId: number, excludeId?: number) {
    const where: WhereOptions<TournamentRegistration> = this.withTenantWhere({
      playerId,
      seasonId,
    });

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existing = await this.registrationModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException("Player is already registered for this season");
    }
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

  private async findTenantTournament(tournamentId: number): Promise<Tournament> {
    const tournament = await this.tournamentModel.findOne({
      where: this.withTenantWhere({ id: tournamentId }),
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }

    return tournament;
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
