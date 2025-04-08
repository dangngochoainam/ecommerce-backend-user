import { ValueTransformer } from "typeorm";

export const bigintToNumber: ValueTransformer = {
	// tslint:disable-next-line:typedef
	to: (entityValue: bigint) => entityValue,
	from: (databaseValue: string): number => Number(databaseValue || 0),
};

export function transformArrayToMap<T>(
	data: Array<T[keyof T]>,
	keys: Array<keyof T>,
): T {
	const rs: T = {} as T;
	if (data.length !== keys.length) {
		throw new Error("Input length not match");
	}
	data.forEach((i: T[keyof T], index: number) => {
		rs[keys[index]] = i;
	});
	return rs;
}

export function mirrorAndFilter<T extends Record<string, unknown>>(
	target: T,
	filterValue: unknown,
	excludeKeys: Array<keyof T>,
): Partial<T> {
	return Object.entries(target).reduce((res, item) => {
		if (item[1] !== filterValue && !excludeKeys.includes(item[0])) {
			res[item[0] as keyof T] = item[1] as T[string];
		}
		return res;
	}, {} as Partial<T>);
}

export const JSONValueTransformer: ValueTransformer = {
	to: (entityValue: object) => entityValue,
	from: (databaseValue: string | object): object | string => {
		try {
			return typeof databaseValue === 'object' ? databaseValue :  JSON.parse(databaseValue);
		} catch (e) {
			return databaseValue;
		}
	},
};
