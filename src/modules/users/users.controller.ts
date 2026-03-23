import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TypedEventEmitter } from "@/event-emitter/typed-event-emitter.class";
import { MAX_AVATAR_BYTES, ALLOWED_MIME } from "@/constants/constants";
import { TenantsService } from "@/modules/tenants/tenants.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users.query";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./user.entity";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: TypedEventEmitter,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post("/")
  @UseInterceptors(
    FileInterceptor("avatar", {
      limits: { fileSize: MAX_AVATAR_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException("Invalid file type. Only jpg, png, webp are allowed"),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async create(@Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    const result = await this.usersService.create(createUserDto, file);
    const tenant = await this.tenantsService.findById(result.data.user.tenantId);

    this.eventEmitter.emit("user.registered", {
      userId: result.data.user.id,
      tenantId: result.data.user.tenantId,
      tenantName: tenant.name,
      name: result.data.user.name,
      email: result.data.user.email,
    });

    return result;
  }

  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  async findById(@Param("id") id: string): Promise<User> {
    return await this.usersService.findById(Number(id));
  }

  @Put(":id")
  async updateUser(@Param("id") id: number, @Body() userData: UpdateUserDto) {
    return this.usersService.update(id, userData);
  }

  @Patch(":id")
  @UseInterceptors(
    FileInterceptor("avatar", {
      limits: { fileSize: MAX_AVATAR_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException("Invalid file type. Only jpg, png, webp are allowed"),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.update(id, dto, file);
  }
}
