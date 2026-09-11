import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { User, UserSchema } from '../users/schemas/user.schema.js';

// Load environment variables from backend/.env
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI is not defined in environment.');
    process.exit(1);
  }

  const adminName = process.env.ADMIN_NAME || 'DevPulse Administrator';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@devpulse.io').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SecurePass2026';

  console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}...`);
  await mongoose.connect(mongoUri);

  const UserModel = mongoose.models[User.name] || mongoose.model(User.name, UserSchema);

  try {
    const existingUser = await UserModel.findOne({ email: adminEmail });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`ℹ️  Admin user already exists with role "admin": ${adminEmail}`);
      } else {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`✅ Promoted existing user ${adminEmail} to role "admin".`);
      }
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const newAdmin = new UserModel({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
      });
      await newAdmin.save();
      console.log(`🎉 Successfully created initial admin user: ${adminEmail}`);
    }
  } catch (error) {
    console.error('❌ Failed to bootstrap admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

seedAdmin()
  .then(() => {
    console.log('✨ Admin bootstrap process complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Unexpected error during admin bootstrap:', err);
    process.exit(1);
  });
