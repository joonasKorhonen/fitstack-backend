import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMealDto {
  @IsString()
  title: string;

  @IsInt()
  @Min(0)
  calories: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fat?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMealDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fat?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}