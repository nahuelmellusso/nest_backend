import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Tenant } from "./tenant.entity";
import { InjectModel } from "@nestjs/sequelize";

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant)
    private readonly tenantRepository: typeof Tenant,
  ) {}

  async create(
    data: { name: string; slug: string; status?: string },
    transaction?: any,
  ): Promise<Tenant> {
    return this.tenantRepository.create(
      {
        name: data.name,
        slug: data.slug,
        status: data.status ?? "active",
      },
      { transaction },
    );
  }

  async findById(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findByPk(id);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { slug },
    });
  }

  async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
