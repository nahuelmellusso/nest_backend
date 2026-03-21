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
import { CreateMatchEventDto } from "./dto/create-match-event.dto";
import { QueryMatchEventDto } from "./dto/query-match-event.dto";
import { UpdateMatchEventDto } from "./dto/update-match-event.dto";
import { MatchEventsService } from "./match-events.service";

@Controller("match-events")
export class MatchEventsController {
  constructor(private readonly matchEventsService: MatchEventsService) {}

  @Post()
  create(@Body() createDto: CreateMatchEventDto) {
    return this.matchEventsService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QueryMatchEventDto) {
    return this.matchEventsService.findAll(query);
  }

  @Get("match/:matchId")
  findByMatch(@Param("matchId", ParseIntPipe) matchId: number, @Query() query: QueryMatchEventDto) {
    return this.matchEventsService.findByMatch(matchId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.matchEventsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateMatchEventDto) {
    return this.matchEventsService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.matchEventsService.remove(id);
  }
}
