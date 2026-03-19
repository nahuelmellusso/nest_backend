import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { SeasonsService } from "./seasons.service";
import { CreateSeasonDto } from "./dto/create-season.dto";
import { UpdateSeasonDto } from "./dto/update-season.dto";

@Controller("seasons")
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Post()
  create(@Body() createSeasonDto: CreateSeasonDto) {
    return this.seasonsService.create(createSeasonDto);
  }

  @Get()
  findAll() {
    return this.seasonsService.findAll();
  }

  /*@Get("tournament/:tournamentId")
  findByTournament(@Param("tournamentId", ParseIntPipe) tournamentId: number) {
    return this.seasonsService.findByTournament(tournamentId);
  }*/

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.seasonsService.findById(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateSeasonDto: UpdateSeasonDto) {
    return this.seasonsService.update(id, updateSeasonDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.seasonsService.remove(id);
  }
}
