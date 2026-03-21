import { Type } from "class-transformer";
import { IsEnum, IsOptional, Max, Min } from "class-validator";
import { MatchEventPeriod } from "@/enums/match-event-period.enum";
import { MatchEventType } from "@/enums/match-event-type.enum";

export class QueryMatchEventDto {
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
  @IsEnum(MatchEventType)
  type?: MatchEventType;

  @IsOptional()
  @IsEnum(MatchEventPeriod)
  period?: MatchEventPeriod;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(130)
  minuteFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(130)
  minuteTo?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
