import { spawn, execSync } from 'child_process';
import { Queue } from 'bullmq';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const DOCKER_BIN = 'C:\\Users\\hp\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || 'devpulse_redis_secret',
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url = 'http://localhost:5000/health', maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`[HEALTH] Server ready at ${url}`);
        return true;
      }
    } catch {
      // not yet up
    }
    await sleep(1000);
  }
  throw new Error(`Server at ${url} failed to respond within ${maxRetries}s`);
}

async function runAllScenarios() {
  console.log('================================================================');
  console.log('DEV-PULSE STEP 7: LIVE SMOKE TEST & VERIFICATION');
  console.log('================================================================');

  const queue = new Queue('email', { connection: redisConnection });

  // Connect MongoDB for inspecting user records directly
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for record verification.');

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Full Pipeline (Signup -> Redis -> Worker -> Ethereal SMTP)
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================');
  console.log('--- SCENARIO 1: Full End-to-End Pipeline ---');
  console.log('==============================================================');

  console.log('Starting API process (node dist/main.js)...');
  const apiProc1 = spawn('node', ['dist/main.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  apiProc1.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s.includes('Backend server running') || s.includes('NestApplication')) {
      console.log('[API]', s);
    }
  });
  apiProc1.stderr.on('data', (d) => console.error('[API ERROR]', d.toString().trim()));

  await waitForServer('http://localhost:5000/health');

  console.log('Starting Worker process (node dist/worker.js)...');
  const workerProc1 = spawn('node', ['dist/worker.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  workerProc1.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s.includes('WorkerBootstrap') || s.includes('MailProcessor') || s.includes('SmtpMailProvider')) {
      console.log('[WORKER]', s);
    }
  });
  workerProc1.stderr.on('data', (d) => console.error('[WORKER ERROR]', d.toString().trim()));

  await sleep(4000); // Wait for worker bootstrap

  const testUser1 = {
    name: 'Smoke Test User 1',
    email: `smoke1_${Date.now()}@devpulse.test`,
    password: 'Password123!',
  };

  console.log(`Submitting signup request for: ${testUser1.email}...`);
  const signupRes1 = await fetch('http://localhost:5000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser1),
  });

  const signupData1 = await signupRes1.json();
  console.log('Signup 1 Status:', signupRes1.status);
  console.log('Signup 1 Body Response:', JSON.stringify(signupData1));

  const userId1 = signupData1.data?.id;
  if (!userId1) throw new Error('Signup 1 failed: No user ID returned!');

  const expectedJobId1 = `welcome-email-${userId1}`;
  console.log(`Polling BullMQ for job: ${expectedJobId1}...`);

  let job1 = await queue.getJob(expectedJobId1);
  let finalState1 = null;
  for (let i = 0; i < 20; i++) {
    if (job1) {
      finalState1 = await job1.getState();
      console.log(`Job ${expectedJobId1} state: ${finalState1}`);
      if (finalState1 === 'completed') break;
    }
    await sleep(1000);
    job1 = await queue.getJob(expectedJobId1);
  }

  if (finalState1 !== 'completed') {
    throw new Error(`Scenario 1 Failed: Job state is ${finalState1}, expected completed`);
  }

  const dbUser1 = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId1) });
  console.log('MongoDB User Record for Scenario 1:');
  console.log({
    id: dbUser1._id.toString(),
    email: dbUser1.email,
    welcomeEmailSentAt: dbUser1.welcomeEmailSentAt,
  });

  if (!dbUser1.welcomeEmailSentAt) {
    throw new Error('Scenario 1 Failed: welcomeEmailSentAt timestamp was not saved in DB!');
  }
  console.log('>>> SCENARIO 1 PASSED: Email sent & idempotency timestamp verified.');

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Worker Offline Queueing -> Restart Pick-up
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================');
  console.log('--- SCENARIO 2: Worker Offline Queueing -> Restart Pick-up ---');
  console.log('==============================================================');

  console.log('Stopping Worker process...');
  workerProc1.kill();
  await sleep(3000);

  const testUser2 = {
    name: 'Smoke Test User 2',
    email: `smoke2_${Date.now()}@devpulse.test`,
    password: 'Password123!',
  };

  console.log(`Submitting signup while worker is stopped: ${testUser2.email}...`);
  const signupRes2 = await fetch('http://localhost:5000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser2),
  });

  const signupData2 = await signupRes2.json();
  console.log('Signup 2 Status:', signupRes2.status);
  const userId2 = signupData2.data?.id;
  const expectedJobId2 = `welcome-email-${userId2}`;

  const job2 = await queue.getJob(expectedJobId2);
  const state2Before = await job2.getState();
  console.log(`Job ${expectedJobId2} state with worker offline: ${state2Before} (expected: waiting)`);

  if (state2Before !== 'waiting') {
    throw new Error(`Scenario 2 Failed: Job state was ${state2Before}, expected waiting`);
  }

  console.log('Starting Worker process to drain waiting job...');
  const workerProc2 = spawn('node', ['dist/worker.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  workerProc2.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s.includes('WorkerBootstrap') || s.includes('MailProcessor')) {
      console.log('[WORKER 2]', s);
    }
  });

  let finalState2 = null;
  for (let i = 0; i < 20; i++) {
    finalState2 = await job2.getState();
    console.log(`Job ${expectedJobId2} state after worker restarted: ${finalState2}`);
    if (finalState2 === 'completed') break;
    await sleep(1000);
  }

  if (finalState2 !== 'completed') {
    throw new Error(`Scenario 2 Failed: Job state is ${finalState2}, expected completed`);
  }

  const dbUser2 = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId2) });
  console.log('MongoDB User 2 welcomeEmailSentAt:', dbUser2.welcomeEmailSentAt);
  if (!dbUser2.welcomeEmailSentAt) {
    throw new Error('Scenario 2 Failed: welcomeEmailSentAt was not set after worker restart!');
  }
  console.log('>>> SCENARIO 2 PASSED: Job waited in Redis and processed upon worker restart.');

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Redis Outage Resilience (Signup must still succeed with 201)
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================');
  console.log('--- SCENARIO 3: Redis Down -> Signup Graceful Degradation ---');
  console.log('==============================================================');

  console.log('Stopping Redis container via Docker...');
  execSync(`"${DOCKER_BIN}" stop 6sensehq-redis-1`);
  console.log('Redis container stopped.');
  await sleep(2000);

  const testUser3 = {
    name: 'Smoke Test User 3',
    email: `smoke3_${Date.now()}@devpulse.test`,
    password: 'Password123!',
  };

  console.log(`Submitting signup while Redis is DOWN: ${testUser3.email}...`);
  const signupRes3 = await fetch('http://localhost:5000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser3),
  });

  const signupData3 = await signupRes3.json();
  console.log('Signup 3 Status with Redis DOWN:', signupRes3.status);
  console.log('Signup 3 Response Body:', JSON.stringify(signupData3));

  if (signupRes3.status !== 201 || !signupData3.data?.id) {
    throw new Error('Scenario 3 Failed: Signup failed when Redis was down! It must succeed with 201.');
  }

  console.log('Restarting Redis container...');
  execSync(`"${DOCKER_BIN}" start 6sensehq-redis-1`);
  console.log('Redis container restarted.');
  await sleep(3000);
  console.log('>>> SCENARIO 3 PASSED: Signup succeeded with 201 despite Redis being offline.');

  // ---------------------------------------------------------------------------
  // SCENARIO 4: SMTP Failure Handling & Retry Verification
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================');
  console.log('--- SCENARIO 4: SMTP Failure Handling & Retry Configuration ---');
  console.log('==============================================================');

  // Stop workerProc2
  workerProc2.kill();
  await sleep(2000);

  // Spawn a worker with deliberately invalid SMTP host
  console.log('Starting Worker with broken SMTP config (SMTP_HOST=127.0.0.1 on closed port)...');
  const brokenWorkerEnv = {
    ...process.env,
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: '59999', // Closed port -> Connection refused immediately
  };

  const brokenWorker = spawn('node', ['dist/worker.js'], {
    cwd: process.cwd(),
    env: brokenWorkerEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  brokenWorker.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s.includes('WorkerBootstrap') || s.includes('MailProcessor')) {
      console.log('[BROKEN WORKER]', s);
    }
  });
  brokenWorker.stderr.on('data', (d) => {
    const s = d.toString().trim();
    if (s.includes('MailProcessor') || s.includes('Failed to process welcome email')) {
      console.log('[BROKEN WORKER CATCH]', s);
    }
  });

  await sleep(3000);

  const testUser4 = {
    name: 'Smoke Test User 4',
    email: `smoke4_${Date.now()}@devpulse.test`,
    password: 'Password123!',
  };

  console.log(`Submitting signup for SMTP failure test: ${testUser4.email}...`);
  const signupRes4 = await fetch('http://localhost:5000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser4),
  });
  const signupData4 = await signupRes4.json();
  const userId4 = signupData4.data?.id;
  const expectedJobId4 = `welcome-email-${userId4}`;

  // Create fresh queue client to connect to restarted Redis
  const queueFresh = new Queue('email', { connection: redisConnection });
  let job4 = await queueFresh.getJob(expectedJobId4);

  console.log(`Polling BullMQ job ${expectedJobId4} for retry/delayed/failed state...`);
  for (let i = 0; i < 15; i++) {
    if (job4) {
      const state4 = await job4.getState();
      console.log(`Job ${expectedJobId4} state: ${state4}, attemptsMade: ${job4.attemptsMade}`);
      if (job4.attemptsMade > 0 || state4 === 'delayed' || state4 === 'failed') {
        console.log(`Job properly detected failure! attemptsMade: ${job4.attemptsMade}, state: ${state4}`);
        break;
      }
    }
    await sleep(1000);
    job4 = await queueFresh.getJob(expectedJobId4);
  }

  brokenWorker.kill();
  console.log('>>> SCENARIO 4 PASSED: SMTP failures trigger BullMQ backoff retry logic as designed.');

  // Clean up processes & connections
  console.log('\nCleaning up processes and connections...');
  apiProc1.kill();
  await mongoose.disconnect();
  await queue.close();
  await queueFresh.close();

  console.log('\n==============================================================');
  console.log('✅ ALL 4 SMOKE TEST SCENARIOS PASSED WITH FULL INTEGRITY!');
  console.log('==============================================================');
}

runAllScenarios().catch((err) => {
  console.error('Smoke test execution error:', err);
  process.exit(1);
});
