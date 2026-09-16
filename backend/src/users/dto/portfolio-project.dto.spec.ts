import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PortfolioProjectDto } from './portfolio-project.dto.js';
import { UpdatePortfolioProjectDto } from './update-portfolio-project.dto.js';

describe('PortfolioProjectDto Validation Edge Cases', () => {
  const createDto = (data: Record<string, unknown>): PortfolioProjectDto => {
    return plainToInstance(PortfolioProjectDto, data);
  };

  const validProjectData = {
    title: 'DevPulse Platform',
    description: 'A social developer portfolio and discussion system.',
    urls: ['https://github.com/example/repo', 'https://devpulse.io'],
    technologies: ['TypeScript', 'NestJS', 'React'],
    startDate: '2026-01',
    isCurrent: true,
  };

  it('should validate successfully with valid current project payload', async () => {
    const dto = createDto(validProjectData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate successfully with valid finished project payload', async () => {
    const dto = createDto({
      ...validProjectData,
      isCurrent: false,
      endDate: '2026-06',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when URL is not a valid HTTP/HTTPS URL', async () => {
    const dto = createDto({
      ...validProjectData,
      urls: ['ftp://invalid.com/file', 'not-a-url'],
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'urls')).toBe(true);
  });

  it('should fail validation when technologies array is empty', async () => {
    const dto = createDto({
      ...validProjectData,
      technologies: [],
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'technologies')).toBe(true);
  });

  it('should fail validation when technologies contain duplicates', async () => {
    const dto = createDto({
      ...validProjectData,
      technologies: ['TypeScript', 'typescript'],
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'technologies')).toBe(true);
  });

  it('should fail validation when startDate is not in YYYY-MM format', async () => {
    const dto = createDto({
      ...validProjectData,
      startDate: '2026/01/15',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'startDate')).toBe(true);
  });

  it('should fail validation when isCurrent is true and endDate is provided', async () => {
    const dto = createDto({
      ...validProjectData,
      isCurrent: true,
      endDate: '2026-05',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'endDate')).toBe(true);
  });

  it('should fail validation when isCurrent is false and endDate is missing', async () => {
    const dto = createDto({
      ...validProjectData,
      isCurrent: false,
      endDate: undefined,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'endDate')).toBe(true);
  });

  it('should fail validation when endDate is earlier than startDate', async () => {
    const dto = createDto({
      ...validProjectData,
      startDate: '2026-06',
      isCurrent: false,
      endDate: '2026-02',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'endDate')).toBe(true);
  });
});
