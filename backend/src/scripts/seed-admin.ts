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

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@devpulse.io')
    .toLowerCase()
    .trim();

  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SecurePass2026';

  /*
  |--------------------------------------------------------------------------
  | Security note
  |--------------------------------------------------------------------------
  |
  | Never log the MongoDB URI, even in partially masked form.
  | Connection strings may contain credentials and infrastructure details.
  |
  */

  console.log('🔌 Connecting to MongoDB...');

  try {
    await mongoose.connect(mongoUri);

    const UserModel =
      mongoose.models[User.name] || mongoose.model(User.name, UserSchema);

    const existingUser = await UserModel.findOne({
      email: adminEmail,
    });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(
          `ℹ️  Admin user already exists with role "admin": ${adminEmail}`,
        );
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
  } catch {
    /*
    |--------------------------------------------------------------------------
    | Do not dump raw database errors
    |--------------------------------------------------------------------------
    |
    | Raw Mongoose / MongoDB errors can include:
    | - connection details
    | - cluster hostnames
    | - internal configuration
    | - provider-specific metadata
    |
    */

    console.error(
      '❌ Failed to bootstrap admin. Check database connectivity and environment configuration.',
    );

    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
    }
  }
}

seedAdmin()
  .then(() => {
    if (!process.exitCode) {
      console.log('✨ Admin bootstrap process complete.');
    }
  })
  .catch(() => {
    console.error('💥 Unexpected error during admin bootstrap.');

    process.exitCode = 1;
  });
