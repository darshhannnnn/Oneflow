/**
 * Simple in-memory cache for optimizing API responses
 * For production, consider using Redis or similar
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each key
  }

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.ttl.set(key, expiresAt);
  }

  /**
   * Get a value from cache
   * Returns null if expired or not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      // Expired, remove from cache
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, expiresAt] of this.ttl.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }
}

// Singleton instance
const cache = new SimpleCache();

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

export default cache;

/**
 * Helper function to cache API responses
 * Usage: const data = await withCache('key', fetchFunction, ttl);
 */
export async function withCache(key, fetchFunction, ttlSeconds = 300) {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFunction();
  
  // Store in cache
  cache.set(key, data, ttlSeconds);
  
  return data;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern) {
  const keys = Array.from(cache.cache.keys());
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.delete(key);
    }
  });
}
