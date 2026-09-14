import { IsNotEmpty, IsString, Length, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSkillDto {
  @ApiProperty({
    description: 'Skill name to add to the developer profile',
    example: 'TypeScript',
    minLength: 1,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 50, { message: 'Skill must be between 1 and 50 characters' })
  skill!: string;
}

export class UpdateSkillsDto {
  @ApiProperty({
    description: 'Complete replacement array of developer skills',
    example: ['TypeScript', 'NestJS', 'React', 'MongoDB'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  skills!: string[];
}
