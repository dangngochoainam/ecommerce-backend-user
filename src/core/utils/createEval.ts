import { createHash } from "crypto";
import Redis, { Cluster } from "ioredis";

function createSHA1(script: string) {
	return createHash("sha1").update(script, "utf8").digest("hex");
}

function isNoScriptError(err: Error) {
	return err.toString().indexOf("NOSCRIPT") !== -1;
}

export default function createEval<Args extends Array<string | number>, Result>(script: string, keysCount: number) {
	const sha1 = createSHA1(script);
	return async function optimizedEval(client: Redis | Cluster, args: Args): Promise<Result> {
		try {
			return (await client.evalsha(sha1, keysCount, ...args)) as Result;
		} catch (error: any) {
			if (isNoScriptError(error)) {
				return client.eval(script, keysCount, ...args) as Result;
			}
			throw error;
		}
	};
}
