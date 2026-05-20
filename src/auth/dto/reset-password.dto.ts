import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  token: string;

  @IsString()
  @MinLength(6, { message: 'Salasanan on oltava vähintään 6 merkkiä' })
  @MaxLength(50, { message: 'Salasana saa olla korkeintaan 50 merkkiä' })
  password: string;
}
