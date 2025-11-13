import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateAuthorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  bio?: string;
}
