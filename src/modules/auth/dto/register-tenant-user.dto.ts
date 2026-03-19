import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterTenantUserDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  primaryPosition?: string;

  @IsOptional()
  @IsString()
  secondaryPosition?: string;
}
