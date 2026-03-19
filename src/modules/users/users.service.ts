import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { User } from "./user.entity";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ApiResponse, Paginated } from "../types";
import { ListUsersQueryDto } from "./dto/list-users.query";
import { Op, Transaction } from "sequelize";
import { UserAvatarService } from "./avatar.service";
import { TenantContextService } from "@/modules/tenancy/services/tenant-context.service";
import { TenantScopedService } from "@/modules/tenancy/services/tenant-scoped.service";

type CreateUserData = {
  name: string;
  email: string;
  password: string;
  tenantId: number;
  isAdmin?: boolean;
  isEmailVerified?: boolean;
  avatarFilename?: string | null;
  primaryPosition?: string | null;
  secondaryPosition?: string | null;
};

@Injectable()
export class UsersService extends TenantScopedService {
  constructor(
    @Inject("USER_REPOSITORY")
    private readonly userRepository: typeof User,
    private readonly userAvatarService: UserAvatarService,
    tenantContextService: TenantContextService,
  ) {
    super(tenantContextService);
  }

  async create(createUserDto: CreateUserDto, file?: Express.Multer.File): Promise<ApiResponse> {
    const tenantId = this.getCurrentTenantId();

    const existingUser = await this.findByEmailInTenant(createUserDto.email, tenantId);

    if (existingUser) {
      throw new ConflictException("Email already exists in this tenant");
    }

    const createdUser = await this.createUser({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      tenantId,
      isAdmin: createUserDto.isAdmin ?? false,
      isEmailVerified: createUserDto.isEmailVerified ?? false,
      avatarFilename: createUserDto.avatarFilename ?? null,
      primaryPosition: createUserDto.primaryPosition ?? null,
      secondaryPosition: createUserDto.secondaryPosition ?? null,
    });

    if (file) {
      const stored = await this.userAvatarService.uploadAvatar(createdUser.id, file);
      createdUser.avatarFilename = stored.key;
      await createdUser.save();
    }

    return {
      success: true,
      data: {
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          tenantId: createdUser.tenantId,
        },
      },
      message: "User created successfully",
    };
  }

  async createUser(data: CreateUserData, transaction?: Transaction): Promise<User> {
    if (!data.tenantId) {
      throw new BadRequestException("tenantId is required");
    }

    if (
      data.primaryPosition &&
      data.secondaryPosition &&
      data.primaryPosition === data.secondaryPosition
    ) {
      throw new BadRequestException("secondaryPosition must be different than primaryPosition");
    }

    const hashedPassword = await this.hashPassword(data.password);

    return this.userRepository.create(
      {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        tenantId: data.tenantId,
        isAdmin: data.isAdmin ?? false,
        isEmailVerified: data.isEmailVerified ?? false,
        avatarFilename: data.avatarFilename ?? null,
        primaryPosition: data.primaryPosition ?? null,
        secondaryPosition: data.secondaryPosition ?? null,
      },
      { transaction },
    );
  }

  async findAll(query: ListUsersQueryDto): Promise<Paginated<User>> {
    const tenantId = this.getCurrentTenantId();
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;

    const offset = (page - 1) * perPage;
    const limit = perPage;

    const where: any = {
      tenantId,
    };

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      where[Op.or] = [{ name: { [Op.like]: s } }, { email: { [Op.like]: s } }];
    }

    const order = [[query.sortBy ?? "createdAt", (query.sortDir ?? "desc").toUpperCase()]];

    const { rows, count } = await this.userRepository.findAndCountAll({
      where,
      order: order as any,
      offset,
      limit,
      attributes: { exclude: ["password"] },
    });

    const totalPages = Math.max(1, Math.ceil(count / perPage));

    return {
      data: rows,
      meta: {
        page,
        perPage,
        total: count,
        totalPages,
      },
    };
  }

  async findById(id: number, withPassword = false): Promise<User> {
    const tenantId = this.getCurrentTenantId();

    const attributes = withPassword
      ? [
          "id",
          "email",
          "name",
          "password",
          "tenantId",
          "isAdmin",
          "isEmailVerified",
          "avatarFilename",
          "primaryPosition",
          "secondaryPosition",
          "createdAt",
          "updatedAt",
        ]
      : [
          "id",
          "email",
          "name",
          "tenantId",
          "isAdmin",
          "isEmailVerified",
          "avatarFilename",
          "primaryPosition",
          "secondaryPosition",
          "createdAt",
          "updatedAt",
        ];

    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      attributes,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByIdInTenant(id: number, tenantId: number, withPassword = false): Promise<User> {
    const attributes = withPassword
      ? [
          "id",
          "email",
          "name",
          "password",
          "tenantId",
          "isAdmin",
          "isEmailVerified",
          "avatarFilename",
          "primaryPosition",
          "secondaryPosition",
          "createdAt",
          "updatedAt",
        ]
      : [
          "id",
          "email",
          "name",
          "tenantId",
          "isAdmin",
          "isEmailVerified",
          "avatarFilename",
          "primaryPosition",
          "secondaryPosition",
          "createdAt",
          "updatedAt",
        ];

    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      attributes,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found in tenant ${tenantId}`);
    }

    return user;
  }

  async findByEmail(email: string, withPassword = false): Promise<User | null> {
    const tenantId = this.getCurrentTenantId();

    return this.findByEmailInTenant(email, tenantId, withPassword);
  }

  async findByEmailInTenant(
    email: string,
    tenantId: number,
    withPassword = false,
    transaction?: Transaction,
  ): Promise<User | null> {
    const attributes = withPassword
      ? [
          "id",
          "email",
          "name",
          "password",
          "tenantId",
          "isAdmin",
          "isEmailVerified",
          "avatarFilename",
          "primaryPosition",
          "secondaryPosition",
          "createdAt",
          "updatedAt",
        ]
      : [
          "id",
          "email",
          "name",
          "tenantId",
          "isAdmin",
          "isEmailVerified",
          "avatarFilename",
          "primaryPosition",
          "secondaryPosition",
          "createdAt",
          "updatedAt",
        ];

    return this.userRepository.findOne({
      where: { email, tenantId },
      attributes,
      transaction,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
    const user = await this.findById(id, true);

    if (
      updateUserDto.primaryPosition &&
      updateUserDto.secondaryPosition &&
      updateUserDto.primaryPosition === updateUserDto.secondaryPosition
    ) {
      throw new BadRequestException("secondaryPosition must be different than primaryPosition");
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmailInTenant(updateUserDto.email, user.tenantId);

      if (existingUser) {
        throw new ConflictException("Email already exists in this tenant");
      }

      user.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      user.password = await this.hashPassword(updateUserDto.password);
    }

    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.isEmailVerified !== undefined) {
      user.isEmailVerified = updateUserDto.isEmailVerified;
    }

    if (updateUserDto.isAdmin !== undefined) {
      user.isAdmin = updateUserDto.isAdmin;
    }

    if (updateUserDto.removeAvatar === true) {
      await this.userAvatarService.deleteAvatarIfExists(user.avatarFilename);
      user.avatarFilename = null;
    }

    if (file) {
      await this.userAvatarService.deleteAvatarIfExists(user.avatarFilename);

      const stored = await this.userAvatarService.uploadAvatar(user.id, file);
      user.avatarFilename = stored.key;
    }

    if (updateUserDto.primaryPosition !== undefined) {
      user.primaryPosition = updateUserDto.primaryPosition;
    }

    if (updateUserDto.secondaryPosition !== undefined) {
      user.secondaryPosition = updateUserDto.secondaryPosition ?? null;
    }

    await user.save();

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    return bcrypt.hash(password, saltOrRounds);
  }

  private buildAvatarUrl(key?: string | null) {
    if (!key) return null;

    if (process.env.STORAGE_DRIVER !== "s3") {
      return `${process.env.APP_URL ?? ""}/uploads/${key}`;
    }

    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async markEmailVerified(userId: number): Promise<void> {
    const user = await this.findById(userId, true);
    user.isEmailVerified = true;
    await user.save();
  }
}
