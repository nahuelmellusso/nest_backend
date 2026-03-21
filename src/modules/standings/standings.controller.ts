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
import { CreateStandingDto } from "./dto/create-standing.dto";
import { QueryStandingDto } from "./dto/query-standing.dto";
import { UpdateStandingDto } from "./dto/update-standing.dto";
import { StandingsService } from "./standings.service";

@Controller("standings")
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Post()
  create(@Body() createDto: CreateStandingDto) {
    return this.standingsService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QueryStandingDto) {
    return this.standingsService.findAll(query);
  }

  @Get("stage/:stageId")
  findByStage(@Param("stageId", ParseIntPipe) stageId: number, @Query() query: QueryStandingDto) {
    return this.standingsService.findByStage(stageId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.standingsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateStandingDto) {
    return this.standingsService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.standingsService.remove(id);
  }
}
