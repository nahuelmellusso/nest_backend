import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, WhereOptions } from "sequelize";
import { Team } from "./team.entity";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";
import { QueryTeamDto } from "./dto/query-team.dto";
import { TeamLogoService } from "./teamLogo.service";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { generateSlug } from "@/utils/slug.util";

@Injectable()
export class TeamsService extends TenantScopedService {
  constructor(
    @InjectModel(Team)
    private readonly teamModel: typeof Team,
    private readonly teamLogoService: TeamLogoService,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createTeamDto: CreateTeamDto, file?: Express.Multer.File): Promise<Team> {
    const tenantId = this.getCurrentTenantId();
    const normalizedSlug = createTeamDto.slug
      ? this.normalizeSlugInput(createTeamDto.slug)
      : await this.generateUniqueSlug(createTeamDto.name);

    await this.ensureSlugAvailable(normalizedSlug);

    const team = await this.teamModel.create({
      tenantId,
      name: createTeamDto.name.trim(),
      shortName: createTeamDto.shortName.trim(),
      slug: normalizedSlug,
      city: this.normalizeNullableString(createTeamDto.city),
      country: createTeamDto.country.trim().toUpperCase(),
      logoUrl: this.normalizeNullableString(createTeamDto.logoUrl),
      foundedYear: this.parseNullableNumber(createTeamDto.foundedYear),
      websiteUrl: this.normalizeNullableString(createTeamDto.websiteUrl),
      metadata: createTeamDto.metadata ?? null,
      isActive: this.parseBoolean(createTeamDto.isActive) ?? true,
    });

    if (file) {
      const stored = await this.teamLogoService.upload(team.id, file);
      team.logoUrl = stored.key;
      await team.save();
    }

    return team;
  }

  async findAll(query: QueryTeamDto) {
    const page = this.toNumber(query.page, 1);
    const limit = this.toNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const where: WhereOptions<Team> = {};

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: search } },
        { shortName: { [Op.like]: search } },
        { slug: { [Op.like]: search } },
        { city: { [Op.like]: search } },
      ];
    }

    if (query.city?.trim()) {
      where.city = {
        [Op.like]: `%${query.city.trim()}%`,
      } as any;
    }

    if (query.country?.trim()) {
      where.country = query.country.trim().toUpperCase();
    }

    const isActive = this.parseBoolean(query.isActive);
    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const { rows, count } = await this.teamModel.findAndCountAll({
      where: this.withTenantWhere(where),
      offset,
      limit,
      order: [["name", "ASC"]],
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

  async findById(id: number): Promise<Team> {
    const team = await this.teamModel.findOne({
      where: this.withTenantWhere({ id }),
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async findBySlug(slug: string): Promise<Team> {
    const normalizedSlug = this.normalizeSlugInput(slug);
    const team = await this.teamModel.findOne({
      where: this.withTenantWhere({ slug: normalizedSlug }),
    });

    if (!team) {
      throw new NotFoundException(`Team with slug "${normalizedSlug}" not found`);
    }

    return team;
  }

  async update(
    id: number,
    updateTeamDto: UpdateTeamDto,
    file?: Express.Multer.File,
  ): Promise<Team> {
    const team = await this.findById(id);
    const payload: Partial<Team> = {};

    if (updateTeamDto.name !== undefined) {
      payload.name = updateTeamDto.name.trim();
    }

    if (updateTeamDto.shortName !== undefined) {
      payload.shortName = updateTeamDto.shortName.trim();
    }

    if (updateTeamDto.slug !== undefined) {
      const normalizedSlug = this.normalizeSlugInput(updateTeamDto.slug);

      if (normalizedSlug !== team.slug) {
        await this.ensureSlugAvailable(normalizedSlug, id);
        payload.slug = normalizedSlug;
      }
    }

    if (updateTeamDto.city !== undefined) {
      payload.city = this.normalizeNullableString(updateTeamDto.city);
    }

    if (updateTeamDto.country !== undefined) {
      payload.country = updateTeamDto.country.trim().toUpperCase();
    }

    if (updateTeamDto.logoUrl !== undefined) {
      payload.logoUrl = this.normalizeNullableString(updateTeamDto.logoUrl);
    }

    if (updateTeamDto.foundedYear !== undefined) {
      payload.foundedYear = this.parseNullableNumber(updateTeamDto.foundedYear);
    }

    if (updateTeamDto.websiteUrl !== undefined) {
      payload.websiteUrl = this.normalizeNullableString(updateTeamDto.websiteUrl);
    }

    if (updateTeamDto.metadata !== undefined) {
      payload.metadata = updateTeamDto.metadata ?? null;
    }

    if (updateTeamDto.isActive !== undefined) {
      payload.isActive = this.parseBoolean(updateTeamDto.isActive);
    }

    if (file) {
      await this.teamLogoService.deleteLogoIfExists(team.logoUrl);
      const stored = await this.teamLogoService.upload(team.id, file);
      payload.logoUrl = stored.key;
    }

    return team.update(payload);
  }

  async remove(id: number): Promise<void> {
    const team = await this.findById(id);
    await this.teamLogoService.deleteLogoIfExists(team.logoUrl);
    await team.destroy();
  }

  private async ensureSlugAvailable(slug: string, excludeId?: number): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    const where: WhereOptions<Team> = {
      tenantId,
      slug,
    };

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      } as any;
    }

    const existingTeam = await this.teamModel.findOne({
      where,
      paranoid: false,
    });

    if (existingTeam) {
      throw new ConflictException("Team slug already exists in this tenant");
    }
  }

  private async generateUniqueSlug(value: string): Promise<string> {
    const baseSlug = this.normalizeSlugInput(value);
    const tenantId = this.getCurrentTenantId();

    const existingSlugs = await this.teamModel.findAll({
      where: {
        tenantId,
        slug: {
          [Op.like]: `${baseSlug}%`,
        },
      },
      attributes: ["slug"],
      paranoid: false,
    });

    const slugSet = new Set(existingSlugs.map((team) => team.slug));

    if (!slugSet.has(baseSlug)) {
      return baseSlug;
    }

    let counter = 1;
    let candidate = `${baseSlug}-${counter}`;

    while (slugSet.has(candidate)) {
      counter += 1;
      candidate = `${baseSlug}-${counter}`;
    }

    return candidate;
  }

  private normalizeSlugInput(value: string): string {
    const normalized = generateSlug(value);

    if (!normalized) {
      throw new BadRequestException("Unable to generate a valid slug");
    }

    return normalized;
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

  private parseNullableNumber(value: number | string | undefined | null): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      throw new BadRequestException("Invalid numeric value");
    }

    return parsed;
  }
}
