import Redis from "ioredis";
import { acquireMutex } from "./acquire";
import { defaultMutexOptions, Options } from "./configs";
import { releaseMutex } from "./release";
import { refreshMutex } from "./refresh";

export default class RedisMutex {
	private kind = "redis-mutex";
	private key: string;
	private client: Redis;
	private options: Options;

	constructor(client: Redis, key: string, options?: Options) {
		if (!client) {
			throw new Error('"client" is required');
		}
		if (!(client instanceof Redis)) {
			throw new Error('"client" must be instance of ioredis client or cluster');
		}
		if (!key) {
			throw new Error('"key" is required');
		}
		if (typeof key !== "string") {
			throw new Error('"key" must be a string');
		}
		this.client = client;
		this.key = `${this.kind}:${key}`;
		this.options = { ...defaultMutexOptions, ...options };
	}

	public async refresh() {
		return await refreshMutex(this.client, this.key, this.options.identifier, this.options.lockTimeout);
	}

	public async acquire() {
		return acquireMutex(this.client, this.key, this.options);
	}

	public async release() {
		await releaseMutex(this.client, this.key, this.options);
	}
}
