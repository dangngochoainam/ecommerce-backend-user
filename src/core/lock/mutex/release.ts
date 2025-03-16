import { Redis } from "ioredis";
import { Options } from "./configs";
import createEval from "src/core/utils/createEval";

export const delIfEqualLua = createEval<[string, string], 0 | 1>(
	`
  local key = KEYS[1]
  local identifier = ARGV[1]

  if redis.call('get', key) == identifier then
    return redis.call('del', key)
  end

  return 0
  `,
	1,
);
export async function releaseMutex(client: Redis, key: string, options: Options): Promise<number> {
	return delIfEqualLua(client, [key, options.identifier]);
}
