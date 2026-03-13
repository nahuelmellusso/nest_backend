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
import { TournamentsService } from "./tournaments.service";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { QueryTournamentDto } from "./dto/query-tournament.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { ALLOWED_MIME, MAX_AVATAR_BYTES } from "@/constants/constants";

@Controller("tournaments")
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
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
  create(
    @Body() createTournamentDto: CreateTournamentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tournamentsService.create(createTournamentDto, file);
  }

  @Get()
  findAll(@Query() query: QueryTournamentDto) {
    return this.tournamentsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.tournamentsService.findById(id);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.tournamentsService.findBySlug(slug);
  }

  @Patch(":id")
  @UseInterceptors(
    FileInterceptor("image", {
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
    @Body() updateTournamentDto: UpdateTournamentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tournamentsService.update(id, updateTournamentDto, file);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.tournamentsService.remove(id);
  }
}
