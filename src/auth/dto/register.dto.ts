import { IsString, MinLength, MaxLength, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail({}, { message: 'Sähköpostiosoite ei ole kelvollinen' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
