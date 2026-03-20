import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Player } from "./player.entity";
import { CreatePlayerDto } from "./dto/create-player.dto";
import { UpdatePlayerDto } from "./dto/update-player.dto";
import { QueryPlayerDto } from "./dto/query-player.dto";
import { PlayerPhotoService } from "./playerPhoto.service";
import { User } from "@/modules/users/user.entity";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";

@Injectable()
export class PlayersService extends TenantScopedService {
  constructor(
    @InjectModel(Player)
    private readonly playerModel: typeof Player,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly playerPhotoService: PlayerPhotoService,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createPlayerDto: CreatePlayerDto, file?: Express.Multer.File): Promise<Player> {
    const user = await this.findTenantUser(createPlayerDto.userId);
    await this.ensureUserHasNoPlayer(user.id);

    const snapshot = this.buildPlayerSnapshot(user, createPlayerDto);

    const player = await this.playerModel.create({
      tenantId: this.getCurrentTenantId(),
      userId: user.id,
      ...snapshot,
      isActive: this.parseBoolean(createPlayerDto.isActive) ?? true,
      metadata: createPlayerDto.metadata ?? null,
    });

    if (file) {
      const stored = await this.playerPhotoService.upload(player.id, file);
      player.photoUrl = stored.key;
      await player.save();
    }

    return player;
  }

  async findAll(query: QueryPlayerDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const where: WhereOptions<Player> = {};

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { firstName: { [Op.like]: search } },
        { lastName: { [Op.like]: search } },
        { fullName: { [Op.like]: search } },
      ];
    }

    if (query.userId !== undefined) {
      await this.findTenantUser(this.toNumber(query.userId, 0));
      where.userId = this.toNumber(query.userId, 0);
    }

    if (query.nationality?.trim()) {
      where.nationality = query.nationality.trim().toUpperCase();
    }

    if (query.position?.trim()) {
      where.position = {
        [Op.like]: `%${query.position.trim()}%`,
      } as any;
    }

    const isActive = this.parseBoolean(query.isActive);
    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const { rows, count } = await this.playerModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [["fullName", "ASC"]],
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

  async findById(id: number): Promise<Player> {
    const player = await this.playerModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  async findByUserId(userId: number): Promise<Player> {
    await this.findTenantUser(userId);

    const player = await this.playerModel.findOne({
      where: this.withTenantWhere({ userId }),
    });

    if (!player) {
      throw new NotFoundException(`Player for user ID ${userId} not found`);
    }

    return player;
  }

  async update(
    id: number,
    updatePlayerDto: UpdatePlayerDto,
    file?: Express.Multer.File,
  ): Promise<Player> {
    const player = await this.findById(id);
    const payload: Partial<Player> = {};

    if (updatePlayerDto.userId !== undefined && updatePlayerDto.userId !== player.userId) {
      const user = await this.findTenantUser(updatePlayerDto.userId);
      await this.ensureUserHasNoPlayer(user.id, id);
      payload.userId = user.id;
    }

    const firstName =
      updatePlayerDto.firstName !== undefined
        ? this.normalizeNullableString(updatePlayerDto.firstName)
        : player.firstName;
    const lastName =
      updatePlayerDto.lastName !== undefined
        ? this.normalizeNullableString(updatePlayerDto.lastName)
        : player.lastName;
    const fullNameInput =
      updatePlayerDto.fullName !== undefined
        ? this.normalizeNullableString(updatePlayerDto.fullName)
        : undefined;

    if (updatePlayerDto.firstName !== undefined) {
      payload.firstName = firstName || player.firstName;
    }

    if (updatePlayerDto.lastName !== undefined) {
      payload.lastName = lastName;
    }

    if (
      updatePlayerDto.firstName !== undefined ||
      updatePlayerDto.lastName !== undefined ||
      updatePlayerDto.fullName !== undefined
    ) {
      payload.fullName =
        fullNameInput ?? this.composeFullName(firstName || player.firstName, lastName);
    }

    if (updatePlayerDto.birthDate !== undefined) {
      payload.birthDate = updatePlayerDto.birthDate ?? null;
    }

    if (updatePlayerDto.nationality !== undefined) {
      payload.nationality =
        this.normalizeNullableString(updatePlayerDto.nationality)?.toUpperCase() ?? null;
    }

    if (updatePlayerDto.position !== undefined) {
      payload.position = this.normalizeNullableString(updatePlayerDto.position);
    }

    if (updatePlayerDto.photoUrl !== undefined) {
      payload.photoUrl = this.normalizeNullableString(updatePlayerDto.photoUrl);
    }

    if (updatePlayerDto.metadata !== undefined) {
      payload.metadata = updatePlayerDto.metadata ?? null;
    }

    if (updatePlayerDto.isActive !== undefined) {
      payload.isActive = this.parseBoolean(updatePlayerDto.isActive);
    }

    if (file) {
      await this.playerPhotoService.deletePhotoIfExists(player.photoUrl);
      const stored = await this.playerPhotoService.upload(player.id, file);
      payload.photoUrl = stored.key;
    }

    return player.update(payload);
  }

  async remove(id: number): Promise<void> {
    const player = await this.findById(id);
    await this.playerPhotoService.deletePhotoIfExists(player.photoUrl);
    await player.destroy();
  }

  private async findTenantUser(userId: number): Promise<User> {
    const user = await this.userModel.findOne({
      where: this.withTenantWhere({ id: userId }),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  private async ensureUserHasNoPlayer(userId: number, excludeId?: number): Promise<void> {
    const where: WhereOptions<Player> = this.withTenantWhere({ userId });

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existingPlayer = await this.playerModel.findOne({
      where,
      paranoid: false,
    });

    if (existingPlayer) {
      throw new ConflictException("This user already has a player profile in this tenant");
    }
  }

  private buildPlayerSnapshot(user: User, dto: CreatePlayerDto) {
    const nameParts = this.splitName(user.name);
    const firstName = this.normalizeNullableString(dto.firstName) ?? nameParts.firstName;
    const lastName = this.normalizeNullableString(dto.lastName) ?? nameParts.lastName;

    return {
      firstName,
      lastName,
      fullName:
        this.normalizeNullableString(dto.fullName) ?? this.composeFullName(firstName, lastName),
      birthDate: dto.birthDate ?? null,
      nationality: this.normalizeNullableString(dto.nationality)?.toUpperCase() ?? null,
      position: this.normalizeNullableString(dto.position) ?? user.primaryPosition ?? null,
      photoUrl: this.normalizeNullableString(dto.photoUrl) ?? user.avatarFilename ?? null,
    };
  }

  private splitName(fullName: string) {
    const normalized = fullName.trim().replace(/\s+/g, " ");
    const [firstName, ...rest] = normalized.split(" ");

    return {
      firstName,
      lastName: rest.length ? rest.join(" ") : null,
    };
  }

  private composeFullName(firstName: string, lastName?: string | null) {
    return [firstName, lastName].filter(Boolean).join(" ").trim();
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
