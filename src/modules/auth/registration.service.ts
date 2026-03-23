import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { TypedEventEmitter } from "@/event-emitter/typed-event-emitter.class";
import { UsersService } from "@/modules/users/users.service";
import { TenantsService } from "@/modules/tenants/tenants.service";
import { JwtService } from "@nestjs/jwt";
import { Sequelize } from "sequelize-typescript";
import { generateSlug } from "@/utils/slug.util";
import { RegisterOwnerDto } from "./dto/register-owner.dto";
import { RegisterTenantUserDto } from "./dto/register-tenant-user.dto";

@Injectable()
export class RegistrationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly sequelize: Sequelize,
    private readonly typedEventEmitter: TypedEventEmitter,
  ) {}

  async registerOwner(registerOwnerDto: RegisterOwnerDto) {
    const tenantBaseName = registerOwnerDto.tenantName?.trim() || registerOwnerDto.name.trim();

    if (!tenantBaseName) {
      throw new BadRequestException("Tenant name is required");
    }

    const baseSlug = generateSlug(tenantBaseName);
    const uniqueSlug = await this.tenantsService.generateUniqueSlug(baseSlug);

    const result = await this.sequelize.transaction(async (transaction) => {
      const tenant = await this.tenantsService.create(
        {
          name: tenantBaseName,
          slug: uniqueSlug,
          status: "active",
        },
        transaction,
      );

      const existingUser = await this.usersService.findByEmailInTenant(
        registerOwnerDto.email,
        tenant.id,
        false,
        transaction,
      );

      if (existingUser) {
        throw new ConflictException("Email already exists in this tenant");
      }

      const user = await this.usersService.createUser(
        {
          name: registerOwnerDto.name,
          email: registerOwnerDto.email,
          password: registerOwnerDto.password,
          tenantId: tenant.id,
          isEmailVerified: false,
          isAdmin: true,
          primaryPosition: registerOwnerDto.primaryPosition ?? null,
          secondaryPosition: registerOwnerDto.secondaryPosition ?? null,
          avatarFilename: null,
        },
        transaction,
      );

      const payload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenantId,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      };
    });

    this.typedEventEmitter.emit("user.registered", {
      userId: result.user.id,
      tenantId: result.user.tenantId,
      tenantName: result.tenant.name,
      name: result.user.name,
      email: result.user.email,
    });

    return result;
  }

  async registerUserInTenant(registerTenantUserDto: RegisterTenantUserDto, tenantSlug: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const existingUser = await this.usersService.findByEmailInTenant(
      registerTenantUserDto.email,
      tenant.id,
    );

    if (existingUser) {
      throw new ConflictException("Email already exists in this tenant");
    }

    const user = await this.usersService.createUser({
      name: registerTenantUserDto.name,
      email: registerTenantUserDto.email,
      password: registerTenantUserDto.password,
      tenantId: tenant.id,
      isEmailVerified: false,
      isAdmin: false,
      primaryPosition: registerTenantUserDto.primaryPosition ?? null,
      secondaryPosition: registerTenantUserDto.secondaryPosition ?? null,
      avatarFilename: null,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const result = {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };

    this.typedEventEmitter.emit("user.registered", {
      userId: result.user.id,
      tenantId: result.user.tenantId,
      tenantName: result.tenant.name,
      name: result.user.name,
      email: result.user.email,
    });

    return result;
  }
}
