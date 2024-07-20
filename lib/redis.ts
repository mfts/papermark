import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

export const lockerRedisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_LOCKER_URL as string,
  token: process.env.UPSTASH_REDIS_REST_LOCKER_TOKEN as string,
});
