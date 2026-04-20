import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateArticleDto {
  @ApiProperty({
    example: 'title',
    description: 'The title of the article',
  })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'description',
    description: 'The description of the article',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'body',
    description: 'The content of the article',
  })
  @IsOptional()
  @IsString()
  body: string;
}
