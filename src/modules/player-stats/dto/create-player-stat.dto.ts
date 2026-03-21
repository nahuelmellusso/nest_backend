import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class CreatePlayerStatDto {
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
  @Min(1)
  playerId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  matchesPlayed: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  matchesStarted: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minutesPlayed: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  goals: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  assists: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  yellowCards: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  redCards: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  ownGoals: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cleanSheets?: number;
}
