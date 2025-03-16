import Redis, { Cluster } from "ioredis";
import { refreshIfEqualLua } from "../mutex/refresh";
import { getQuorum, smartSum } from "./configs";

export async function refreshRedlockMutex(
	clients: (Redis | Cluster)[],
	key: string,
	identifier: string,
	lockTimeout: number,
): Promise<boolean> {
	const quorum = getQuorum(clients.length);
	const promises = clients.map((client) =>
		refreshIfEqualLua(client, [key, identifier, lockTimeout])
			.then((result) => +result)
			.catch(() => 0),
	);
	const results = await Promise.all(promises);

	return results.reduce(smartSum, 0) >= quorum;
}
