import { IsDateString, IsInt, IsOptional, IsString, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSetDto {
  @IsOptional()
  @IsString()
  exercise?: string;

  @IsOptional()
  @IsInt()
  movementId?: number;

  @IsInt()
  @Min(1)
  reps: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  intensity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWorkoutDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSetDto)
  sets: CreateSetDto[];
}

export class UpdateWorkoutDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  intensity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddSetsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSetDto)
  sets: CreateSetDto[];
}
