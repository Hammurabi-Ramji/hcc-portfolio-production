/**
 * In-Memory LRU Cache (replaces Redis)
 * Suitable for single-node deployments and local development
 */
export class LRUCache<K, V> {
	private cache: Map<K, V>;
	private readonly maxSize: number;
	private readonly ttlMs: number;
	private timeouts: Map<K, NodeJS.Timeout> = new Map();

	constructor(maxSize: number = 1000, ttlMs: number = 3600000) {
		this.cache = new Map();
		this.maxSize = maxSize;
		this.ttlMs = ttlMs;
	}

	set(key: K, value: V, ttlMs?: number): void {
		// Clear existing timeout
		if (this.timeouts.has(key)) {
			clearTimeout(this.timeouts.get(key)!);
		}

		// Evict oldest if at capacity
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
			this.timeouts.delete(firstKey);
		}

		this.cache.set(key, value);

		// Set TTL
		const timeout = setTimeout(() => {
			this.cache.delete(key);
			this.timeouts.delete(key);
		}, ttlMs ?? this.ttlMs);

		this.timeouts.set(key, timeout);
	}

	get(key: K): V | undefined {
		return this.cache.get(key);
	}

	has(key: K): boolean {
		return this.cache.has(key);
	}

	delete(key: K): void {
		this.cache.delete(key);
		if (this.timeouts.has(key)) {
			clearTimeout(this.timeouts.get(key)!);
			this.timeouts.delete(key);
		}
	}

	clear(): void {
		this.cache.clear();
		this.timeouts.forEach((timeout) => clearTimeout(timeout));
		this.timeouts.clear();
	}

	size(): number {
		return this.cache.size;
	}
}

// Global cache instance (session storage, API caching, etc.)
export const globalCache = new LRUCache<string, any>(5000, 3600000);
