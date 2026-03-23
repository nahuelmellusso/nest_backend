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
import { CreateSeasonTeamPlayerDto } from "./dto/create-season-team-player.dto";
import { QuerySeasonTeamPlayerDto } from "./dto/query-season-team-player.dto";
import { UpdateSeasonTeamPlayerDto } from "./dto/update-season-team-player.dto";
import { SeasonTeamPlayersService } from "./season-team-players.service";

@Controller("season-team-players")
export class SeasonTeamPlayersController {
  constructor(private readonly seasonTeamPlayersService: SeasonTeamPlayersService) {}

  @Post()
  create(@Body() createDto: CreateSeasonTeamPlayerDto) {
    return this.seasonTeamPlayersService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QuerySeasonTeamPlayerDto) {
    return this.seasonTeamPlayersService.findAll(query);
  }

  @Get("season-team/:seasonTeamId")
  findBySeasonTeam(
    @Param("seasonTeamId", ParseIntPipe) seasonTeamId: number,
    @Query() query: QuerySeasonTeamPlayerDto,
  ) {
    return this.seasonTeamPlayersService.findBySeasonTeam(seasonTeamId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.seasonTeamPlayersService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateSeasonTeamPlayerDto) {
    return this.seasonTeamPlayersService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.seasonTeamPlayersService.remove(id);
  }
}
