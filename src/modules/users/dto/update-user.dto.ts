import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { FOOTBALL_POSITIONS, FootballPosition } from "../../../constants/constants";

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  removeAvatar?: boolean;

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
