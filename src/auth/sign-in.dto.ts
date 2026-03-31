import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    example: 'john_doe@example.com',
    description: 'The email of the user',
  })
  email: string;
  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  password: string;
}
