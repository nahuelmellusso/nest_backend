import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { SeasonTeamStatus } from "@/enums/season-team-status.enum";

export class CreateSeasonTeamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seasonId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId: number;

  @IsOptional()
  @IsEnum(SeasonTeamStatus)
  status?: SeasonTeamStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seed?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  groupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  registeredAt?: string | Date;

  @IsOptional()
  isActive?: boolean | string;
}
