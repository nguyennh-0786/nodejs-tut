import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'john_doe', description: 'The username of the user' })
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({
    example: 'john_doe@example.com',
    description: 'The email of the user',
  })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @IsOptional()
  @IsString()
  password: string;
}
