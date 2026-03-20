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
import { RoundsService } from "./rounds.service";
import { CreateRoundDto } from "./dto/create-round.dto";
import { UpdateRoundDto } from "./dto/update-round.dto";
import { QueryRoundDto } from "./dto/query-round.dto";

@Controller("rounds")
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Post()
  create(@Body() createRoundDto: CreateRoundDto) {
    return this.roundsService.create(createRoundDto);
  }

  @Get()
  findAll(@Query() query: QueryRoundDto) {
    return this.roundsService.findAll(query);
  }

  @Get("stage/:stageId")
  findByStage(@Param("stageId", ParseIntPipe) stageId: number, @Query() query: QueryRoundDto) {
    return this.roundsService.findByStage(stageId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.roundsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateRoundDto: UpdateRoundDto) {
    return this.roundsService.update(id, updateRoundDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.roundsService.remove(id);
  }
}
