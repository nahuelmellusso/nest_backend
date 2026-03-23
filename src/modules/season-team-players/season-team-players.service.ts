import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { SeasonTeamPlayerStatus } from "@/enums/season-team-player-status.enum";
import { Player } from "@/modules/players/player.entity";
import { SeasonTeam } from "@/modules/season-teams/season-team.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { CreateSeasonTeamPlayerDto } from "./dto/create-season-team-player.dto";
import { QuerySeasonTeamPlayerDto } from "./dto/query-season-team-player.dto";
import { UpdateSeasonTeamPlayerDto } from "./dto/update-season-team-player.dto";
import { SeasonTeamPlayer } from "./season-team-player.entity";

@Injectable()
export class SeasonTeamPlayersService extends TenantScopedService {
  constructor(
    @InjectModel(SeasonTeamPlayer)
    private readonly seasonTeamPlayerModel: typeof SeasonTeamPlayer,
    @InjectModel(SeasonTeam)
    private readonly seasonTeamModel: typeof SeasonTeam,
    @InjectModel(Player)
    private readonly playerModel: typeof Player,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createDto: CreateSeasonTeamPlayerDto): Promise<SeasonTeamPlayer> {
    await this.findTenantSeasonTeam(createDto.seasonTeamId);
    await this.findTenantPlayer(createDto.playerId);
    this.validateDates(createDto.joinedAt, createDto.leftAt);
    await this.ensureUniquePlayer(createDto.seasonTeamId, createDto.playerId);
    await this.ensureUniqueJersey(createDto.seasonTeamId, createDto.jerseyNumber);
    await this.ensureSingleCaptain(
      createDto.seasonTeamId,
      this.parseBoolean(createDto.isCaptain) ?? false,
    );

    return this.seasonTeamPlayerModel.create({
      tenantId: this.getCurrentTenantId(),
      seasonTeamId: createDto.seasonTeamId,
      playerId: createDto.playerId,
      jerseyNumber: this.parseNullablePositiveNumber(createDto.jerseyNumber),
      position: this.normalizeNullableString(createDto.position),
      status: createDto.status ?? SeasonTeamPlayerStatus.ACTIVE,
      joinedAt: this.parseDate(createDto.joinedAt),
      leftAt: this.parseNullableDate(createDto.leftAt),
      isCaptain: this.parseBoolean(createDto.isCaptain) ?? false,
      metadata: createDto.metadata ?? null,
      isActive: this.parseBoolean(createDto.isActive) ?? true,
    });
  }

  async findAll(query: QuerySeasonTeamPlayerDto) {
    return this.findMany(query);
  }

  async findBySeasonTeam(seasonTeamId: number, query: QuerySeasonTeamPlayerDto = {}) {
    await this.findTenantSeasonTeam(seasonTeamId);

    return this.findMany({
      ...query,
      seasonTeamId,
    });
  }

  async findById(id: number): Promise<SeasonTeamPlayer> {
    const membership = await this.seasonTeamPlayerModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!membership) {
      throw new NotFoundException(`Season team player with ID ${id} not found`);
    }

    return membership;
  }

  async update(id: number, updateDto: UpdateSeasonTeamPlayerDto): Promise<SeasonTeamPlayer> {
    const membership = await this.findById(id);
    const payload: Partial<SeasonTeamPlayer> = {};

    const targetSeasonTeamId =
      updateDto.seasonTeamId !== undefined
        ? this.toPositiveNumber(updateDto.seasonTeamId, 0)
        : membership.seasonTeamId;
    const targetPlayerId =
      updateDto.playerId !== undefined
        ? this.toPositiveNumber(updateDto.playerId, 0)
        : membership.playerId;
    const targetJerseyNumber =
      updateDto.jerseyNumber !== undefined
        ? this.parseNullablePositiveNumber(updateDto.jerseyNumber)
        : membership.jerseyNumber;
    const targetIsCaptain =
      updateDto.isCaptain !== undefined
        ? (this.parseBoolean(updateDto.isCaptain) ?? false)
        : membership.isCaptain;
    const targetJoinedAt =
      updateDto.joinedAt !== undefined ? this.parseDate(updateDto.joinedAt) : membership.joinedAt;
    const targetLeftAt =
      updateDto.leftAt !== undefined ? this.parseNullableDate(updateDto.leftAt) : membership.leftAt;

    await this.findTenantSeasonTeam(targetSeasonTeamId);
    await this.findTenantPlayer(targetPlayerId);
    this.validateDates(targetJoinedAt, targetLeftAt);
    await this.ensureUniquePlayer(targetSeasonTeamId, targetPlayerId, id);
    await this.ensureUniqueJersey(targetSeasonTeamId, targetJerseyNumber, id);
    await this.ensureSingleCaptain(targetSeasonTeamId, targetIsCaptain, id);

    if (updateDto.seasonTeamId !== undefined) payload.seasonTeamId = targetSeasonTeamId;
    if (updateDto.playerId !== undefined) payload.playerId = targetPlayerId;
    if (updateDto.jerseyNumber !== undefined) payload.jerseyNumber = targetJerseyNumber;
    if (updateDto.position !== undefined) {
      payload.position = this.normalizeNullableString(updateDto.position);
    }
    if (updateDto.status !== undefined) payload.status = updateDto.status;
    if (updateDto.joinedAt !== undefined) payload.joinedAt = targetJoinedAt;
    if (updateDto.leftAt !== undefined) payload.leftAt = targetLeftAt;
    if (updateDto.isCaptain !== undefined) payload.isCaptain = targetIsCaptain;
    if (updateDto.metadata !== undefined) payload.metadata = updateDto.metadata ?? null;
    if (updateDto.isActive !== undefined) payload.isActive = this.parseBoolean(updateDto.isActive);

    return membership.update(payload);
  }

  async remove(id: number): Promise<void> {
    const membership = await this.findById(id);
    await membership.destroy();
  }

  private async findMany(query: QuerySeasonTeamPlayerDto) {
    const page = this.toPositiveNumber(query.page, 1);
    const limit = this.toPositiveNumber(query.limit, 20);
    const offset = (page - 1) * limit;

    const where: WhereOptions<SeasonTeamPlayer> = {};

    if (query.seasonTeamId !== undefined) {
      const seasonTeamId = this.toPositiveNumber(query.seasonTeamId, 0);
      await this.findTenantSeasonTeam(seasonTeamId);
      where.seasonTeamId = seasonTeamId;
    }

    if (query.playerId !== undefined) {
      const playerId = this.toPositiveNumber(query.playerId, 0);
      await this.findTenantPlayer(playerId);
      where.playerId = playerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const { rows, count } = await this.seasonTeamPlayerModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [
        ["seasonTeamId", "ASC"],
        ["jerseyNumber", "ASC"],
        ["playerId", "ASC"],
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

  private async ensureUniquePlayer(seasonTeamId: number, playerId: number, excludeId?: number) {
    const where: WhereOptions<SeasonTeamPlayer> = this.withTenantWhere({ seasonTeamId, playerId });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.seasonTeamPlayerModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException("This player is already assigned to the selected season team");
    }
  }

  private async ensureUniqueJersey(
    seasonTeamId: number,
    jerseyNumber?: number | null,
    excludeId?: number,
  ) {
    if (jerseyNumber === undefined || jerseyNumber === null) return;

    const where: WhereOptions<SeasonTeamPlayer> = this.withTenantWhere({
      seasonTeamId,
      jerseyNumber,
    });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.seasonTeamPlayerModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException(
        "This jersey number is already assigned in the selected season team",
      );
    }
  }

  private async ensureSingleCaptain(seasonTeamId: number, isCaptain: boolean, excludeId?: number) {
    if (!isCaptain) return;

    const where: WhereOptions<SeasonTeamPlayer> = this.withTenantWhere({
      seasonTeamId,
      isCaptain: true,
    });

    if (excludeId) {
      where.id = { [Op.ne]: excludeId } as any;
    }

    const existing = await this.seasonTeamPlayerModel.findOne({ where, paranoid: false });

    if (existing) {
      throw new ConflictException("A captain is already assigned for the selected season team");
    }
  }

  private async findTenantSeasonTeam(seasonTeamId: number): Promise<SeasonTeam> {
    const seasonTeam = await this.seasonTeamModel.findOne({
      where: this.withTenantWhere({ id: seasonTeamId }),
    });

    if (!seasonTeam) {
      throw new NotFoundException(`Season team with ID ${seasonTeamId} not found`);
    }

    return seasonTeam;
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

  private validateDates(joinedAt?: string | Date | null, leftAt?: string | Date | null) {
    const joinedDate = this.parseNullableDate(joinedAt);
    const leftDate = this.parseNullableDate(leftAt);

    if (joinedDate && leftDate && leftDate < joinedDate) {
      throw new BadRequestException("leftAt must be greater than or equal to joinedAt");
    }
  }

  private normalizeNullableString(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private parseDate(value?: string | Date): Date {
    if (!value) return new Date();
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Invalid date value");
    }
    return date;
  }

  private parseNullableDate(value?: string | Date | null): Date | null {
    if (value === undefined || value === null || value === "") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Invalid date value");
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
