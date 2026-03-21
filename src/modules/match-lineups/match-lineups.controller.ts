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
import { CreateMatchLineupDto } from "./dto/create-match-lineup.dto";
import { QueryMatchLineupDto } from "./dto/query-match-lineup.dto";
import { UpdateMatchLineupDto } from "./dto/update-match-lineup.dto";
import { MatchLineupsService } from "./match-lineups.service";

@Controller("match-lineups")
export class MatchLineupsController {
  constructor(private readonly matchLineupsService: MatchLineupsService) {}

  @Post()
  create(@Body() createDto: CreateMatchLineupDto) {
    return this.matchLineupsService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QueryMatchLineupDto) {
    return this.matchLineupsService.findAll(query);
  }

  @Get("match/:matchId")
  findByMatch(
    @Param("matchId", ParseIntPipe) matchId: number,
    @Query() query: QueryMatchLineupDto,
  ) {
    return this.matchLineupsService.findByMatch(matchId, query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.matchLineupsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateMatchLineupDto) {
    return this.matchLineupsService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.matchLineupsService.remove(id);
  }
}
