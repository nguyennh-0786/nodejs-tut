import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LogInDto {
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
