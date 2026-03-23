import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CreateSportDto } from "./dto/create-sport.dto";
import { QuerySportDto } from "./dto/query-sport.dto";
import { UpdateSportDto } from "./dto/update-sport.dto";
import { SportsService } from "./sports.service";

@Controller("sports")
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Post()
  create(@Body() createSportDto: CreateSportDto) {
    return this.sportsService.create(createSportDto);
  }

  @Get()
  findAll(@Query() query: QuerySportDto) {
    return this.sportsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.sportsService.findById(id);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.sportsService.findBySlug(slug);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateSportDto: UpdateSportDto) {
    return this.sportsService.update(id, updateSportDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.sportsService.remove(id);
  }
}
