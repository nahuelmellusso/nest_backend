import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class CreatePlayerDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  fullName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: "nationality must be a valid ISO 3166-1 alpha-2 code" })
  @Transform(({ value }) => value?.trim().toUpperCase())
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  position?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: "photoUrl must be a valid URL with protocol" })
  @MaxLength(255)
  photoUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
