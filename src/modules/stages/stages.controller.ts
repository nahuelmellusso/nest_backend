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
import { StagesService } from "./stages.service";
import { CreateStageDto } from "./dto/create-stage.dto";
import { UpdateStageDto } from "./dto/update-stage.dto";
import { QueryStageDto } from "./dto/query-stage.dto";

@Controller("stages")
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  create(@Body() createStageDto: CreateStageDto) {
    return this.stagesService.create(createStageDto);
  }

  @Get()
  findAll(@Query() query: QueryStageDto) {
    return this.stagesService.findAll(query);
  }

  @Get("season/:seasonId")
  findBySeason(@Param("seasonId", ParseIntPipe) seasonId: number, @Query() query: QueryStageDto) {
    return this.stagesService.findBySeason(seasonId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.stagesService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateStageDto: UpdateStageDto) {
    return this.stagesService.update(id, updateStageDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.stagesService.remove(id);
  }
}
