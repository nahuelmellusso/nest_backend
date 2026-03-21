import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { MatchLineupRole } from "@/enums/match-lineup-role.enum";

export class CreateMatchLineupDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  matchId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  playerId: number;

  @IsEnum(MatchLineupRole)
  role: MatchLineupRole;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shirtNumber?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCaptain?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minuteIn?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minuteOut?: number;
}
