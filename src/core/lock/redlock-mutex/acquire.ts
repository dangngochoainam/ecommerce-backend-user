import Redis, { Cluster } from "ioredis";
import { getQuorum, Options, smartSum } from "./configs";
import { delIfEqualLua } from "../mutex/release";
import { delay } from "src/core/utils";

export async function acquireRedlockMutex(
	clients: (Redis | Cluster)[],
	key: string,
	options: Options,
): Promise<boolean> {
	const { identifier, lockTimeout, acquireTimeout, acquireAttemptsLimit, retryInterval } = options;

	let attempt = 0;
	const endAcquire = Date.now() + acquireTimeout;
	const quorum = getQuorum(clients.length);

	while (Date.now() < endAcquire && ++attempt <= acquireAttemptsLimit) {
		const promisesSet = clients.map((client) =>
			client
				.set(key, identifier, "PX", lockTimeout, "NX")
				.then((result) => (result === "OK" ? 1 : 0))
				.catch(() => 0),
		);
		const results = await Promise.all(promisesSet);
		if (results.reduce(smartSum, 0) >= quorum) {
			return true;
		}

		const promisesDel = clients.map((client) => delIfEqualLua(client, [key, identifier]).catch(() => 0));
		await Promise.all(promisesDel);

		await delay(retryInterval);
	}

	return false;
}
