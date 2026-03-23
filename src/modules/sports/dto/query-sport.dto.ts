import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString, Max, Min } from "class-validator";
import { SportStatus } from "@/enums/sport-status.enum";
import { SportType } from "@/enums/sport-type.enum";

export class QuerySportDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SportType)
  type?: SportType;

  @IsOptional()
  @IsEnum(SportStatus)
  status?: SportStatus;

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
