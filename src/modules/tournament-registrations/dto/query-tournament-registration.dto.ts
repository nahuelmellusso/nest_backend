import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, Max, Min } from "class-validator";
import { TournamentRegistrationStatus } from "@/enums/tournament-registration-status.enum";

export class QueryTournamentRegistrationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  tournamentId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  seasonId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  playerId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  teamId?: number;

  @IsOptional()
  @IsEnum(TournamentRegistrationStatus)
  status?: TournamentRegistrationStatus;

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
