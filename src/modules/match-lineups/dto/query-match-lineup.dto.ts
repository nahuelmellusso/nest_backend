import { Type } from "class-transformer";
import { IsEnum, IsOptional, Min } from "class-validator";
import { MatchLineupRole } from "@/enums/match-lineup-role.enum";

export class QueryMatchLineupDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  matchId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  teamId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  playerId?: number;

  @IsOptional()
  @IsEnum(MatchLineupRole)
  role?: MatchLineupRole;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 30;
}
