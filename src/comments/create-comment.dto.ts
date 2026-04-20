import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'body',
    description: 'The body of the comment',
  })
  @IsString()
  body!: string;
}
