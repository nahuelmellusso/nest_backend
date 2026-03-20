import { PartialType } from "@nestjs/mapped-types";
import { CreateTournamentRegistrationDto } from "./create-tournament-registration.dto";

export class UpdateTournamentRegistrationDto extends PartialType(CreateTournamentRegistrationDto) {}
