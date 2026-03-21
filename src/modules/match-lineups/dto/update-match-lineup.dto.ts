import { PartialType } from "@nestjs/mapped-types";
import { CreateMatchLineupDto } from "./create-match-lineup.dto";

export class UpdateMatchLineupDto extends PartialType(CreateMatchLineupDto) {}
