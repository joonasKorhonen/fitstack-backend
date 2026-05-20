import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Käyttäjänimen on oltava vähintään 3 merkkiä' })
  @MaxLength(20, { message: 'Käyttäjänimi saa olla korkeintaan 20 merkkiä' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Sähköpostiosoite ei ole kelvollinen' })
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Salasanan on oltava vähintään 6 merkkiä' })
  @MaxLength(50, { message: 'Salasana saa olla korkeintaan 50 merkkiä' })
  password?: string;
}
