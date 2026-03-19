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
import { TeamsService } from "./teams.service";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";
import { QueryTeamDto } from "./dto/query-team.dto";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("logo", {
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
  create(@Body() createTeamDto: CreateTeamDto, @UploadedFile() file?: Express.Multer.File) {
    return this.teamsService.create(createTeamDto, file);
  }

  @Get()
  findAll(@Query() query: QueryTeamDto) {
    return this.teamsService.findAll(query);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.teamsService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.teamsService.findById(id);
  }

  @Patch(":id")
  @UseInterceptors(
    FileInterceptor("logo", {
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
    @Body() updateTeamDto: UpdateTeamDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.teamsService.update(id, updateTeamDto, file);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.teamsService.remove(id);
  }
}
