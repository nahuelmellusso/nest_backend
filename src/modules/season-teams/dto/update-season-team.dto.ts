import { PartialType } from "@nestjs/mapped-types";
import { CreateSeasonTeamDto } from "./create-season-team.dto";

export class UpdateSeasonTeamDto extends PartialType(CreateSeasonTeamDto) {}
