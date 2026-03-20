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
import { CreateTournamentRegistrationDto } from "./dto/create-tournament-registration.dto";
import { QueryTournamentRegistrationDto } from "./dto/query-tournament-registration.dto";
import { UpdateTournamentRegistrationDto } from "./dto/update-tournament-registration.dto";
import { TournamentRegistrationsService } from "./tournament-registrations.service";

@Controller("tournament-registrations")
export class TournamentRegistrationsController {
  constructor(private readonly registrationsService: TournamentRegistrationsService) {}

  @Post()
  create(@Body() createDto: CreateTournamentRegistrationDto) {
    return this.registrationsService.create(createDto);
  }

  @Get()
  findAll(@Query() query: QueryTournamentRegistrationDto) {
    return this.registrationsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.registrationsService.findById(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateTournamentRegistrationDto,
  ) {
    return this.registrationsService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.registrationsService.remove(id);
  }
}
