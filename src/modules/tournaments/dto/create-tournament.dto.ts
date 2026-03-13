import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { TournamentType } from "@/enums/tournament-type.enum";

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must contain only lowercase letters, numbers and hyphens",
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  slug: string;

  @IsEnum(TournamentType)
  type: TournamentType;

  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: "country must be a valid ISO 3166-1 alpha-2 code",
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  country: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
