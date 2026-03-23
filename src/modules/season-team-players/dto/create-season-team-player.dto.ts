import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { SeasonTeamPlayerStatus } from "@/enums/season-team-player-status.enum";

export class CreateSeasonTeamPlayerDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seasonTeamId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  playerId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  jerseyNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  position?: string;

  @IsOptional()
  @IsEnum(SeasonTeamPlayerStatus)
  status?: SeasonTeamPlayerStatus;

  @IsOptional()
  joinedAt?: string | Date;

  @IsOptional()
  leftAt?: string | Date;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCaptain?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  isActive?: boolean | string;
}
