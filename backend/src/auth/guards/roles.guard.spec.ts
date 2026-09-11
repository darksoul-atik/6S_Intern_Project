import { describe, it, expect, vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: Partial<Reflector>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new RolesGuard(mockReflector as Reflector);
  });

  const createMockContext = (user?: { role?: string }) =>
    ({
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access if no roles are required on route', () => {
    vi.mocked(mockReflector.getAllAndOverride!).mockReturnValue(undefined);
    const context = createMockContext({ role: 'user' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required admin role', () => {
    vi.mocked(mockReflector.getAllAndOverride!).mockReturnValue(['admin']);
    const context = createMockContext({ role: 'admin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has normal role but admin is required', () => {
    vi.mocked(mockReflector.getAllAndOverride!).mockReturnValue(['admin']);
    const context = createMockContext({ role: 'user' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user object is not present in request', () => {
    vi.mocked(mockReflector.getAllAndOverride!).mockReturnValue(['admin']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
