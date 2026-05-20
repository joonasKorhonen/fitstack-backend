import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Sähköpostiosoite ei ole kelvollinen' })
  @MaxLength(254)
  email: string;
}
