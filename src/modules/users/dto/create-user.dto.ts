import { IsBoolean, IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../decorators/match.decorator'

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
  @Match('password', { message: 'Passwords do not match' })
  readonly passwordConfirm: string;
}
