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
