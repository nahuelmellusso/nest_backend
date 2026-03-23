import { PartialType } from "@nestjs/mapped-types";
import { CreateSeasonTeamPlayerDto } from "./create-season-team-player.dto";

export class UpdateSeasonTeamPlayerDto extends PartialType(CreateSeasonTeamPlayerDto) {}
