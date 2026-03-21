import { Type } from "class-transformer";
import { IsOptional, Min } from "class-validator";

export class QueryPlayerStatDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  seasonId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  stageId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  teamId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  playerId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
