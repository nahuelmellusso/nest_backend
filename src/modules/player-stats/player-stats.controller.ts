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
import { CreatePlayerStatDto } from "./dto/create-player-stat.dto";
import { QueryPlayerStatDto } from "./dto/query-player-stat.dto";
import { UpdatePlayerStatDto } from "./dto/update-player-stat.dto";
import { PlayerStatsService } from "./player-stats.service";

@Controller("player-stats")
export class PlayerStatsController {
  constructor(private readonly playerStatsService: PlayerStatsService) {}

  @Post()
  create(@Body() createDto: CreatePlayerStatDto) {
    return this.playerStatsService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QueryPlayerStatDto) {
    return this.playerStatsService.findAll(query);
  }

  @Get("stage/:stageId")
  findByStage(@Param("stageId", ParseIntPipe) stageId: number, @Query() query: QueryPlayerStatDto) {
    return this.playerStatsService.findByStage(stageId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.playerStatsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdatePlayerStatDto) {
    return this.playerStatsService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.playerStatsService.remove(id);
  }
}
