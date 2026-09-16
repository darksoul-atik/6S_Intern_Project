import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { User, UserSchema } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { ProfileOwnerOrAdminGuard } from './guards/profile-owner-or-admin.guard.js';
import { ProfileController } from './profile.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, ProfileOwnerOrAdminGuard],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
