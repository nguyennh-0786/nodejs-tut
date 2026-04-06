import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'The username of the user' })
  username: string = '';
  @ApiProperty({
    example: 'This is my bio',
    description: 'The bio of the user',
  })
  bio: string = '';
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'The image of the user',
  })
  image: string = '';
}
