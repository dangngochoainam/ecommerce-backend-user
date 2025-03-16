import Redis from "ioredis";
import {delay} from "src/core/utils";
import {Options} from "./configs";

export async function acquireMutex(client: Redis, key: string, options: Options): Promise<boolean> {
    const {identifier, lockTimeout, acquireTimeout, acquireAttemptsLimit, retryInterval} = options;

    let acquireAttempt = 0;
    const endAcquire = Date.now() + acquireTimeout;

    while (Date.now() < endAcquire || ++acquireAttempt <= acquireAttemptsLimit) {
        const result = await client.set(key, identifier, "PX", lockTimeout, "NX");
        if (result === "OK") {
            return true;
        }
        await delay(retryInterval);
    }
    return false;
}
