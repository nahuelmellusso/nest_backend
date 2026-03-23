import { Type } from "class-transformer";
import { IsEnum, IsOptional, Min } from "class-validator";
import { SeasonTeamPlayerStatus } from "@/enums/season-team-player-status.enum";

export class QuerySeasonTeamPlayerDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  seasonTeamId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  playerId?: number;

  @IsOptional()
  @IsEnum(SeasonTeamPlayerStatus)
  status?: SeasonTeamPlayerStatus;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
