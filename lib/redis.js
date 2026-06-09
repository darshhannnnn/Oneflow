import Redis from 'ioredis';

// Redis client singleton
let redis = null;

/**
 * Get Redis client instance
 * @returns {Redis|null} Redis client or null if not configured
 */
export function getRedisClient() {
  // Skip Redis in development if not configured
  if (process.env.NODE_ENV === 'development' && !process.env.REDIS_HOST) {
    console.log('⚠️ Redis not configured for development - caching disabled');
    return null;
  }

  if (!redis && process.env.REDIS_HOST) {
    try {
      redis = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      redis.on('connect', () => {
        console.log('✅ Redis connected');
      });

      redis.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
      });

      redis.on('close', () => {
        console.log('⚠️ Redis connection closed');
      });

      // Connect
      redis.connect().catch((err) => {
        console.error('❌ Failed to connect to Redis:', err.message);
        redis = null;
      });
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error.message);
      redis = null;
    }
  }

  return redis;
}

/**
 * Cache wrapper with automatic JSON serialization
 */
export const cache = {
  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    const client = getRedisClient();
    if (!client) return null;

    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  },

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 300) {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const serialized = JSON.stringify(value);
      await client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  },

  /**
   * Delete cached value
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  },

  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    const client = getRedisClient();
    if (!client) return 0;

    try {
      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;
      
      await client.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Redis DEL PATTERN error:', error.message);
      return 0;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if exists
   */
  async exists(key) {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error.message);
      return false;
    }
  },

  /**
   * Get or set cached value (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fetched value
   */
  async getOrSet(key, fetchFn, ttl = 300) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache it
    await this.set(key, data, ttl);
    
    return data;
  },
};

export default cache;
