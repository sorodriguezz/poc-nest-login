import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  isbn: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  year?: number;

  @IsString()
  authorId: string;

  @IsString()
  categoryId: string;
}
