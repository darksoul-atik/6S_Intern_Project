import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { PortfolioProjectDto } from './dto/portfolio-project.dto.js';
import { UpdatePortfolioProjectDto } from './dto/update-portfolio-project.dto.js';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: "Get authenticated user's developer profile",
  })
  @ApiResponse({
    status: 200,
    description: 'Developer profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMyProfile(user.userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: "Update authenticated user's developer profile",
  })
  @ApiResponse({
    status: 200,
    description: 'Developer profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid profile data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateBasicProfile(user.userId, dto);
  }

  @Post('me/projects')
  @ApiOperation({
    summary: 'Add a portfolio project to authenticated user profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Portfolio project added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid portfolio project data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  async addPortfolioProject(
    @CurrentUser() user: AuthenticatedUser,
    @Body() projectDto: PortfolioProjectDto,
  ) {
    return this.usersService.addPortfolioProject(user.userId, projectDto);
  }

  @Patch('me/projects/:projectId')
  @ApiOperation({
    summary: 'Update a portfolio project',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio project updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid portfolio project data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio project not found',
  })
  async updatePortfolioProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdatePortfolioProjectDto,
  ) {
    return this.usersService.updatePortfolioProject(
      user.userId,
      projectId,
      dto,
    );
  }

  @Delete('me/projects/:projectId')
  @ApiOperation({
    summary: 'Delete a portfolio project',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio project deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio project not found',
  })
  async removePortfolioProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.usersService.removePortfolioProject(user.userId, projectId);
  }
}
