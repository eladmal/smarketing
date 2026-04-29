import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'אימייל לא תקין' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'סיסמה חייבת להכיל לפחות 8 תווים' })
  @MaxLength(72)
  password: string;

  @IsString()
  @MinLength(2, { message: 'שם חייב להכיל לפחות 2 תווים' })
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  businessType?: string;
}
