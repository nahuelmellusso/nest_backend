import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, Max, Min } from "class-validator";

export class QueryPlayerDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  position?: string;

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
