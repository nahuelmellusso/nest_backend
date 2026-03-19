import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  shortName: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must contain only lowercase letters, numbers and hyphens",
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  city?: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/, {
    message: "country must be a valid ISO 3166-1 alpha-2 code",
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  country: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: "logoUrl must be a valid URL with protocol" })
  @MaxLength(255)
  logoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1800)
  @Max(2100)
  foundedYear?: number;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: "websiteUrl must be a valid URL with protocol" })
  @MaxLength(255)
  websiteUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
