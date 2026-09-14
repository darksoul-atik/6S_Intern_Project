import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AddSkillDto, UpdateSkillsDto } from './dto/skills.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get authenticated user's own profile (including private claims)",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved authenticated user's profile",
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid Bearer token',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update authenticated user's basic profile fields",
    description:
      'Allows updating basic profile attributes such as display name for the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input fields',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid Bearer token',
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateBasicProfile(user.userId, updateProfileDto);
  }

  @Post('me/skills')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a skill to the current user profile' })
  @ApiResponse({ status: 200, description: 'Skill successfully appended' })
  @ApiResponse({ status: 400, description: 'Invalid skill format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() addSkillDto: AddSkillDto,
  ) {
    return this.usersService.addSkill(user.userId, addSkillDto.skill);
  }

  @Delete('me/skills/:skill')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a skill from the current user profile' })
  @ApiParam({ name: 'skill', description: 'Name of the skill to remove' })
  @ApiResponse({ status: 200, description: 'Skill successfully removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('skill') skill: string,
  ) {
    return this.usersService.removeSkill(user.userId, skill);
  }

  @Put('me/skills')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update/replace complete skills array' })
  @ApiResponse({ status: 200, description: 'Skills successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid skills array' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSkills(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSkillsDto: UpdateSkillsDto,
  ) {
    return this.usersService.updateSkills(user.userId, updateSkillsDto.skills);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get public developer profile by user ID',
    description:
      'Returns publicly accessible developer profile (name, role, skills, experiences). Sensitive fields like passwordHash are omitted.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the user',
    example: '66e138fc29094e137127e4e0',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved developer profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Developer profile not found',
  })
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfileById(id);
  }
}
