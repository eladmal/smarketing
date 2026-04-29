import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'אימייל לא תקין' })
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
