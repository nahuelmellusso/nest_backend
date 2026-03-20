import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, Max, Min } from "class-validator";
import { MatchStatus } from "@/enums/match-status.enum";

export class QueryMatchDto {
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
  roundId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  teamId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
