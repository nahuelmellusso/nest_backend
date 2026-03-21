import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { MatchEventPeriod } from "@/enums/match-event-period.enum";
import { MatchEventType } from "@/enums/match-event-type.enum";

export class CreateMatchEventDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  matchId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  playerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  relatedPlayerId?: number;

  @IsEnum(MatchEventType)
  type: MatchEventType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  minute: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  extraMinute?: number;

  @IsEnum(MatchEventPeriod)
  period: MatchEventPeriod;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  description?: string;
}
