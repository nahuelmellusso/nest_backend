import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { Match } from "@/decorators/match.decorator";
import { FOOTBALL_POSITIONS, FootballPosition } from "@/constants/constants";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  readonly password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @Match("password", { message: "Passwords do not match" })
  readonly passwordConfirm: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatarFilename?: string | null;

  @IsOptional()
  @IsIn(FOOTBALL_POSITIONS)
  primaryPosition?: FootballPosition;

  @IsOptional()
  @IsIn(FOOTBALL_POSITIONS)
  secondaryPosition?: FootballPosition | null;
}
