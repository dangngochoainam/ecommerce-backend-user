import { Redis, Cluster } from "ioredis";

import { delIfEqualLua } from "../mutex/release";

export async function releaseRedlockMutex(
	clients: (Redis | Cluster)[],
	key: string,
	identifier: string,
): Promise<number> {
	const promises = clients.map((client) =>
		delIfEqualLua(client, [key, identifier])
			.then((result) => +result)
			.catch(() => 0),
	);
	const results = await Promise.all(promises);

	return results.reduce((acc, item) => acc + item, 0);
}
