import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ALLOWED_MIME, MAX_AVATAR_BYTES } from "@/constants/constants";
import { PlayersService } from "./players.service";
import { CreatePlayerDto } from "./dto/create-player.dto";
import { UpdatePlayerDto } from "./dto/update-player.dto";
import { QueryPlayerDto } from "./dto/query-player.dto";

@Controller("players")
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("photo", {
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
  create(@Body() createPlayerDto: CreatePlayerDto, @UploadedFile() file?: Express.Multer.File) {
    return this.playersService.create(createPlayerDto, file);
  }

  @Get()
  findAll(@Query() query: QueryPlayerDto) {
    return this.playersService.findAll(query);
  }

  @Get("user/:userId")
  findByUser(@Param("userId", ParseIntPipe) userId: number) {
    return this.playersService.findByUserId(userId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.playersService.findById(id);
  }

  @Patch(":id")
  @UseInterceptors(
    FileInterceptor("photo", {
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
    @Body() updatePlayerDto: UpdatePlayerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.playersService.update(id, updatePlayerDto, file);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.playersService.remove(id);
  }
}
