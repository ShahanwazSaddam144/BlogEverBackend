// lib/redisUtils.js
import Redis from "ioredis";

let redisClient;

/**
 * Initialize Redis client (singleton)
 */
export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      // optional configs
      lazyConnect: true, // connect only when first command is issued
      maxRetriesPerRequest: null, // prevent auto-fail
      enableOfflineQueue: true,
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });
  }
  return redisClient;
}

/**
 * Generic helpers
 */
export async function redisSet(key, value, ttlSeconds = null) {
  const client = getRedisClient();
  const val = typeof value === "string" ? value : JSON.stringify(value);
  if (ttlSeconds) {
    return client.set(key, val, "EX", ttlSeconds);
  }
  return client.set(key, val);
}

export async function redisGet(key) {
  const client = getRedisClient();
  const val = await client.get(key);
  if (!val) return null;

  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

export async function redisDel(key) {
  const client = getRedisClient();
  return client.del(key);
}

export async function redisExpire(key, ttlSeconds) {
  const client = getRedisClient();
  return client.expire(key, ttlSeconds);
}

/**
 * Atomic set if not exists (NX) with TTL
 * Useful for replay prevention / session creation
 */
export async function redisSetNX(key, value, ttlSeconds) {
  const client = getRedisClient();
  const val = typeof value === "string" ? value : JSON.stringify(value);
  // returns 1 if key was set, 0 if already exists
  return client.set(key, val, "NX", "EX", ttlSeconds);
}

/**
 * Session helpers
 * Each session stored as sess:{sessionToken}
 */
export async function createSession(sessionToken, sessionData, ttlSeconds = 2592000) {
  const key = `sess:${sessionToken}`;
  return redisSet(key, sessionData, ttlSeconds);
}

export async function getSession(sessionToken) {
  const key = `sess:${sessionToken}`;
  return redisGet(key);
}

export async function deleteSession(sessionToken) {
  const key = `sess:${sessionToken}`;
  return redisDel(key);
}

export async function extendSessionTTL(sessionToken, ttlSeconds = 2592000) {
  const key = `sess:${sessionToken}`;
  return redisExpire(key, ttlSeconds);
}
