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
import { TournamentRegistrationStatus } from "@/enums/tournament-registration-status.enum";

export class CreateTournamentRegistrationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  playerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tournamentId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  seasonId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId?: number;

  @IsOptional()
  @IsEnum(TournamentRegistrationStatus)
  status?: TournamentRegistrationStatus;

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
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
