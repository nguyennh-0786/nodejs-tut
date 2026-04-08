import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'The username of the user' })
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({
    example: 'This is my bio',
    description: 'The bio of the user',
  })
  @IsOptional()
  @IsString()
  bio: string;
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'The image of the user',
  })
  @IsOptional()
  @IsUrl()
  image: string;
}
