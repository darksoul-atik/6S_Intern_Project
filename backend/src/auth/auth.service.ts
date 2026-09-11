import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { SignupDto } from './dto/signup.dto.js';

export interface UserResponseData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signup(signupDto: SignupDto): Promise<{ data: UserResponseData; message: string }> {
    const normalizedEmail = signupDto.email.toLowerCase().trim();

    // Check if email is already taken
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Hash the password with bcrypt (never store or log plain text)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(signupDto.password, saltRounds);

    // Explicitly enforce role as 'user' for public signup
    const newUser = await this.usersService.create({
      name: signupDto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    return {
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      message: 'User registered successfully',
    };
  }
}
