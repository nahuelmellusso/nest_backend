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
import { CreateSeasonTeamDto } from "./dto/create-season-team.dto";
import { QuerySeasonTeamDto } from "./dto/query-season-team.dto";
import { UpdateSeasonTeamDto } from "./dto/update-season-team.dto";
import { SeasonTeamsService } from "./season-teams.service";

@Controller("season-teams")
export class SeasonTeamsController {
  constructor(private readonly seasonTeamsService: SeasonTeamsService) {}

  @Post()
  create(@Body() createDto: CreateSeasonTeamDto) {
    return this.seasonTeamsService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QuerySeasonTeamDto) {
    return this.seasonTeamsService.findAll(query);
  }

  @Get("season/:seasonId")
  findBySeason(
    @Param("seasonId", ParseIntPipe) seasonId: number,
    @Query() query: QuerySeasonTeamDto,
  ) {
    return this.seasonTeamsService.findBySeason(seasonId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.seasonTeamsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateSeasonTeamDto) {
    return this.seasonTeamsService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.seasonTeamsService.remove(id);
  }
}
