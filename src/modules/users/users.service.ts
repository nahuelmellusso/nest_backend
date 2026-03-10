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
import { Op } from "sequelize";
import { UserAvatarService } from "./avatar.service";

@Injectable()
export class UsersService {
  constructor(
    @Inject("USER_REPOSITORY")
    private userRepository: typeof User,
    private readonly userAvatarService: UserAvatarService,
  ) {}

  async create(createUserDto: CreateUserDto, file?: Express.Multer.File): Promise<ApiResponse> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    if (
      createUserDto.primaryPosition &&
      createUserDto.secondaryPosition &&
      createUserDto.primaryPosition === createUserDto.secondaryPosition
    ) {
      throw new BadRequestException("secondaryPosition must be different than primaryPosition");
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);

    const { primaryPosition, secondaryPosition, ...rest } = createUserDto;

    let avatarFilename: string | null = createUserDto.avatarFilename ?? null;

    if (file) {
      const stored = await this.userAvatarService.uploadAvatar(file);
      avatarFilename = stored.key;
    }

    const createdUser = await this.userRepository.create({
      ...rest,
      password: hashedPassword,
      avatarFilename,
      primaryPosition: primaryPosition ?? null,
      secondaryPosition: secondaryPosition ?? null,
    });

    return {
      success: true,
      data: {},
      message: "",
    };
  }

  async findAll(query: ListUsersQueryDto): Promise<Paginated<User>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;

    const offset = (page - 1) * perPage;
    const limit = perPage;

    const where: any = {};

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

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findByPk(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string, withPassword = false): Promise<User | null> {
    const attributes = withPassword ? ["id", "email", "name", "password"] : ["id", "email", "name"];

    return this.userRepository.findOne({
      where: { email },
      attributes,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (
      updateUserDto.primaryPosition &&
      updateUserDto.secondaryPosition &&
      updateUserDto.primaryPosition === updateUserDto.secondaryPosition
    ) {
      throw new BadRequestException("secondaryPosition must be different than primaryPosition");
    }

    // Email unique check
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException("Email already exists");
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      const saltOrRounds = 10;
      user.password = await bcrypt.hash(updateUserDto.password, saltOrRounds);
    }

    if (updateUserDto.name) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.isEmailVerified !== undefined) {
      user.isEmailVerified = updateUserDto.isEmailVerified;
    }
    if (updateUserDto.removeAvatar === true) {
      await this.userAvatarService.deleteAvatarIfExists(user.avatarFilename);
      user.avatarFilename = null;
    }

    if (file) {
      await this.userAvatarService.deleteAvatarIfExists(user.avatarFilename);

      const stored = await this.userAvatarService.uploadAvatar(file);
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
    return await bcrypt.hash(password, saltOrRounds);
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
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    user.isEmailVerified = true;
    await user.save();
  }
}
