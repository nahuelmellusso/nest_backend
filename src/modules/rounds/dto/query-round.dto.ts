import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString, Max, Min } from "class-validator";
import { RoundStatus } from "@/enums/round-status.enum";

export class QueryRoundDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  stageId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RoundStatus)
  status?: RoundStatus;

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
