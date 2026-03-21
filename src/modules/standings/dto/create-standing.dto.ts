import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Length, Matches, MaxLength, Min } from "class-validator";

export class CreateStandingDto {
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
  teamId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  played: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  wins: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  draws: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  losses: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  goalsFor: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  goalsAgainst: number;

  @Type(() => Number)
  @IsInt()
  goalDifference: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  points: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  position: number;

  @IsOptional()
  @IsString()
  @Length(0, 5)
  @Matches(/^[WDL]{0,5}$/)
  @Transform(({ value }) => value?.trim().toUpperCase())
  lastFiveForm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
