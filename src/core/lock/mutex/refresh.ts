import Redis from "ioredis";
import createEval from "src/core/utils/createEval";

export const refreshIfEqualLua = createEval<[string, string, number], 0 | 1>(
	`
  local key = KEYS[1]
  local identifier = ARGV[1]
  local lockTimeout = ARGV[2]

  local value = redis.call('get', key)

  if value == identifier then
    redis.call('pexpire', key, lockTimeout)
    return 1
  elseif value == false then 
    redis.call('set', key, identifier)
    redis.call('pexpire', key, lockTimeout)
    return 1
  end

  return 0
  `,
	1,
);

export async function refreshMutex(
	client: Redis,
	key: string,
	identifier: string,
	lockTimeout: number,
): Promise<boolean> {
	return !!(await refreshIfEqualLua(client, [key, identifier, lockTimeout]));
}
