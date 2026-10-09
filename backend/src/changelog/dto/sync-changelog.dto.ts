import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SyncChangelogDto {
  @ApiPropertyOptional({
    description: 'GitHub repository owner / organization (e.g. darksoul-atik)',
    example: 'darksoul-atik',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/, {
    message: 'owner must be a valid GitHub username or organization name',
  })
  owner?: string;

  @ApiPropertyOptional({
    description: 'GitHub repository name (e.g. 6S_Intern_Project)',
    example: '6S_Intern_Project',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'repo must be a valid GitHub repository name',
  })
  repo?: string;
}
