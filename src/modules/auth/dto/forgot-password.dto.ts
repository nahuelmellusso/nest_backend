import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsString()
  readonly lang: string;
}
