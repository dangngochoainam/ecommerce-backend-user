import { v4 } from "uuid";

export interface Options {
	identifier: string;
	lockTimeout: number;
	acquireTimeout: number;
	acquireAttemptsLimit: number;
	retryInterval: number;
}

export const defaultMutexOptions: Options = {
	identifier: v4(),
	lockTimeout: 10000,
	acquireTimeout: 6000,
	acquireAttemptsLimit: 5,
	retryInterval: 1000,
};

export function getQuorum(clientCount: number) {
	return Math.round((clientCount + 1) / 2);
}

export function smartSum(count: number, zeroOrOne: number) {
	return count + zeroOrOne;
}
