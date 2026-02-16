import Redis from 'ioredis';

// if (!process.env.REDIS_URL) {
//   throw new Error('REDIS_URL is not defined');
// }

export const redis = new Redis("rediss://default:AWBaAAIncDJlYTQ4NjFiNzI4MmI0ZWRkYTU0NTZhN2ZmMTRmYzk4Y3AyMjQ2NjY@valid-firefly-24666.upstash.io:6379");

redis.on('connect', () => {
  console.log('[redis] ✅ Connected to Upstash');
});

redis.on('error', (err) => {
  console.error('[redis] ❌ Connection error:', err);
});
