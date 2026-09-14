import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto.js';
import { AddSkillDto, UpdateSkillsDto } from './dto/skills.dto.js';
import {
  CreateExperienceDto,
  UpdateExperienceDto,
} from './dto/experience.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { ProfileOwnerOrAdminGuard } from './guards/profile-owner-or-admin.guard.js';

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

  @Post('me/experiences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new work experience to profile' })
  @ApiResponse({ status: 200, description: 'Experience successfully added' })
  @ApiResponse({ status: 400, description: 'Validation error in experience payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createExpDto: CreateExperienceDto,
  ) {
    return this.usersService.addExperience(user.userId, createExpDto);
  }

  @Patch('me/experiences/:experienceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing work experience entry' })
  @ApiParam({ name: 'experienceId', description: 'ID of the experience subdocument' })
  @ApiResponse({ status: 200, description: 'Experience successfully updated' })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
    @Body() updateExpDto: UpdateExperienceDto,
  ) {
    return this.usersService.updateExperience(
      user.userId,
      experienceId,
      updateExpDto,
    );
  }

  @Delete('me/experiences/:experienceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a work experience entry' })
  @ApiParam({ name: 'experienceId', description: 'ID of the experience subdocument' })
  @ApiResponse({ status: 200, description: 'Experience successfully deleted' })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
  ) {
    return this.usersService.removeExperience(user.userId, experienceId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all signed-up users with pagination (Admin only)',
    description:
      'Returns a paginated list of all users, supporting optional search keyword and deletion status filters.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'alex' })
  @ApiQuery({ name: 'includeDeleted', required: false, example: true })
  @ApiResponse({ status: 200, description: 'Paginated user list retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    return this.usersService.findAllUsers({
      page: pageNum,
      limit: limitNum,
      search,
      includeDeleted: includeDeleted === 'true' || includeDeleted === '1' || includeDeleted === undefined,
    });
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ProfileOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update user profile by ID (Owner or Admin)",
    description:
      'Allows updating basic profile fields for the specified user ID. Only accessible by the account owner or an admin.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cannot edit another user profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfileById(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateBasicProfile(id, updateProfileDto);
  }

  @Post(':id/skills')
  @UseGuards(JwtAuthGuard, ProfileOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a skill to a user profile (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'Skill successfully appended' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addSkillById(
    @Param('id') id: string,
    @Body() addSkillDto: AddSkillDto,
  ) {
    return this.usersService.addSkill(id, addSkillDto.skill);
  }

  @Delete(':id/skills/:skill')
  @UseGuards(JwtAuthGuard, ProfileOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a skill from a user profile (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiParam({ name: 'skill', description: 'Name of the skill to remove' })
  @ApiResponse({ status: 200, description: 'Skill successfully removed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async removeSkillById(
    @Param('id') id: string,
    @Param('skill') skill: string,
  ) {
    return this.usersService.removeSkill(id, skill);
  }

  @Put(':id/skills')
  @UseGuards(JwtAuthGuard, ProfileOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update/replace complete skills array (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'Skills successfully updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateSkillsById(
    @Param('id') id: string,
    @Body() updateSkillsDto: UpdateSkillsDto,
  ) {
    return this.usersService.updateSkills(id, updateSkillsDto.skills);
  }

  @Post(':id/experiences')
  @UseGuards(JwtAuthGuard, ProfileOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new work experience to profile (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'Experience successfully added' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addExperienceById(
    @Param('id') id: string,
    @Body() createExpDto: CreateExperienceDto,
  ) {
    return this.usersService.addExperience(id, createExpDto);
  }

  @Patch(':id/experiences/:experienceId')
  @UseGuards(JwtAuthGuard, ProfileOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update work experience entry by ID (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiParam({ name: 'experienceId', description: 'ID of the experience subdocument' })
  @ApiResponse({ status: 200, description: 'Experience successfully updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User or Experience not found' })
  async updateExperienceById(
    @Param('id') id: string,
    @Param('experienceId') experienceId: string,
    @Body() updateExpDto: UpdateExperienceDto,
  ) {
    return this.usersService.updateExperience(id, experienceId, updateExpDto);
  }

  @Delete(':id/experiences/:experienceId')
  @UseGuards(JwtAuthGuard, ProfileOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove work experience entry by ID (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiParam({ name: 'experienceId', description: 'ID of the experience subdocument' })
  @ApiResponse({ status: 200, description: 'Experience successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User or Experience not found' })
  async removeExperienceById(
    @Param('id') id: string,
    @Param('experienceId') experienceId: string,
  ) {
    return this.usersService.removeExperience(id, experienceId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft-delete user account (Admin only)',
    description:
      'Marks user as deleted so they cannot log in. Login will respond that the profile was deleted by an admin.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user to delete' })
  @ApiResponse({ status: 200, description: 'User account marked as deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete own admin account' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    return this.usersService.deleteUser(id, adminUser.userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore soft-deleted user account (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user to restore' })
  @ApiResponse({ status: 200, description: 'User account restored successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restoreUser(@Param('id') id: string) {
    return this.usersService.restoreUser(id);
  }

  @Patch(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin edit of any user details (Admin only)',
    description:
      'Allows an administrator to modify any user attribute including display name, email, role, and professional title.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user to update' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already registered' })
  async adminUpdateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, dto);
  }
}
