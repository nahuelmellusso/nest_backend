import { Type } from "class-transformer";
import { IsOptional, Min } from "class-validator";

export class QueryStandingDto {
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
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
