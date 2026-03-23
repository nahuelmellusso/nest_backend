import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from "class-validator";
import { SportStatus } from "@/enums/sport-status.enum";
import { SportType } from "@/enums/sport-type.enum";

export class CreateSportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must contain only lowercase letters, numbers and hyphens",
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  slug: string;

  @IsEnum(SportType)
  type: SportType;

  @IsOptional()
  @IsEnum(SportStatus)
  status?: SportStatus;
}
