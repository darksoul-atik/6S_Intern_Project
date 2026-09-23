import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { GridFSBucket } from 'mongodb';

// Load environment variables from backend/.env
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function migrateAvatars() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI is not defined in environment.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not available');
    }

    const bucket = new GridFSBucket(db, { bucketName: 'avatars' });
    const usersCollection = db.collection('users');

    // Find users with base64 avatarUrl
    const users = await usersCollection
      .find({
        avatarUrl: { $regex: /^data:image\// },
      })
      .toArray();

    console.log(`📋 Found ${users.length} users with Base64 avatars to migrate:`);

    for (const user of users) {
      const userId = user._id.toString();
      const rawAvatar = user.avatarUrl as string;

      const matches = rawAvatar.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.warn(`⚠️ User ${user.name} (${userId}) has invalid base64 avatarUrl format, skipping.`);
        continue;
      }

      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      console.log(`  - Migrating ${user.name} (${userId}): ${contentType}, ${buffer.length} bytes`);

      // Clean up any existing GridFS file with this filename
      const existingFiles = await bucket.find({ filename: userId }).toArray();
      for (const f of existingFiles) {
        await bucket.delete(f._id);
      }

      // Write buffer to GridFS
      const uploadStream = bucket.openUploadStream(userId, {
        metadata: { contentType, userId },
      });

      await new Promise<void>((resolvePromise, rejectPromise) => {
        uploadStream.end(buffer, () => resolvePromise());
        uploadStream.on('error', rejectPromise);
      });

      // Update MongoDB document with lightweight URL
      const newAvatarUrl = `/users/${userId}/avatar`;
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { avatarUrl: newAvatarUrl } },
      );

      console.log(`    ✅ Updated avatarUrl -> "${newAvatarUrl}"`);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

migrateAvatars();
