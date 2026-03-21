import { Type } from "class-transformer";
import { IsEnum, IsOptional, Min } from "class-validator";
import { SeasonTeamStatus } from "@/enums/season-team-status.enum";

export class QuerySeasonTeamDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  seasonId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  teamId?: number;

  @IsOptional()
  @IsEnum(SeasonTeamStatus)
  status?: SeasonTeamStatus;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
