import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { MatchStatus } from "@/enums/match-status.enum";

export class CreateMatchDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seasonId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  stageId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roundId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  homeTeamId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  awayTeamId: number;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Transform(({ value }) => value?.trim())
  stadium?: string;

  @IsDateString()
  matchDate: string;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homePenaltyScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayPenaltyScore?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  extraTimePlayed?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
