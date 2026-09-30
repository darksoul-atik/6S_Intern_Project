import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { SearchPostsQueryDto } from './dto/search-posts-query.dto.js';

async function validateQuery(input: Record<string, unknown>) {
  const dto = plainToInstance(SearchPostsQueryDto, input);

  return validate(dto);
}

describe('SearchPostsQueryDto', () => {
  it('should accept a valid search query', async () => {
    const errors = await validateQuery({
      q: 'react',
      page: '1',
      limit: '10',
    });

    expect(errors).toHaveLength(0);
  });

  it('should trim surrounding whitespace from the search query', async () => {
    const dto = plainToInstance(SearchPostsQueryDto, {
      q: '   react authentication   ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.q).toBe('react authentication');
  });

  it('should reject a blank search query', async () => {
    const errors = await validateQuery({
      q: '',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject a whitespace-only search query', async () => {
    const errors = await validateQuery({
      q: '     ',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject a one-character search query', async () => {
    const errors = await validateQuery({
      q: 'a',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject a search query longer than 200 characters', async () => {
    const errors = await validateQuery({
      q: 'a'.repeat(201),
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject a limit greater than 50', async () => {
    const errors = await validateQuery({
      q: 'react',
      limit: '51',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject page values below 1', async () => {
    const errors = await validateQuery({
      q: 'react',
      page: '0',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should use the default page and limit values', async () => {
    const dto = plainToInstance(SearchPostsQueryDto, {
      q: 'react',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });
});
