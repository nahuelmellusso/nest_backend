import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SignInDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.REQUIRED', { message: 'COOL' }),
  })
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
    readonly password: string;
}
