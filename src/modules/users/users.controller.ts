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
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./user.entity";
import { TypedEventEmitter } from "@/event-emitter/typed-event-emitter.class";
import { ListUsersQueryDto } from "./dto/list-users.query";
import { FileInterceptor } from "@nestjs/platform-express";
import { MAX_AVATAR_BYTES, ALLOWED_MIME } from "@/constants/constants";
/* typed-event-emitter.class'; */

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: TypedEventEmitter,
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
    this.eventEmitter.emit("user.welcome", {
      name: createUserDto.name,
      email: createUserDto.email,
    });

    this.eventEmitter.emit("user.verify-email", {
      name: createUserDto.name,
      email: createUserDto.email,
    });
    return await this.usersService.create(createUserDto, file);
  }

  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get("/:id")
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
